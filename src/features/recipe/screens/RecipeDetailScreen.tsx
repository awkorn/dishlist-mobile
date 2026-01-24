import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Edit3,
  ShoppingCart,
  Trash2,
  Share,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import ActionSheet, { ActionSheetOption } from "@components/ui/ActionSheet";
import { QueryErrorBoundary } from "@providers/ErrorBoundary";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { queryKeys } from "@lib/queryKeys";
import {
  useRemoveRecipeFromDishList,
  dishlistService,
} from "@features/dishlist";
import { useRecipeDetail, useRecipeProgress } from "../hooks";
import {
  NutritionSection,
  CookModeModal,
  AddToDishListModal,
  TagDisplay,
} from "../components";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { useAddGroceryItems } from "@features/grocery/hooks";
import type { RecipeItem } from "../types";
import {
  convertLegacyToStructured,
  extractItemTexts,
  getStepNumber,
  isHeader,
  isItem,
} from "../types";
import * as Haptics from "expo-haptics";
import { ShareModal } from "@features/share";

type Props = NativeStackScreenProps<RootStackParamList, "RecipeDetail">;

// Helper to get display step number (excluding headers)
function getDisplayStepNumber(items: RecipeItem[], index: number): number {
  let stepCount = 0;
  for (let i = 0; i <= index; i++) {
    if (items[i]?.type === "item") {
      stepCount++;
    }
  }
  return stepCount;
}

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId, dishListId } = route.params;
  const { user } = useAuth();

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCookMode, setShowCookMode] = useState(false);
  const [showAddToDishListModal, setShowAddToDishListModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Recipe data
  const { recipe, isLoading, isError, refetch, updateNutritionCache } =
    useRecipeDetail({ recipeId });

  // Recipe progress (ingredients/steps checked)
  const {
    progress,
    toggleIngredient,
    toggleStep,
    resetIngredients,
    resetSteps,
  } = useRecipeProgress({
    recipeId,
  });

  // Check if any items are checked
  const hasCheckedIngredients = progress.checkedIngredients.size > 0;
  const hasCheckedSteps = progress.completedSteps.size > 0;

  // Reset handlers with haptic feedback
  const handleResetIngredients = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetIngredients();
  }, [resetIngredients]);

  const handleResetSteps = useCallback(() => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetSteps();
  }, [resetSteps]);

  // Load DishList for permissions if dishListId is provided
  const { data: dishList } = useQuery({
    queryKey: queryKeys.dishLists.detail(dishListId || ""),
    queryFn: () => dishlistService.getDishListDetail(dishListId!),
    enabled: !!dishListId,
    staleTime: 5 * 60 * 1000,
  });

  const removeRecipeMutation = useRemoveRecipeFromDishList();
  const addToGroceryMutation = useAddGroceryItems();

  // Permission checks
  const canRemoveFromDishList = useMemo(() => {
    if (!dishListId || !dishList) return false;
    return dishList.isOwner || dishList.isCollaborator;
  }, [dishListId, dishList]);

  const handleRemoveFromDishList = useCallback(() => {
    if (!dishListId) return;

    Alert.alert(
      "Remove Recipe",
      "Are you sure you want to remove this recipe from this DishList?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeRecipeMutation.mutate(
              { dishListId, recipeId },
              { onSuccess: () => navigation.goBack() }
            );
          },
        },
      ]
    );
  }, [dishListId, recipeId, removeRecipeMutation, navigation]);

  // Action sheet options
  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!recipe) return [];

    const opts: ActionSheetOption[] = [
      {
        title: "Add to DishList",
        icon: Plus,
        onPress: () => setShowAddToDishListModal(true),
      },
    ];

    // Share Recipe - only if recipe is shareable (on a public DishList)
    if (recipe.isShareable) {
      opts.push({
        title: "Share Recipe",
        icon: Share,
        onPress: () => {
          setShowActionSheet(false);
          setTimeout(() => setShowShareModal(true), 300);
        },
      });
    }

    opts.push({
      title: "Add to Grocery List",
      icon: ShoppingCart,
      onPress: () => {
        // Convert and filter: only items (not headers), and only unchecked ones
        const items = convertLegacyToStructured(recipe.ingredients || []);
        const unchecked = items
          .filter(
            (item, i) =>
              item.type === "item" && !progress.checkedIngredients.has(i)
          )
          .map((item) => item.text)
          .filter((text) => text.trim());

        if (unchecked.length === 0) {
          Alert.alert(
            "No Ingredients to Add",
            "All ingredients have already been checked off."
          );
          return;
        }

        addToGroceryMutation.mutate(unchecked, {
          onSuccess: () => {
            Alert.alert(
              "Added to Grocery List",
              `${unchecked.length} ${
                unchecked.length === 1 ? "ingredient" : "ingredients"
              } added to your grocery list.`
            );
          },
        });
      },
    });

    const isOwner = recipe.creator.uid === user?.uid;
    if (isOwner) {
      opts.splice(1, 0, {
        title: "Edit Recipe",
        icon: Edit3,
        onPress: () =>
          navigation.navigate("AddRecipe", {
            dishListId: "",
            recipeId: recipe.id,
            recipe,
          }),
      });
    }

    if (canRemoveFromDishList) {
      opts.push({
        title: "Remove from DishList",
        icon: Trash2,
        destructive: true,
        onPress: handleRemoveFromDishList,
      });
    }

    return opts;
  }, [
    recipe,
    progress.checkedIngredients,
    navigation,
    canRemoveFromDishList,
    handleRemoveFromDishList,
    user,
    addToGroceryMutation,
  ]);

  const totalTime = useMemo(
    () => (recipe ? (recipe.prepTime || 0) + (recipe.cookTime || 0) : 0),
    [recipe]
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load recipe</Text>
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
    <QueryErrorBoundary
      onRetry={() => refetch()}
      title="Something went wrong"
      message="Unable to display recipe content."
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <ChevronLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <TouchableOpacity
            onPress={() => setShowActionSheet(true)}
            style={styles.headerButton}
          >
            <MoreHorizontal size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🍽️</Text>
            </View>
          )}

          {/* Meta Info */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              {recipe.prepTime && recipe.prepTime > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Prep Time</Text>
                  <Text style={styles.metaValue}>{recipe.prepTime} min</Text>
                </View>
              )}
              {recipe.cookTime && recipe.cookTime > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Cook Time</Text>
                  <Text style={styles.metaValue}>{recipe.cookTime} min</Text>
                </View>
              )}
              {totalTime > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total Time</Text>
                  <Text style={styles.metaValue}>{totalTime} min</Text>
                </View>
              )}
              {recipe.servings && recipe.servings > 0 && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Servings</Text>
                  <Text style={styles.metaValue}>{recipe.servings}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Cook Mode Button */}
          <TouchableOpacity
            style={styles.cookModeButton}
            onPress={() => setShowCookMode(true)}
          >
            <PlayCircle size={20} color="white" />
            <Text style={styles.cookModeButtonText}>Cook Mode</Text>
          </TouchableOpacity>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity
                onPress={handleResetIngredients}
                disabled={!hasCheckedIngredients}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  style={[
                    styles.resetLink,
                    !hasCheckedIngredients && styles.resetLinkDisabled,
                  ]}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
            {convertLegacyToStructured(recipe.ingredients || []).map(
              (item, i) => {
                if (item.type === "header") {
                  return (
                    <View key={i} style={styles.subsectionHeader}>
                      <Text style={styles.subsectionHeaderText}>
                        {item.text}
                      </Text>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.ingredientRow}
                    onPress={() => toggleIngredient(i)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        progress.checkedIngredients.has(i) &&
                          styles.checkboxChecked,
                      ]}
                    />
                    <Text
                      style={[
                        styles.ingredientText,
                        progress.checkedIngredients.has(i) && styles.crossedOut,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <TouchableOpacity
                onPress={handleResetSteps}
                disabled={!hasCheckedSteps}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  style={[
                    styles.resetLink,
                    !hasCheckedSteps && styles.resetLinkDisabled,
                  ]}
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
            {(() => {
              const items = convertLegacyToStructured(
                recipe.instructions || []
              );
              return items.map((item, i) => {
                if (item.type === "header") {
                  return (
                    <View key={i} style={styles.subsectionHeader}>
                      <Text style={styles.subsectionHeaderText}>
                        {item.text}
                      </Text>
                    </View>
                  );
                }
                const stepNum = getDisplayStepNumber(items, i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.instructionRow}
                    onPress={() => toggleStep(i)}
                  >
                    <View style={styles.stepNumber}>
                      <Text
                        style={[
                          styles.stepNumberText,
                          progress.completedSteps.has(i) &&
                            styles.completedStepNumber,
                        ]}
                      >
                        {stepNum}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.instructionText,
                        progress.completedSteps.has(i) && styles.crossedOut,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </View>

          {/* Nutrition */}
          <View style={styles.section}>
            <NutritionSection
              nutrition={recipe.nutrition}
              ingredients={extractItemTexts(
                convertLegacyToStructured(recipe.ingredients || [])
              )}
              servings={recipe.servings || 1}
              recipeId={recipe.id}
              onNutritionCalculated={updateNutritionCache}
            />
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.section}>
              <TagDisplay tags={recipe.tags} />
            </View>
          )}
        </ScrollView>

        <ActionSheet
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          title="Recipe Options"
          options={actionSheetOptions}
        />

        <CookModeModal
          visible={showCookMode}
          onClose={() => setShowCookMode(false)}
          recipe={{
            title: recipe.title,
            instructions: convertLegacyToStructured(recipe.instructions || []),
            ingredients: convertLegacyToStructured(recipe.ingredients || []),
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
          }}
        />

        <AddToDishListModal
          visible={showAddToDishListModal}
          onClose={() => setShowAddToDishListModal(false)}
          recipeId={recipeId}
          recipeTitle={recipe.title}
        />

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareType="recipe"
          contentId={recipeId}
          contentTitle={recipe.title}
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
    paddingHorizontal: theme.spacing["4xl"],
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...typography.subtitle,
    flex: 1,
    textAlign: "center",
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  heroImage: {
    width: "100%",
    height: 250,
    backgroundColor: theme.colors.neutral[200],
  },
  heroPlaceholder: {
    width: "100%",
    height: 250,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
  },
  heroEmoji: {
    fontSize: 64,
  },
  metaSection: {
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  metaItem: {
    alignItems: "center",
    minWidth: 70,
  },
  metaLabel: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  metaValue: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  cookModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary[600],
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  cookModeButtonText: {
    ...typography.button,
    color: "white",
  },
  section: {
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: 0,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.neutral[400],
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  ingredientText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  resetLink: {
    ...typography.body,
    fontSize: 14,
    color: theme.colors.primary[500],
  },
  resetLinkDisabled: {
    color: theme.colors.neutral[400],
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    ...typography.subtitle,
    fontSize: 14,
    color: theme.colors.primary[600],
  },
  completedStepNumber: {
    color: theme.colors.neutral[400],
  },
  instructionText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
    lineHeight: 24,
  },
  crossedOut: {
    textDecorationLine: "line-through",
    color: theme.colors.neutral[400],
  },
  subsectionHeader: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  subsectionHeaderText: {
    ...typography.subtitle,
    fontSize: 15,
    color: theme.colors.primary[600],
    fontWeight: "600",
  },
});
