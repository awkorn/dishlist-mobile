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
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  LayoutAnimation,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Search, Plus, Wifi, WifiOff } from "lucide-react-native";
import {
  useQuery,
  useQueryClient,
  useIsFetching,
  QueryFunctionContext,
} from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { typography } from "../../styles/typography";
import DishListTile from "../../components/dishlist/DishListTile";
import { getDishLists, DishList } from "../../services/api";
import { queryKeys } from '../../lib/queryKeys';
import { theme } from '../../styles/theme';

type TabType = "All" | "My DishLists" | "Collaborations" | "Following";

const { width } = Dimensions.get("window");
const tileWidth = (width - 60) / 2;

// Animation config for smooth transitions
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

// Skeleton component for loading states
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

// Network status indicator component
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

// Custom hook for DishLists
const useDishListsQuery = (tab: string, searchQuery: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<DishList[], Error>({
    queryKey: queryKeys.dishLists.list(tab),
    queryFn: async (_ctx: QueryFunctionContext) => {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        const cachedData = queryClient.getQueryData<DishList[]>([
          "dishLists",
          tab,
        ]);
        if (cachedData) {
          console.log(`Returning cached data for ${tab} (offline)`);
          return cachedData;
        }
        throw new Error("No internet connection and no cached data");
      }

      console.log(`Fetching fresh data for ${tab}`);
      return getDishLists(tab);
    },

    staleTime: tab === "my" ? 3 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    retry: (failureCount, error) => {
      if (error.message.includes("No internet connection")) return false;
      return failureCount < 2;
    },

    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    placeholderData: (prev) => prev, // keeps previous data
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

// Prefetch hook
const usePrefetchDishLists = () => {
  const queryClient = useQueryClient();

  const prefetchTab = useCallback(
    (tab: string) => {
      return queryClient.prefetchQuery({
        queryKey: ["dishLists", tab],
        queryFn: () => getDishLists(tab),
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const prefetchAdjacentTabs = useCallback(
    (currentIndex: number) => {
      const tabs = ["all", "my", "collaborations", "following"];
      const nextIndex = (currentIndex + 1) % tabs.length;
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;

      setTimeout(() => {
        prefetchTab(tabs[nextIndex]);
        prefetchTab(tabs[prevIndex]);
      }, 1000);
    },
    [prefetchTab]
  );

  return { prefetchTab, prefetchAdjacentTabs };
};

export default function DishListsScreen({ navigation }: { navigation?: any }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [showNetworkIndicator, setShowNetworkIndicator] = useState(false);

  const pagerRef = useRef<PagerView>(null);
  const isFetchingGlobal = useIsFetching();

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

  // Main data query
  const {
    data: dishLists = [],
    isLoading,
    isError,
    refetch,
    isFetching,
    isRefetching,
    dataUpdatedAt,
  } = useDishListsQuery(currentTabKey, searchQuery);

  // Prefetching
  const { prefetchAdjacentTabs } = usePrefetchDishLists();

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? false;

      setIsOnline(isNowOnline);

      // Show network indicator briefly when status changes
      if (wasOffline !== !isNowOnline) {
        setShowNetworkIndicator(true);
        setTimeout(() => setShowNetworkIndicator(false), 3000);

        // Refetch when coming back online
        if (isNowOnline && wasOffline) {
          refetch();
        }
      }
    });

    return () => unsubscribe();
  }, [isOnline, refetch]);

  // Prefetch adjacent tabs when idle
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchAdjacentTabs(activeTab);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeTab, prefetchAdjacentTabs]);

  // Animate layout changes
  useEffect(() => {
    LayoutAnimation.configureNext(layoutAnimConfig);
  }, [dishLists.length]);

  const handleTabChange = useCallback(
    (index: number) => {
      // Clear search when changing tabs
      if (searchQuery) {
        setSearchQuery("");
      }

      setActiveTab(index);
      pagerRef.current?.setPage(index);
    },
    [searchQuery]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCreateDishList = useCallback(() => {
    // Navigate to create screen modal
    navigation.navigate("CreateDishList");
  }, [navigation]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Animate layout when search results change
    LayoutAnimation.configureNext(layoutAnimConfig);
  }, []);

  // Calculate data freshness
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
    // Initial loading state
    if (isLoading && dishLists.length === 0) {
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

    // Error state
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

    // Empty state
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

    // Data display
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
            title={
              isRefetching
                ? "Updating..."
                : getDataFreshness() || "Pull to refresh"
            }
            titleColor="#666"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {dishLists.map((dishList, index) => (
            <Animated.View
              key={dishList.id}
              style={{
                opacity: 1,
                transform: [
                  {
                    translateY: 0,
                  },
                ],
              }}
            >
              <DishListTile dishList={dishList} />
            </Animated.View>
          ))}
        </View>

        {/* Offline indicator at bottom of list */}
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
    isRefetching,
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
      {/* Network Status Indicator */}
      {showNetworkIndicator && <NetworkIndicator isOnline={isOnline} />}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DishLists</Text>
        <View style={styles.headerActions}>
          {/* Global loading indicator */}
          {isFetchingGlobal > 0 && (
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

      {/* Subtle loading bar for background updates */}
      {isFetching && !isRefetching && dishLists.length > 0 && (
        <View style={styles.subtleLoadingBar}>
          <View style={styles.loadingBarProgress} />
        </View>
      )}

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

      {/* Content Pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
        overdrag={true}
      >
        {tabs.map((tab, index) => (
          <View key={`page-${tab}`} style={styles.page}>
            {/* Only render active tab content for performance */}
            {Math.abs(activeTab - index) <= 1 ? renderContent() : null}
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLoader: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  subtleLoadingBar: {
    height: 2,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.xl,
    borderRadius: 1,
    overflow: "hidden",
  },
  loadingBarProgress: {
    height: "100%",
    width: "30%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
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
  tab: {
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary[50],
  },
  tabText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
  activeTabText: {
    color: theme.colors.secondary[50],
    fontWeight: "600",
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
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
    paddingHorizontal: theme.spacing['4xl'],
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
    marginBottom: theme.spacing['2xl'],
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
    marginBottom: theme.spacing['2xl'],
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    ...typography.button,
    color: "white",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.sm,
  },
  createButtonText: {
    ...typography.button,
    color: "white",
  },
  offlineMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  offlineText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
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
  networkText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  // Skeleton styles
  skeletonContainer: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  skeletonContent: {
    padding: theme.spacing.lg,
  },
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
  skeletonBadges: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  skeletonBadge: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
});
