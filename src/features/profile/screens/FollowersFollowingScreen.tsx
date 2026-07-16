import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { ChevronLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { getErrorMessage } from "@utils";
import { useFollowers, useFollowing } from "../hooks/useFollowList";
import { FollowListUserItem } from "../components/FollowListUserItem";
import type { FollowListUser } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "FollowersFollowing">;

type Tab = "followers" | "following";

export default function FollowersFollowingScreen({ navigation, route }: Props) {
  const { userId, initialTab, displayName } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const pagerRef = useRef<PagerView>(null);

  const {
    data: followersData,
    isLoading: followersLoading,
    isError: followersError,
    error: followersErrorDetails,
    isFetching: followersFetching,
    isRefetching: followersRefreshing,
    isFetchingNextPage: followersFetchingNextPage,
    isFetchNextPageError: followersNextPageError,
    hasNextPage: hasMoreFollowers,
    fetchNextPage: fetchNextFollowers,
    refetch: refetchFollowers,
  } = useFollowers(userId, activeTab === "followers");
  const {
    data: followingData,
    isLoading: followingLoading,
    isError: followingError,
    error: followingErrorDetails,
    isFetching: followingFetching,
    isRefetching: followingRefreshing,
    isFetchingNextPage: followingFetchingNextPage,
    isFetchNextPageError: followingNextPageError,
    hasNextPage: hasMoreFollowing,
    fetchNextPage: fetchNextFollowing,
    refetch: refetchFollowing,
  } = useFollowing(userId, activeTab === "following");

  const followers =
    followersData?.pages.flatMap((page) => page.users) ?? [];
  const following =
    followingData?.pages.flatMap((page) => page.users) ?? [];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTabPress = (tab: Tab) => {
    const pageIndex = tab === "followers" ? 0 : 1;
    pagerRef.current?.setPage(pageIndex);
    setActiveTab(tab);
  };

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setActiveTab(position === 0 ? "followers" : "following");
  };

  const renderFollowerItem = ({ item }: { item: FollowListUser }) => (
    <FollowListUserItem user={item} showFollowButton />
  );

  const renderFollowingItem = ({ item }: { item: FollowListUser }) => (
    <FollowListUserItem user={item} showFollowButton={false} />
  );

  const renderEmptyState = (type: Tab) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {type === "followers" ? "No followers yet" : "Not following anyone yet"}
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary[500]} />
    </View>
  );

  const renderPageFooter = (
    hasPageError: boolean,
    isLoadingMore: boolean,
    onRetry: () => void
  ) => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (hasPageError) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerErrorText}>Unable to load more people.</Text>
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.footerRetryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const handleLoadMoreFollowers = () => {
    if (!hasMoreFollowers || followersFetchingNextPage) return;
    void fetchNextFollowers();
  };

  const handleLoadMoreFollowing = () => {
    if (!hasMoreFollowing || followingFetchingNextPage) return;
    void fetchNextFollowing();
  };

  const renderErrorState = (
    type: Tab,
    error: unknown,
    isRetrying: boolean,
    onRetry: () => void
  ) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>
        {type === "followers"
          ? "Unable to load followers"
          : "Unable to load following"}
      </Text>
      <Text style={styles.errorText}>
        {getErrorMessage(
          error,
          "Something went wrong. Please check your connection and try again."
        )}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
        onPress={onRetry}
        disabled={isRetrying}
      >
        <Text style={styles.retryButtonText}>
          {isRetrying ? "Trying..." : "Try Again"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName || "User"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.activeTab]}
          onPress={() => handleTabPress("followers")}
        >
          <Text style={[styles.tabText, activeTab === "followers" && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => handleTabPress("following")}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pager Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialTab === "followers" ? 0 : 1}
        onPageSelected={handlePageSelected}
      >
        {/* Followers Tab */}
        <View key="followers" style={styles.page}>
          {followersLoading ? (
            renderLoadingState()
          ) : (
            <FlatList
              data={followers}
              renderItem={renderFollowerItem}
              keyExtractor={(item) => item.uid}
              ListEmptyComponent={
                followersError
                  ? renderErrorState(
                      "followers",
                      followersErrorDetails,
                      followersFetching,
                      () => void refetchFollowers()
                    )
                  : renderEmptyState("followers")
              }
              contentContainerStyle={styles.listContent}
              ListFooterComponent={renderPageFooter(
                followersNextPageError,
                followersFetchingNextPage,
                () => void fetchNextFollowers()
              )}
              showsVerticalScrollIndicator={false}
              onRefresh={() => void refetchFollowers()}
              refreshing={followersRefreshing}
              onEndReached={handleLoadMoreFollowers}
              onEndReachedThreshold={0.4}
            />
          )}
        </View>

        {/* Following Tab */}
        <View key="following" style={styles.page}>
          {followingLoading ? (
            renderLoadingState()
          ) : (
            <FlatList
              data={following}
              renderItem={renderFollowingItem}
              keyExtractor={(item) => item.uid}
              ListEmptyComponent={
                followingError
                  ? renderErrorState(
                      "following",
                      followingErrorDetails,
                      followingFetching,
                      () => void refetchFollowing()
                    )
                  : renderEmptyState("following")
              }
              contentContainerStyle={styles.listContent}
              ListFooterComponent={renderPageFooter(
                followingNextPageError,
                followingFetchingNextPage,
                () => void fetchNextFollowing()
              )}
              showsVerticalScrollIndicator={false}
              onRefresh={() => void refetchFollowing()}
              refreshing={followingRefreshing}
              onEndReached={handleLoadMoreFollowing}
              onEndReachedThreshold={0.4}
            />
          )}
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...typography.navigationTitle,
    flex: 1,
    textAlign: "center",
    color: theme.colors.neutral[900],
  },
  headerSpacer: {
    width: 32, // Match back button width for centering
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: {
    ...typography.subtitle,
    color: theme.colors.neutral[500],
  },
  activeTabText: {
    color: theme.colors.primary[600],
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[900],
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    ...typography.button,
    color: theme.colors.onPrimary,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  footerErrorText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
  footerRetryText: {
    ...typography.button,
    color: theme.colors.primary[600],
  },
});
