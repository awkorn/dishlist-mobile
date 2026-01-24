import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { Search, Plus, WifiOff, User } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import NetInfo from "@react-native-community/netinfo";
import { useQuery } from "@tanstack/react-query";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { QueryErrorBoundary } from "@providers/ErrorBoundary";
import { queryKeys } from "@lib/queryKeys";
import { profileService } from "@features/profile/services/profileService";
import { RootStackParamList } from "@app-types/navigation";
import { useDishLists, usePrefetchDishLists } from "../hooks";
import {
  DishListGrid,
  DishListEmptyState,
  DishListErrorState,
  NetworkIndicator,
  SkeletonTile,
} from "../components";
import { TAB_LABELS, TAB_TO_API_PARAM, DishListTabLabel } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DishListsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { prefetchDishLists } = usePrefetchDishLists();
  const pagerRef = useRef<PagerView>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [showNetworkIndicator, setShowNetworkIndicator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentTabKey = TAB_TO_API_PARAM[TAB_LABELS[activeTab]];

  const { dishLists, isLoading, isError, isFetching, dataUpdatedAt, refetch } =
    useDishLists({ tab: currentTabKey, searchQuery });

  // Prefetch on mount
  useEffect(() => {
    prefetchDishLists();
  }, [prefetchDishLists]);

  // Network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected ?? true;

      setIsOnline(isNowOnline);

      if (wasOffline && isNowOnline) {
        setShowNetworkIndicator(true);
        refetch();
        setTimeout(() => setShowNetworkIndicator(false), 3000);
      } else if (!isNowOnline) {
        setShowNetworkIndicator(true);
      }
    });

    return () => unsubscribe();
  }, [isOnline, refetch]);

  // User profile for avatar
  const { data: userProfile } = useQuery({
    queryKey: queryKeys.users.profile(user?.uid || ""),
    queryFn: () => profileService.getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 10 * 60 * 1000,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateDishList = useCallback(() => {
    navigation.navigate("CreateDishList", {});
  }, [navigation]);

  const handleProfilePress = useCallback(() => {
    if (user?.uid) {
      navigation.navigate("Profile", { userId: user.uid });
    }
  }, [navigation, user?.uid]);

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageSelected = useCallback((e: any) => {
    setActiveTab(e.nativeEvent.position);
  }, []);

  const getDataFreshness = useCallback(() => {
    if (!dataUpdatedAt) return null;
    const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  }, [dataUpdatedAt]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.grid}>
          {[...Array(6)].map((_, index) => (
            <SkeletonTile key={index} index={index} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <DishListErrorState isOffline={!isOnline} onRetry={handleRefresh} />
      );
    }

    if (dishLists.length === 0) {
      return (
        <DishListEmptyState
          searchQuery={searchQuery}
          activeTab={TAB_LABELS[activeTab]}
          onCreatePress={handleCreateDishList}
        />
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
        <DishListGrid dishLists={dishLists} isFetching={isFetching} />

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
  };

  return (
    <SafeAreaView style={styles.container}>
      {showNetworkIndicator && <NetworkIndicator isOnline={isOnline} />}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DishLists</Text>
        <View style={styles.headerActions}>
          {refreshing && (
            <ActivityIndicator
              size="small"
              color="#8FA79B"
              style={styles.headerLoader}
            />
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateDishList}
          >
            <Plus size={24} color="#8FA79B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            {userProfile?.user?.avatarUrl ? (
              <Image
                source={{ uri: userProfile.user.avatarUrl }}
                style={styles.profileAvatar}
              />
            ) : (
              <User size={24} color={theme.colors.neutral[600]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={theme.colors.neutral[400]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search DishLists"
          placeholderTextColor={theme.colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TAB_LABELS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => handleTabPress(index)}
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
      <QueryErrorBoundary onRetry={handleRefresh}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {TAB_LABELS.map((_, index) => (
            <View key={index} style={styles.page}>
              {activeTab === index && renderContent()}
            </View>
          ))}
        </PagerView>
      </QueryErrorBoundary>
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
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerLoader: { marginRight: theme.spacing.md },
  addButton: { padding: theme.spacing.sm },
  profileButton: {
    padding: theme.spacing.xs,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: theme.colors.neutral[800],
    padding: 0,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    flexWrap: "wrap",
  },
  tab: { paddingHorizontal: 14, paddingVertical: theme.spacing.sm },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: { ...typography.body, color: theme.colors.neutral[500] },
  activeTabText: { color: theme.colors.primary[600], fontWeight: "600" },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
  },
  scrollContent: { paddingBottom: 100 },
  offlineMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  offlineText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
});
