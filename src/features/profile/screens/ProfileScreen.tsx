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
import { MoveLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";

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
  
  const pagerRef = useRef<PagerView>(null);

  const {
    user,
    dishlists,
    recipes,
    displayName,
    activeTab,
    isLoading,
    isError,
    refetch,
    setActiveTab,
  } = useProfile(userId);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    setShowEditSheet(true);
  };

  const handleEditComplete = () => {
    setShowEditSheet(false);
    refetch();
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !user) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MoveLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Header */}
      <ProfileHeader
        user={user}
        displayName={displayName}
        onEditPress={user.isOwnProfile ? handleEditProfile : undefined}
      />

      {/* Tabs */}
      <ProfileTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

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
              <ProfileEmptyState
                message={
                  user.isOwnProfile
                    ? "You don't have any public DishLists yet"
                    : "No public DishLists"
                }
              />
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
              <ProfileEmptyState
                message={
                  user.isOwnProfile
                    ? "You don't have any recipes yet"
                    : "No recipes in public DishLists"
                }
              />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 1,
  },
  headerSpacer: {
    flex: 1,
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
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xl + 20,
  },
  row: {
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  separator: {
    height: theme.spacing.lg, // Vertical spacing between rows
  },
});