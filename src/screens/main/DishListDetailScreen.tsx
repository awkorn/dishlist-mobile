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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { typography } from "../../styles/typography";
import { theme } from "../../styles/theme";
import { getDishListDetail } from "../../services/api";
import {
  useTogglePinDishList,
  useToggleFollowDishList,
} from "../../hooks/mutations/useDishListMutations";
import RecipeTile from "../../components/recipe/RecipeTile";
import ActionSheet, {
  ActionSheetOption,
} from "../../components/ui/ActionSheet";
import { QueryErrorBoundary } from "../../providers/ErrorBoundary";
import { queryKeys } from "../../lib/queryKeys";
import { DishListDetailScreenProps } from "../../types/navigation";

export default function DishListDetailScreen({
  route,
  navigation,
}: DishListDetailScreenProps) {
  const { dishListId, dishListTitle } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);

  const {
    data: dishList,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dishList", dishListId],
    queryFn: async () => {
      const result = await getDishListDetail(dishListId);
      return result;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Mutations
  const followMutation = useToggleFollowDishList();
  const pinMutation = useTogglePinDishList();

  const filteredRecipes = useMemo(() => {
    if (!dishList?.recipes) return [];
    if (!searchQuery.trim()) return dishList.recipes;
    return dishList.recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dishList?.recipes, searchQuery]);

  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!dishList) return [];

    const options: ActionSheetOption[] = [];

    if (dishList.isOwner) {
      options.push(
        {
          title: "Edit DishList",
          icon: Edit3,
          onPress: () => navigation.navigate("EditDishList", { dishListId }),
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

    if (dishList.isOwner) {
      options.push({
        title: "Delete DishList",
        icon: Trash2,
        destructive: true,
        onPress: () => {
          Alert.alert(
            "Delete DishList",
            "Are you sure you want to delete this DishList? This action cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        },
      });
    }

    return options;
  }, [dishList, navigation, pinMutation]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>
            Loading {dishListTitle || "DishList"}...
          </Text>
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
          {/* Row 1: Back button and search bar */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>

            {/* Search Bar */}
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

          {/* Row 2: Title + menu */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {dishList.title}
              </Text>

              {/* Row 3: Info */}
              <View style={styles.infoRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              onPress={() => setShowActionSheet(true)}
              style={styles.menuButton}
            >
              <MoreHorizontal size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipes Grid */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
              tintColor={theme.colors.primary[500]}
            />
          }
        >
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No matching recipes" : "No recipes yet"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No recipes match "${searchQuery}"`
                  : dishList.isOwner
                  ? "Add your first recipe to get started"
                  : "This DishList is empty"}
              </Text>
            </View>
          ) : (
            <View style={styles.recipesGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    navigation.navigate("RecipeDetail", { recipeId: recipe.id })
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
          title="DishList Options"
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
  infoText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  menuButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.md,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: theme.spacing["4xl"],
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[800],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["4xl"],
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: "white",
  },
});
