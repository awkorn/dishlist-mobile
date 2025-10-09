import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MoreHorizontal,
  Clock,
  ChefHat,
  Users,
  PlayCircle,
  Plus,
  Edit3,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { typography } from "../../styles/typography";
import { theme } from "../../styles/theme";
import { getRecipe, getDishListDetail } from "../../services/api";
import ActionSheet, {
  ActionSheetOption,
} from "../../components/ui/ActionSheet";
import { QueryErrorBoundary } from "../../providers/ErrorBoundary";
import NutritionSection from "../../components/recipe/NutritionSection";
import CookModeModal from "../../components/recipe/CookModeModal";
import AddToDishListModal from "../../components/recipe/AddToDishListModal";
import { useAuth } from "../../providers/AuthProvider/AuthContext";
import { useRemoveRecipeFromDishList } from "../../hooks/mutations/useDishListMutations";
import { queryKeys } from "../../lib/queryKeys";

interface RecipeDetailScreenProps {
  route: {
    params: {
      recipeId: string;
      dishListId?: string;
    };
  };
  navigation: any;
}

interface RecipeProgress {
  checkedIngredients: Set<number>;
  completedSteps: Set<number>;
}

export default function RecipeDetailScreen({
  route,
  navigation,
}: RecipeDetailScreenProps) {
  const { recipeId, dishListId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCookMode, setShowCookMode] = useState(false);
  const [showAddToDishListModal, setShowAddToDishListModal] = useState(false);
  const [progress, setProgress] = useState<RecipeProgress>({
    checkedIngredients: new Set(),
    completedSteps: new Set(),
  });

  const removeRecipeMutation = useRemoveRecipeFromDishList();

  // Load DishList for permissions if dishListId is provided
  const { data: dishList } = useQuery({
    queryKey: queryKeys.dishLists.detail(dishListId || ""),
    queryFn: () => getDishListDetail(dishListId!),
    enabled: !!dishListId,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: recipe,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipe(recipeId),
    staleTime: 5 * 60 * 1000,
  });

  // === Local Storage Progress ===
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(`recipe_progress_${recipeId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProgress({
            checkedIngredients: new Set(parsed.checkedIngredients || []),
            completedSteps: new Set(parsed.completedSteps || []),
          });
        }
      } catch (e) {
        console.warn("Failed to load recipe progress:", e);
      }
    };
    loadProgress();
  }, [recipeId]);

  const saveProgress = useCallback(
    async (p: RecipeProgress) => {
      try {
        await AsyncStorage.setItem(
          `recipe_progress_${recipeId}`,
          JSON.stringify({
            checkedIngredients: Array.from(p.checkedIngredients),
            completedSteps: Array.from(p.completedSteps),
          })
        );
      } catch (e) {
        console.warn("Failed to save recipe progress:", e);
      }
    },
    [recipeId]
  );

  const toggleIngredient = useCallback(
    (i: number) => {
      setProgress((prev) => {
        const next = new Set(prev.checkedIngredients);
        next.has(i) ? next.delete(i) : next.add(i);
        const updated = { ...prev, checkedIngredients: next };
        saveProgress(updated);
        return updated;
      });
    },
    [saveProgress]
  );

  const toggleStep = useCallback(
    (i: number) => {
      setProgress((prev) => {
        const next = new Set(prev.completedSteps);
        next.has(i) ? next.delete(i) : next.add(i);
        const updated = { ...prev, completedSteps: next };
        saveProgress(updated);
        return updated;
      });
    },
    [saveProgress]
  );

  // === DishList Permissions ===
  const canRemoveFromDishList = useMemo(() => {
    if (!dishListId || !dishList) return false;
    return dishList.isOwner || dishList.isCollaborator;
  }, [dishListId, dishList]);

  const handleRemoveFromDishList = useCallback(() => {
    if (!dishListId) return;
    Alert.alert(
      "Remove Recipe",
      `Remove "${recipe?.title}" from this DishList?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeRecipeMutation.mutateAsync({ dishListId, recipeId });
            navigation.goBack();
          },
        },
      ]
    );
  }, [dishListId, recipeId, recipe, removeRecipeMutation, navigation]);

  // === Action Sheet Options ===
  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!recipe) return [];

    const opts: ActionSheetOption[] = [
      {
        title: "Add to DishList",
        icon: Plus,
        onPress: () => setShowAddToDishListModal(true),
      },
      {
        title: "Add to Grocery List",
        icon: ShoppingCart,
        onPress: () => {
          const unchecked =
            recipe.ingredients?.filter(
              (_, i) => !progress.checkedIngredients.has(i)
            ) || [];
          if (unchecked.length === 0) {
            Alert.alert("No Items", "All ingredients are already checked off.");
            return;
          }
          Alert.alert(
            "Added to Grocery List",
            `${unchecked.length} ingredients added to your grocery list.`
          );
        },
      },
    ];

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
  ]);

  const totalTime = useMemo(
    () => (recipe ? (recipe.prepTime || 0) + (recipe.cookTime || 0) : 0),
    [recipe]
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // === Loading/Error states ===
  if (isLoading)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );

  if (isError || !recipe)
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
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowActionSheet(true)}
            style={styles.menuButton}
          >
            <MoreHorizontal size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Metadata */}
          <View style={styles.metadataRow}>
            {recipe.prepTime && (
              <View style={styles.metadataItem}>
                <Clock size={16} color={theme.colors.neutral[600]} />
                <View style={styles.metadataTextGroup}>
                  <Text style={styles.metadataLabel}>Prep Time</Text>
                  <Text style={styles.metadataValue}>
                    {recipe.prepTime} min
                  </Text>
                </View>
              </View>
            )}
            {recipe.cookTime && (
              <View style={styles.metadataItem}>
                <ChefHat size={16} color={theme.colors.neutral[600]} />
                <View style={styles.metadataTextGroup}>
                  <Text style={styles.metadataLabel}>Cook Time</Text>
                  <Text style={styles.metadataValue}>
                    {recipe.cookTime} min
                  </Text>
                </View>
              </View>
            )}
            {totalTime > 0 && (
              <View style={styles.metadataItem}>
                <Clock size={16} color={theme.colors.primary[600]} />
                <View style={styles.metadataTextGroup}>
                  <Text style={styles.metadataLabel}>Total Time</Text>
                  <Text style={[styles.metadataValue, styles.totalTimeValue]}>
                    {totalTime} min
                  </Text>
                </View>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metadataItem}>
                <Users size={16} color={theme.colors.neutral[600]} />
                <View style={styles.metadataTextGroup}>
                  <Text style={styles.metadataLabel}>Servings</Text>
                  <Text style={styles.metadataValue}>{recipe.servings}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Created date */}
          <View style={styles.createdDateRow}>
            <Text style={styles.createdDate}>
              Created {formatDate(recipe.createdAt)}
            </Text>
          </View>

          {/* Cook mode */}
          <TouchableOpacity
            style={styles.cookModeButton}
            onPress={() => setShowCookMode(true)}
          >
            <PlayCircle size={20} color="#00295B" />
            <Text style={styles.cookModeText}>Cook Mode</Text>
          </TouchableOpacity>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ing, i) => (
              <TouchableOpacity
                key={i}
                style={styles.ingredientRow}
                onPress={() => toggleIngredient(i)}
              >
                <View style={styles.checkbox}>
                  {progress.checkedIngredients.has(i) && (
                    <View style={styles.checkboxFilled} />
                  )}
                </View>
                <Text
                  style={[
                    styles.ingredientText,
                    progress.checkedIngredients.has(i) && styles.crossedOut,
                  ]}
                >
                  {ing}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions?.map((inst, i) => (
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
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.instructionText,
                    progress.completedSteps.has(i) && styles.crossedOut,
                  ]}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nutrition */}
          <View style={styles.section}>
            <NutritionSection
              nutrition={recipe.nutrition}
              ingredients={recipe.ingredients}
              servings={recipe.servings || 1}
              recipeId={recipe.id}
              onNutritionCalculated={(data) => {
                queryClient.setQueryData(["recipe", recipeId], (old: any) =>
                  old ? { ...old, nutrition: data } : old
                );
              }}
            />
          </View>
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
            instructions: recipe.instructions || [],
            ingredients: recipe.ingredients || [],
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
      </SafeAreaView>
    </QueryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  loadingText: { ...typography.body, color: theme.colors.neutral[600] },
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
  retryButtonText: { ...typography.button, color: "white" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  backButton: { padding: theme.spacing.xs },
  menuButton: { padding: theme.spacing.xs },
  scrollContainer: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  metadataRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minWidth: 95,
  },
  metadataTextGroup: { flexDirection: "column" },
  metadataLabel: { ...typography.caption, color: theme.colors.neutral[600] },
  metadataValue: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  totalTimeValue: { color: theme.colors.neutral[600] },
  createdDateRow: {
    marginBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[300],
    paddingBottom: theme.spacing.sm,
  },
  createdDate: { ...typography.caption, color: theme.colors.neutral[500] },
  cookModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4F8",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing["3xl"],
    gap: theme.spacing.sm,
    borderColor: theme.colors.textPrimary,
    borderWidth: 1,
  },
  cookModeText: {
    ...typography.button,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  section: {
    marginBottom: theme.spacing["3xl"],
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxFilled: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: theme.colors.primary[500],
  },
  ingredientText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
  },
  crossedOut: { textDecorationLine: "line-through", opacity: 0.6 },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.caption,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    fontSize: 12,
  },
  completedStepNumber: { color: theme.colors.primary[500] },
  instructionText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
    lineHeight: 20,
  },
});
