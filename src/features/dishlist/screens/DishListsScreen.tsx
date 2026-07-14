import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { Search, Plus, WifiOff } from "lucide-react-native";
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
import Avatar from "@components/ui/Avatar";
import { ScreenHeader, ScreenHeaderAction } from "@components/ui";
import { useDishLists } from "../hooks";
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
  const { user, userProfile } = useAuth();
  const pagerRef = useRef<PagerView>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [showNetworkIndicator, setShowNetworkIndicator] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentTabKey = TAB_TO_API_PARAM[TAB_LABELS[activeTab]];

  const {
    dishLists,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    dataUpdatedAt,
    refetch,
  } = useDishLists({ tab: currentTabKey, searchQuery });

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

  // Fallback for the header avatar — AuthContext already loads the profile
  // on sign-in, so only fetch here if that failed and we have nothing.
  const { data: currentUserProfile } = useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: profileService.getCurrentUserProfile,
    enabled: !!user?.id && !userProfile,
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
    if (user?.id) {
      navigation.navigate("Profile", { userId: user.id });
    }
  }, [navigation, user?.id]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  const headerAvatarUrl =
    userProfile?.avatarUrl ??
    currentUserProfile?.user?.avatarUrl ??
    undefined;
  const headerProfile = userProfile ?? currentUserProfile?.user;

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
      <DishListGrid
        dishLists={dishLists}
        isFetching={isFetching}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
            title={
              refreshing
                ? "Updating..."
                : getDataFreshness() || "Pull to refresh"
            }
            titleColor={theme.colors.neutral[500]}
          />
        }
        onEndReached={handleEndReached}
        ListFooterComponent={
          <>
            {isFetchingNextPage && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary[500]}
                style={styles.footerLoader}
              />
            )}
            {!isOnline && dishLists.length > 0 && (
              <View style={styles.offlineMessage}>
                <WifiOff size={16} color="#666" />
                <Text style={styles.offlineText}>
                  Showing cached data • Last updated {getDataFreshness()}
                </Text>
              </View>
            )}
          </>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {showNetworkIndicator && <NetworkIndicator isOnline={isOnline} />}

      <ScreenHeader
        title="DishLists"
        style={styles.header}
        titleStyle={styles.title}
        rightSlot={
          <View style={styles.headerActions}>
            {refreshing && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary[500]}
                style={styles.headerLoader}
              />
            )}
            <ScreenHeaderAction
              style={styles.addButton}
              onPress={handleCreateDishList}
              accessibilityRole="button"
              accessibilityLabel="Create DishList"
            >
              <Plus size={24} color={theme.colors.primary[500]} />
            </ScreenHeaderAction>
            <ScreenHeaderAction
              style={styles.profileButton}
              onPress={handleProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Avatar
                avatarUrl={headerAvatarUrl}
                firstName={headerProfile?.firstName}
                lastName={headerProfile?.lastName}
                username={headerProfile?.username}
                size={32}
              />
            </ScreenHeaderAction>
          </View>
        }
      />

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
    minHeight: 72,
  },
  title: {
    ...typography.editorialPageTitle,
    color: theme.colors.textPrimary,
  },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerLoader: { marginRight: theme.spacing.md },
  addButton: { padding: theme.spacing.sm },
  profileButton: { padding: theme.spacing.xs },
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
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
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
