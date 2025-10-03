import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { Search, Plus, Wifi, WifiOff } from "lucide-react-native";
import {
  useQuery,
} from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { typography } from "../../styles/typography";
import DishListTile from "../../components/dishlist/DishListTile";
import { getDishLists, DishList } from "../../services/api";
import { queryKeys } from "../../lib/queryKeys";
import { theme } from "../../styles/theme";
import { QueryErrorBoundary } from "../../providers/ErrorBoundary";

type TabType = "All" | "My DishLists" | "Collaborations" | "Following";

const { width } = Dimensions.get("window");
const tileWidth = (width - 60) / 2;

const layoutAnimConfig = {
  duration: 200,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
};

// Skeleton Tile
const SkeletonTile = ({ index }: { index: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[styles.skeletonContainer, { width: tileWidth, opacity }]}
    >
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonText} />
        <View style={styles.skeletonBadges}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonBadge} />
        </View>
      </View>
    </Animated.View>
  );
};

// Network Indicator
const NetworkIndicator = ({ isOnline }: { isOnline: boolean }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, animatedValue]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <Animated.View
      style={[
        styles.networkIndicator,
        {
          transform: [{ translateY }],
          backgroundColor: isOnline ? "#10B981" : "#EF4444",
        },
      ]}
    >
      {isOnline ? (
        <>
          <Wifi size={16} color="white" />
          <Text style={styles.networkText}>Back Online</Text>
        </>
      ) : (
        <>
          <WifiOff size={16} color="white" />
          <Text style={styles.networkText}>
            No Connection - Showing Cached Data
          </Text>
        </>
      )}
    </Animated.View>
  );
};

