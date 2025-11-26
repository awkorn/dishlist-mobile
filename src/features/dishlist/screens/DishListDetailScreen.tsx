import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
} from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import RecipeTile from "@components/recipe/RecipeTile";
import ActionSheet, { ActionSheetOption } from "@components/ui/ActionSheet";
import { QueryErrorBoundary } from "@providers/ErrorBoundary";
import { DishListDetailScreenProps } from "@app-types/navigation";
import {
  useDishListDetail,
  useTogglePinDishList,
  useToggleFollowDishList,
  useDeleteDishList,
} from "../hooks";

export default function DishListDetailScreen({
  route,
  navigation,
}: DishListDetailScreenProps) {
  const { dishListId } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);

  const {
    dishList,
    filteredRecipes,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useDishListDetail({ dishListId, searchQuery });

  const pinMutation = useTogglePinDishList();
  const followMutation = useToggleFollowDishList();
  const deleteMutation = useDeleteDishList();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!dishList) return [];

    const options: ActionSheetOption[] = [];

    if (dishList.isOwner) {
      options.push(
        {
          title: "Edit DishList",
          icon: Edit3,
          onPress: () =>
            navigation.navigate("EditDishList", {
              dishListId,
              dishList: {
                title: dishList.title,
                description: dishList.description,
                visibility: dishList.visibility,
              },
            }),
        },
        {
          title: "Add Recipe",
          icon: Plus,
          onPress: () => navigation.navigate("AddRecipe", { dishListId }),
        },
        {
          title: "Invite Collaborator",
          icon: UserPlus,
          onPress: () =>
            navigation.navigate("InviteCollaborator", { dishListId }),
        }
      );
    }

    options.push({
      title: dishList.isPinned ? "Unpin DishList" : "Pin DishList",
      icon: dishList.isPinned ? PinOff : Pin,
      onPress: () =>
        pinMutation.mutate({
          dishListId,
          isPinned: dishList.isPinned,
        }),
    });

    if (dishList.isOwner && !dishList.isDefault) {
      options.push({
        title: "Delete DishList",
        icon: Trash2,
        destructive: true,
        onPress: () => {
          Alert.alert(
            "Delete DishList",
            `Are you sure you want to delete "${dishList.title}"? This will also delete all recipes that are only in this DishList.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteMutation.mutate(dishListId, {
                    onSuccess: () => navigation.goBack(),
                  });
                },
              },
            ]
          );
        },
      });
    }

    return options;
  }, [dishList, navigation, pinMutation, deleteMutation, dishListId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading DishList...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !dishList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load DishList</Text>
          <Text style={styles.errorMessage}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <QueryErrorBoundary
      onRetry={handleRefresh}
      title="Something went wrong"
      message="Unable to display DishList content."
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <Search
                size={20}
                color={theme.colors.neutral[500]}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Find Recipe"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {dishList.title}
              </Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text
                    style={[
                      styles.infoText,
                      {
                        color:
                          dishList.visibility === "PRIVATE" ? "red" : "green",
                      },
                    ]}
                  >
                    ●
                  </Text>
                  <Text style={[styles.infoText, { marginLeft: 4 }]}>
                    {dishList.visibility === "PUBLIC" ? "Public" : "Private"}
                  </Text>
                </View>

                <Text style={styles.infoText}>
                  {dishList.recipeCount}{" "}
                  {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
                </Text>

                <Text style={styles.infoText}>
                  {dishList.followerCount}{" "}
                  {dishList.followerCount === 1 ? "Follower" : "Followers"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowActionSheet(true)}
            >
              <MoreHorizontal size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe Grid */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        >
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No Recipes Found" : "No Recipes Yet"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No recipes match "${searchQuery}"`
                  : "Add your first recipe to this DishList"}
              </Text>
              {!searchQuery && dishList.isOwner && (
                <TouchableOpacity
                  style={styles.addRecipeButton}
                  onPress={() =>
                    navigation.navigate("AddRecipe", { dishListId })
                  }
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.addRecipeButtonText}>Add Recipe</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    navigation.navigate("RecipeDetail", {
                      recipeId: recipe.id,
                      dishListId,
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Sheet */}
        <ActionSheet
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          options={actionSheetOptions}
        />
      </SafeAreaView>
    </QueryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
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
  retryButtonText: {
    ...typography.button,
    color: "white",
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing["3xl"],
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerTitle: {
    ...typography.heading2,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  menuButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  addRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  addRecipeButtonText: {
    ...typography.button,
    color: "white",
  },
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
