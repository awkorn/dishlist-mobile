import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, User as UserIcon } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import DishListTile from "../../components/dishlist/DishListTile";
import RecipeTile from "../../components/recipe/RecipeTile";
import { getUserProfile } from "../../services/api";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import EditProfileSheet from "../../components/profile/EditProfileSheet";

const { width } = Dimensions.get("window");
const tileWidth = (width - 60) / 2;

type ProfileScreenRouteProp = RouteProp<RootStackParamList, "Profile">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;

  const [activeTab, setActiveTab] = useState<"DishLists" | "Recipes">(
    "DishLists"
  );
  const [showEditSheet, setShowEditSheet] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
  });

  const { user, dishlists = [], recipes = [] } = data || {};

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.username || "User";
  }, [user]);

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
          <ChevronLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={40} color={theme.colors.neutral[400]} />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            {user.username && (
              <Text style={styles.username}>@{user.username}</Text>
            )}
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

            {/* Follower Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.followerCount}</Text>
                <Text style={styles.statLabel}>
                  Follower{user.followerCount !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {/* Edit Profile Button (only for own profile) */}
            {user.isOwnProfile && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("DishLists")}
            style={[styles.tab, activeTab === "DishLists" && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "DishLists" && styles.activeTabText,
              ]}
            >
              DishLists
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("Recipes")}
            style={[styles.tab, activeTab === "Recipes" && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Recipes" && styles.activeTabText,
              ]}
            >
              Recipes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === "DishLists" ? (
            dishlists.length > 0 ? (
              <View style={styles.grid}>
                {dishlists.map((dishList) => (
                  <DishListTile key={dishList.id} dishList={dishList} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {user.isOwnProfile
                    ? "You don't have any public DishLists yet"
                    : "No public DishLists"}
                </Text>
              </View>
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {user.isOwnProfile
                  ? "You don't have any recipes yet"
                  : "No recipes in public DishLists"}
              </Text>
            </View>
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
    padding: 4,
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
  profileHeader: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: 4,
  },
  username: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginBottom: 8,
  },
  bio: {
    ...typography.caption,
    color: theme.colors.neutral[700],
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  statLabel: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  editButton: {
    backgroundColor: theme.colors.neutral[100],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  editButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[700],
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary[50],
  },
  tabText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  activeTabText: {
    color: theme.colors.secondary[50],
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
  },
});
