import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { MoveLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { ProfileMenu } from "../components/ProfileMenu";
import { useProfile } from "../hooks/useProfile";
import { useBlockUser } from "../hooks/useBlockUser";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileTabs } from "../components/ProfileTabs";
import { EditProfileSheet } from "../components/EditProfileSheet";
import { DishListTile } from "@features/dishlist";
import RecipeTile from "@features/recipe/components/RecipeTile";
import { ProfileEmptyState } from "../components/ProfileEmptyState";
import { ShareModal } from "@features/share";
import { ReportContentModal } from "@components/moderation/ReportContentModal";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { getErrorMessage } from "@utils";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { signOut, user: authUser } = useAuth();

  const pagerRef = useRef<PagerView>(null);

  const {
    user,
    dishlists,
    recipes,
    allDishListsCount,
    allRecipesCount,
    displayName,
    activeTab,
    searchQuery,
    isSearchActive,
    isLoading,
    isRecipesLoading,
    isRecipesFetching,
    isFetchingNextRecipes,
    hasMoreRecipes,
    isError,
    error,
    refetch,
    refetchRecipes,
    fetchNextRecipes,
    setActiveTab,
    setSearchQuery,
    toggleSearch,
    closeSearch,
  } = useProfile(userId);
  const { block, unblock, isPending: isBlockPending } = useBlockUser({ userId });
  const isBlockedProfile = user?.blockStatus && user.blockStatus !== "NONE";

  // Defense-in-depth: only treat this as the user's own profile if the backend
  // says so AND the viewed profile's uid matches the logged-in Supabase user id.
  // The backend sets UserProfile.uid to the Supabase auth id (JWT `sub`), so
  // authUser.id === user.uid for one's own profile. authUser is always available
  // (set on session restore), unlike userProfile. This guards against stale
  // cached profile data (isOwnProfile: true) leaking across a logout/login.
  const isOwnProfile =
    !!user?.isOwnProfile && !!authUser?.id && authUser.id === user.uid;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    setShowEditSheet(true);
  };

  const handleShareProfile = () => {
    setShowShareModal(true);
  };

  const handleEditComplete = () => {
    setShowEditSheet(false);
    refetch();
    refetchRecipes();
  };

  const handleMenuPress = () => {
    setShowMenu((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleSettingsPress = () => {
    navigation.navigate("Settings");
  };

  const handleLogout = async () => {
    await signOut();
    // Navigation will auto-redirect to Login screen via MainNavigator
  };

  const handleBlockUser = () => {
    Alert.alert(
      "Block User",
      "This will remove direct follow and invite activity between you, hide profiles and content both ways, and prevent future follows, invites, and notifications.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => block(),
        },
      ]
    );
  };

  const handleReportUser = () => {
    setShowReportModal(true);
  };

  const handleUnblockUser = () => {
    unblock();
  };

  // Handle tab press - programmatically change page
  const handleTabChange = (tab: "DishLists" | "Recipes") => {
    const pageIndex = tab === "DishLists" ? 0 : 1;
    pagerRef.current?.setPage(pageIndex);
    setActiveTab(tab);
  };

  // Handle page swipe - update active tab
  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    const newTab = position === 0 ? "DishLists" : "Recipes";
    setActiveTab(newTab);
  };

  const handleFollowersPress = () => {
    if (user) {
      navigation.navigate("FollowersFollowing", {
        userId,
        initialTab: "followers",
        displayName,
      });
    }
  };

  const handleFollowingPress = () => {
    if (user) {
      navigation.navigate("FollowersFollowing", {
        userId,
        initialTab: "following",
        displayName,
      });
    }
  };

  const handleLoadMoreRecipes = () => {
    if (!hasMoreRecipes || isFetchingNextRecipes) return;
    fetchNextRecipes();
  };

  // Dynamic search placeholder based on active tab
  const searchPlaceholder =
    activeTab === "DishLists"
      ? "Search DishLists"
      : "Search recipes, tags, ingredients";

  // Get empty state message based on search and tab
  const getEmptyMessage = (isRecipeTab: boolean) => {
    if (searchQuery.trim()) {
      return isRecipeTab
        ? `No recipes found for "${searchQuery}"`
        : `No DishLists found for "${searchQuery}"`;
    }
    if (isRecipeTab) {
      return isOwnProfile
        ? "You don't have any recipes yet"
        : "No recipes in public DishLists";
    }
    return isOwnProfile
      ? "You don't have any public DishLists yet"
      : "No public DishLists";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingWrapper}>
        <SafeAreaView style={styles.loadingSafeArea} edges={["top"]} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={styles.loadingWrapper}>
        <SafeAreaView style={styles.loadingSafeArea} edges={["top"]} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load profile</Text>
          <Text style={styles.errorText}>
            {getErrorMessage(error, "Something went wrong. Please try again.")}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isBlockedProfile) {
    const blockedByCurrentUser =
      user.blockStatus === "BLOCKED_BY_ME" || user.blockStatus === "MUTUAL_BLOCK";

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]} />
        <View style={styles.blockedHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.blockedBackButton}>
            <MoveLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        <View style={styles.blockedContent}>
          <Text style={styles.blockedTitle}>
            {blockedByCurrentUser
              ? "You blocked this user"
              : "This profile is unavailable"}
          </Text>
          <Text style={styles.blockedText}>
            {blockedByCurrentUser
              ? "They cannot follow, invite, notify, or interact with you."
              : "You cannot view or interact with this profile."}
          </Text>
          {blockedByCurrentUser && (
            <TouchableOpacity
              style={[
                styles.unblockButton,
                isBlockPending && styles.unblockButtonDisabled,
              ]}
              onPress={handleUnblockUser}
              disabled={isBlockPending}
            >
              <Text style={styles.unblockButtonText}>
                {isBlockPending ? "Unblocking..." : "Unblock"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* White safe area for status bar */}
      <SafeAreaView style={styles.safeArea} edges={["top"]} />

      {/* Profile Header with icons, search, and user info */}
      <ProfileHeader
        user={user}
        displayName={displayName}
        onBackPress={handleBack}
        onEditPress={isOwnProfile ? handleEditProfile : undefined}
        onSharePress={isOwnProfile ? handleShareProfile : undefined}
        onMenuPress={handleMenuPress}
        isSearchActive={isSearchActive}
        searchQuery={searchQuery}
        onSearchToggle={toggleSearch}
        onSearchChange={setSearchQuery}
        searchPlaceholder={searchPlaceholder}
        onFollowersPress={handleFollowersPress}
        onFollowingPress={handleFollowingPress}
      />

      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Search Results Info */}
      {isSearchActive && searchQuery.trim() && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {activeTab === "DishLists"
              ? `${dishlists.length} of ${allDishListsCount} DishLists`
              : `${recipes.length} of ${allRecipesCount} recipes`}
          </Text>
        </View>
      )}

      {/* Swipeable Content with FlatList */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        scrollEnabled={true}
      >
        {/* DishLists Page */}
        <View style={styles.page} key="0">
          <FlatList
            data={dishlists}
            renderItem={({ item }) => <DishListTile dishList={item} />}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <ProfileEmptyState message={getEmptyMessage(false)} />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Recipes Page */}
        <View style={styles.page} key="1">
          <FlatList
            data={recipes}
            renderItem={({ item }) => (
              <RecipeTile
                recipe={item}
                onPress={() =>
                  navigation.navigate("RecipeDetail", { recipeId: item.id })
                }
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              isRecipesLoading || isRecipesFetching ? (
                <View style={styles.tabLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                </View>
              ) : (
                <ProfileEmptyState message={getEmptyMessage(true)} />
              )
            }
            ListFooterComponent={
              isFetchingNextRecipes ? (
                <View style={styles.tabLoadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                </View>
              ) : null
            }
            onEndReached={handleLoadMoreRecipes}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </PagerView>

      {/* Edit Profile Sheet */}
      {isOwnProfile && (
        <EditProfileSheet
          visible={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          onSave={handleEditComplete}
          currentUser={user}
        />
      )}

      {/* Profile Menu Dropdown */}
      <ProfileMenu
        visible={showMenu}
        onClose={handleCloseMenu}
        onSettingsPress={isOwnProfile ? handleSettingsPress : undefined}
        onLogoutPress={isOwnProfile ? handleLogout : undefined}
        onReportPress={!isOwnProfile ? handleReportUser : undefined}
        onBlockPress={!isOwnProfile ? handleBlockUser : undefined}
      />

      {isOwnProfile && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareType="profile"
          contentId={user.uid}
          contentTitle={displayName}
        />
      )}

      {!isOwnProfile && (
        <ReportContentModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="USER"
          targetId={userId}
          targetLabel="user"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
  },
  loadingWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingSafeArea: {
    backgroundColor: theme.colors.surface,
  },
  blockedHeader: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  blockedBackButton: {
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 8,
  },
  blockedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  blockedTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: 8,
    textAlign: "center",
  },
  blockedText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
    marginBottom: 20,
  },
  unblockButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  unblockButtonText: {
    ...typography.body,
    color: "white",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tabLoadingContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[900],
    marginBottom: 8,
  },
  errorText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: "white",
  },
  searchInfo: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchInfoText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl + 20,
  },
  row: {
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  separator: {
    height: theme.spacing.lg,
  },
});
