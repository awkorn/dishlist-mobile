import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MoveLeft } from "lucide-react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { DishListTile } from "@features/dishlist/components/DishListTile";
import { RecipeTile } from "@features/recipe";
import { RootStackParamList } from "@app-types/navigation";
import { useProfile } from "../hooks/useProfile";
import {
  EditProfileSheet,
  ProfileHeader,
  ProfileTabs,
  ProfileEmptyState,
} from "../components";

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

type ProfileScreenRouteProp = RouteProp<RootStackParamList, "Profile">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;

  const [showEditSheet, setShowEditSheet] = useState(false);

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

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEditProfile = useCallback(() => {
    setShowEditSheet(true);
  }, []);

  const handleEditComplete = useCallback(() => {
    setShowEditSheet(false);
    refetch();
  }, [refetch]);

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
          <Text style={styles.errorTitle}>Unable to Load Profile</Text>
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          displayName={displayName}
          onEditPress={user.isOwnProfile ? handleEditProfile : undefined}
        />

        {/* Tabs */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <View style={styles.content}>
          {activeTab === "DishLists" ? (
            dishlists.length > 0 ? (
              <View style={styles.grid}>
                {dishlists.map((dishlist) => (
                  <DishListTile key={dishlist.id} dishList={dishlist} />
                ))}
              </View>
            ) : (
              <ProfileEmptyState
                message={
                  user.isOwnProfile
                    ? "You don't have any public DishLists yet"
                    : "No public DishLists"
                }
              />
            )
          ) : recipes.length > 0 ? (
            <View style={styles.grid}>
              {recipes.map((recipe) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    navigation.navigate("RecipeDetail", { recipeId: recipe.id })
                  }
                />
              ))}
            </View>
          ) : (
            <ProfileEmptyState
              message={
                user.isOwnProfile
                  ? "You don't have any recipes yet"
                  : "No recipes in public DishLists"
              }
            />
          )}
        </View>
      </ScrollView>

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
  content: {
    padding: theme.spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
});
