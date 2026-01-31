import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { ProfileMenu } from "../components/ProfileMenu";
import { useProfile } from "../hooks/useProfile";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileTabs } from "../components/ProfileTabs";
import { EditProfileSheet } from "../components/EditProfileSheet";
import { DishListTile } from "@features/dishlist";
import { RecipeTile } from "@features/recipe";
import { ProfileEmptyState } from "../components/ProfileEmptyState";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { signOut } = useAuth();

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
    isError,
    refetch,
    setActiveTab,
    setSearchQuery,
    toggleSearch,
    closeSearch,
  } = useProfile(userId);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    setShowEditSheet(true);
  };

  const handleShareProfile = () => {
    // TODO: Implement share functionality
    console.log("Share profile pressed");
  };

  const handleEditComplete = () => {
    setShowEditSheet(false);
    refetch();
  };

  const handleMenuPress = () => {
    setShowMenu((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleSettingsPress = () => {
    // TODO: Navigate to settings screen when implemented
    console.log("Settings pressed");
  };

  const handleLogout = async () => {
    await signOut();
    // Navigation will auto-redirect to Login screen via MainNavigator
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
      return user?.isOwnProfile
        ? "You don't have any recipes yet"
        : "No recipes in public DishLists";
    }
    return user?.isOwnProfile
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
            Something went wrong. Please try again.
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

  return (
    <View style={styles.container}>
      {/* White safe area for status bar */}
      <SafeAreaView style={styles.safeArea} edges={["top"]} />

      {/* Profile Header with icons, search, and user info */}
      <ProfileHeader
        user={user}
        displayName={displayName}
        onBackPress={handleBack}
        onEditPress={user.isOwnProfile ? handleEditProfile : undefined}
        onSharePress={user.isOwnProfile ? handleShareProfile : undefined}
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
            renderItem={({ item }) => (
              <DishListTile dishList={item} compact={!user.isOwnProfile} />
            )}
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
                compact={!user.isOwnProfile}
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
              <ProfileEmptyState message={getEmptyMessage(true)} />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </PagerView>

      {/* Edit Profile Sheet */}
      {user.isOwnProfile && (
        <EditProfileSheet
          visible={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          onSave={handleEditComplete}
          currentUser={user}
        />
      )}

      {/* Profile Menu Dropdown */}
      {user?.isOwnProfile && (
        <ProfileMenu
          visible={showMenu}
          onClose={handleCloseMenu}
          onSettingsPress={handleSettingsPress}
          onLogoutPress={handleLogout}
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
  errorTitle: {
    ...typography.heading3,
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