// Hook for DishLists
const useDishListsQuery = (tab: string, searchQuery: string) => {
  const query = useQuery<DishList[], Error>({
    queryKey: queryKeys.dishLists.list(tab),
    queryFn: () => getDishLists(tab),
    staleTime: tab === "my" ? 3 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes("No internet connection")) return false;
      return failureCount < 2;
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // prevent refetch flicker
    refetchInterval: false,
    placeholderData: (prev) => prev,
  });

  const filteredData = useMemo(() => {
    if (!query.data) return [];
    if (!searchQuery.trim()) return query.data;
    return query.data.filter((list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [query.data, searchQuery]);

  return {
    ...query,
    data: filteredData,
  };
};

export default function DishListsScreen({
  navigation,
  isPrefetching = false,
}: {
  navigation?: any;
  isPrefetching?: boolean;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [showNetworkIndicator, setShowNetworkIndicator] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // manual refresh only

  const pagerRef = useRef<PagerView>(null);

  const tabs: TabType[] = [
    "All",
    "My DishLists",
    "Collaborations",
    "Following",
  ];
  const tabToApiParam = {
    All: "all",
    "My DishLists": "my",
    Collaborations: "collaborations",
    Following: "following",
  } as const;

  const currentTabKey = tabToApiParam[tabs[activeTab]];

  const {
    data: dishLists = [],
    isLoading,
    isError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useDishListsQuery(currentTabKey, searchQuery);

  // Network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;

      setIsOnline(isNowOnline);

      if (wasOffline !== !isNowOnline) {
        setShowNetworkIndicator(true);
        setTimeout(() => setShowNetworkIndicator(false), 3000);
        if (isNowOnline && wasOffline) refetch();
      }
    });
    return () => unsubscribe();
  }, [isOnline, refetch]);

  useEffect(() => {
    LayoutAnimation.configureNext(layoutAnimConfig);
  }, [dishLists.length]);

  const handleTabChange = useCallback(
    (index: number) => {
      if (searchQuery) setSearchQuery("");
      setActiveTab(index);
      pagerRef.current?.setPage(index);
    },
    [searchQuery]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateDishList = useCallback(() => {
    navigation.navigate("CreateDishList");
  }, [navigation]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    LayoutAnimation.configureNext(layoutAnimConfig);
  }, []);

  const getDataFreshness = useCallback(() => {
    if (!dataUpdatedAt) return null;
    const now = Date.now();
    const age = now - dataUpdatedAt;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  }, [dataUpdatedAt]);

  const renderContent = useCallback(() => {
    // Show skeletons during initial prefetch OR when loading with no data
    if ((isPrefetching || isLoading) && dishLists.length === 0) {
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <SkeletonTile key={`skeleton-${index}`} index={index} />
              ))}
          </View>
        </ScrollView>
      );
    }

    if (isError && dishLists.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Unable to Load DishLists</Text>
          <Text style={styles.errorText}>
            {!isOnline
              ? "You're offline and no cached data is available"
              : "Something went wrong. Please try again."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (dishLists.length === 0 && !isLoading) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No Results Found" : "No DishLists Yet"}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No DishLists match "${searchQuery}"`
              : tabs[activeTab] === "My DishLists"
              ? "Tap the + button to create your first DishList"
              : `You don't have any ${tabs[activeTab].toLowerCase()} yet`}
          </Text>
          {!searchQuery && tabs[activeTab] === "My DishLists" && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateDishList}
            >
              <Plus size={20} color="white" />
              <Text style={styles.createButtonText}>Create DishList</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
            title={
              refreshing
                ? "Updating..."
                : getDataFreshness() || "Pull to refresh"
            }
            titleColor="#666"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {dishLists.map((dishList) => (
            <Animated.View
              key={dishList.id}
              style={{ opacity: isFetching ? 0.7 : 1 }}
            >
              <DishListTile dishList={dishList} />
            </Animated.View>
          ))}
        </View>

        {!isOnline && dishLists.length > 0 && (
          <View style={styles.offlineMessage}>
            <WifiOff size={16} color="#666" />
            <Text style={styles.offlineText}>
              Showing cached data • Last updated {getDataFreshness()}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }, [
    isLoading,
    isError,
    refreshing,
    isFetching,
    dishLists,
    searchQuery,
    isOnline,
    activeTab,
    tabs,
    handleRefresh,
    handleCreateDishList,
    getDataFreshness,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {showNetworkIndicator && <NetworkIndicator isOnline={isOnline} />}

      <View style={styles.header}>
        <Text style={styles.title}>DishLists</Text>
        <View style={styles.headerActions}>
          {/* Show loader only during pull-to-refresh */}
          {refreshing && (
            <ActivityIndicator
              size="small"
              color="#2563eb"
              style={styles.headerLoader}
            />
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateDishList}
          >
            <Plus size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your DishLists"
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabChange(index)}
            style={[styles.tab, activeTab === index && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
        overdrag={true}
      >
        {tabs.map((tab, index) => (
          <View key={`page-${tab}`} style={styles.page}>
            <QueryErrorBoundary
              onRetry={handleRefresh}
              title="Unable to load DishLists"
              message="Check your connection and try again."
            >
              {Math.abs(activeTab - index) <= 1 ? renderContent() : null}
            </QueryErrorBoundary>
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerLoader: { marginRight: theme.spacing.md },
  title: { ...typography.heading2, color: theme.colors.textPrimary },
  addButton: { padding: theme.spacing.sm },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchIcon: { marginRight: theme.spacing.md },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: theme.colors.neutral[800],
    padding: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: 20,
    color: theme.colors.neutral[500],
    fontWeight: "300",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    flexWrap: "wrap",
  },
  tab: { paddingHorizontal: 14, paddingVertical: theme.spacing.sm },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary[50],
  },
  tabText: { ...typography.body, color: theme.colors.neutral[500] },
  activeTabText: { color: theme.colors.secondary[50], fontWeight: "600" },
  pager: { flex: 1 },
  page: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: 50,
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[800],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing["2xl"],
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: { ...typography.button, color: "white" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  createButtonText: { ...typography.button, color: "white" },
  offlineMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  offlineText: { ...typography.caption, color: theme.colors.neutral[500] },
  networkIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    zIndex: 1000,
    gap: theme.spacing.sm,
  },
  networkText: { color: "white", fontSize: 14, fontWeight: "500" },
  skeletonContainer: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  skeletonContent: { padding: theme.spacing.lg },
  skeletonTitle: {
    height: 20,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  skeletonText: {
    height: 16,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginBottom: theme.spacing.md,
    width: "70%",
  },
  skeletonBadges: { flexDirection: "row", gap: theme.spacing.sm },
  skeletonBadge: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
});
