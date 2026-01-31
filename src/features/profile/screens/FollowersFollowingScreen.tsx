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
import { MoveLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useFollowers, useFollowing } from "../hooks/useFollowList";
import { FollowListUserItem } from "../components/FollowListUserItem";
import type { FollowListUser } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "FollowersFollowing">;

type Tab = "followers" | "following";

export default function FollowersFollowingScreen({ navigation, route }: Props) {
  const { userId, initialTab, displayName } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const pagerRef = useRef<PagerView>(null);

  const { data: followersData, isLoading: followersLoading, refetch: refetchFollowers } = useFollowers(userId);
  const { data: followingData, isLoading: followingLoading, refetch: refetchFollowing } = useFollowing(userId);

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MoveLeft size={24} color={theme.colors.neutral[700]} />
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
              data={followersData?.users || []}
              renderItem={renderFollowerItem}
              keyExtractor={(item) => item.uid}
              ListEmptyComponent={() => renderEmptyState("followers")}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={refetchFollowers}
              refreshing={false}
            />
          )}
        </View>

        {/* Following Tab */}
        <View key="following" style={styles.page}>
          {followingLoading ? (
            renderLoadingState()
          ) : (
            <FlatList
              data={followingData?.users || []}
              renderItem={renderFollowingItem}
              keyExtractor={(item) => item.uid}
              ListEmptyComponent={() => renderEmptyState("following")}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={refetchFollowing}
              refreshing={false}
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
    ...typography.heading3,
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
});