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
} from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { typography } from "../../styles/typography";
import { theme } from "../../styles/theme";
import { getRecipe } from "../../services/api";
import ActionSheet, {
  ActionSheetOption,
} from "../../components/ui/ActionSheet";
import { QueryErrorBoundary } from "../../providers/ErrorBoundary";
import NutritionSection from "../../components/recipe/NutritionSection";
import CookModeModal from "../../components/recipe/CookModeModal";

interface RecipeDetailScreenProps {
  route: {
    params: {
      recipeId: string;
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
  const { recipeId } = route.params;
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [progress, setProgress] = useState<RecipeProgress>({
    checkedIngredients: new Set(),
    completedSteps: new Set(),
  });
  const [showCookMode, setShowCookMode] = useState(false);

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

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedProgress = await AsyncStorage.getItem(
          `recipe_progress_${recipeId}`
        );
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setProgress({
            checkedIngredients: new Set(parsed.checkedIngredients || []),
            completedSteps: new Set(parsed.completedSteps || []),
          });
        }
      } catch (error) {
        console.warn("Failed to load recipe progress:", error);
      }
    };
    loadProgress();
  }, [recipeId]);

  const saveProgress = useCallback(
    async (newProgress: RecipeProgress) => {
      try {
        await AsyncStorage.setItem(
          `recipe_progress_${recipeId}`,
          JSON.stringify({
            checkedIngredients: Array.from(newProgress.checkedIngredients),
            completedSteps: Array.from(newProgress.completedSteps),
          })
        );
      } catch (error) {
        console.warn("Failed to save recipe progress:", error);
      }
    },
    [recipeId]
  );

  const toggleIngredient = useCallback(
    (index: number) => {
      setProgress((prev) => {
        const newChecked = new Set(prev.checkedIngredients);
        if (newChecked.has(index)) {
          newChecked.delete(index);
        } else {
          newChecked.add(index);
        }
        const newProgress = { ...prev, checkedIngredients: newChecked };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  const toggleStep = useCallback(
    (index: number) => {
      setProgress((prev) => {
        const newCompleted = new Set(prev.completedSteps);
        if (newCompleted.has(index)) {
          newCompleted.delete(index);
        } else {
          newCompleted.add(index);
        }
        const newProgress = { ...prev, completedSteps: newCompleted };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalTime = useMemo(() => {
    if (!recipe) return 0;
    return (recipe.prepTime || 0) + (recipe.cookTime || 0);
  }, [recipe]);

  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!recipe) return [];

    const options: ActionSheetOption[] = [
      {
        title: "Add to DishList",
        icon: Plus,
        onPress: () => {
          Alert.alert(
            "Coming Soon",
            "Add to DishList functionality will be implemented next."
          );
        },
      },
      {
        title: "Add to Grocery List",
        icon: ShoppingCart,
        onPress: () => {
          const uncheckedIngredients =
            recipe.ingredients?.filter(
              (_, index) => !progress.checkedIngredients.has(index)
            ) || [];

          if (uncheckedIngredients.length === 0) {
            Alert.alert("No Items", "All ingredients are already checked off.");
            return;
          }

          Alert.alert(
            "Added to Grocery List",
            `${uncheckedIngredients.length} ingredients added to your grocery list.`
          );
        },
      },
    ];

    const canEdit = true;
    if (canEdit) {
      options.splice(1, 0, {
        title: "Edit Recipe",
        icon: Edit3,
        onPress: () => {
          Alert.alert(
            "Coming Soon",
            "Edit recipe functionality will be implemented next."
          );
        },
      });
    }

    return options;
  }, [recipe, progress.checkedIngredients]);

  const handleCookMode = () => {
    setShowCookMode(true);
  };

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

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{recipe.title}</Text>

          {/* Time & Servings Row */}
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

          {/* Created Date Row */}
          <View style={styles.createdDateRow}>
            <Text style={styles.createdDate}>
              Created {formatDate(recipe.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cookModeButton}
            onPress={handleCookMode}
          >
            <PlayCircle size={20} color="#00295B" />
            <Text style={styles.cookModeText}>Cook Mode</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ingredient, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ingredientRow}
                onPress={() => toggleIngredient(index)}
              >
                <View style={styles.checkbox}>
                  {progress.checkedIngredients.has(index) && (
                    <View style={styles.checkboxFilled} />
                  )}
                </View>
                <Text
                  style={[
                    styles.ingredientText,
                    progress.checkedIngredients.has(index) && styles.crossedOut,
                  ]}
                >
                  {ingredient}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions?.map((instruction, index) => (
              <TouchableOpacity
                key={index}
                style={styles.instructionRow}
                onPress={() => toggleStep(index)}
              >
                <View style={styles.stepNumber}>
                  <Text
                    style={[
                      styles.stepNumberText,
                      progress.completedSteps.has(index) &&
                        styles.completedStepNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.instructionText,
                    progress.completedSteps.has(index) && styles.crossedOut,
                  ]}
                >
                  {instruction}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <NutritionSection
              nutrition={recipe.nutrition}
              ingredients={recipe.ingredients}
              servings={recipe.servings || 1}
              recipeId={recipe.id}
              onNutritionCalculated={(nutritionData) => {
                queryClient.setQueryData(
                  ["recipe", recipeId],
                  (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                      ...oldData,
                      nutrition: nutritionData,
                    };
                  }
                );

                const queryCache = queryClient.getQueryCache();
                const dishListQueries = queryCache.findAll({
                  queryKey: ["dishList"],
                  type: "active",
                });

                dishListQueries.forEach((query) => {
                  const dishListData = query.state.data as any;
                  if (dishListData?.recipes) {
                    const updatedData = {
                      ...dishListData,
                      recipes: dishListData.recipes.map((r: any) =>
                        r.id === recipeId
                          ? { ...r, nutrition: nutritionData }
                          : r
                      ),
                    };
                    queryClient.setQueryData(query.queryKey, updatedData);
                  }
                });
              }}
            />
          </View>

          {recipe.imageUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.placeholderText}>
                Photo display coming soon
              </Text>
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
            instructions: recipe.instructions || [],
            ingredients: recipe.ingredients || [],
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
          }}
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
  backButton: {
    padding: theme.spacing.xs,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
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
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minWidth: 95,
  },
  metadataTextGroup: {
    flexDirection: "column",
  },
  metadataLabel: {
    ...typography.caption,
    color: theme.colors.neutral[600],
  },
  metadataValue: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  totalTimeValue: {
    color: theme.colors.neutral[600],
  },
  createdDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[500],
  },
  createdDate: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.md,
  },
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
  crossedOut: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
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
  completedStepNumber: {
    color: theme.colors.primary[500],
  },
  instructionText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
    lineHeight: 20,
  },
  placeholderText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    fontStyle: "italic",
  },
});
