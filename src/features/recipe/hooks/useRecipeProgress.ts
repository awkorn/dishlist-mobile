import { useState, useEffect, useCallback } from "react";
import { recipeProgressStorage } from "../services";
import type { RecipeProgress } from "../types";

interface UseRecipeProgressOptions {
  recipeId: string;
}

interface UseRecipeProgressReturn {
  progress: RecipeProgress;
  toggleIngredient: (index: number) => void;
  toggleStep: (index: number) => void;
  resetIngredients: () => void;
  resetSteps: () => void;
  resetProgress: () => void;
  isLoaded: boolean;
}

export function useRecipeProgress({
  recipeId,
}: UseRecipeProgressOptions): UseRecipeProgressReturn {
  const [progress, setProgress] = useState<RecipeProgress>({
    checkedIngredients: new Set(),
    completedSteps: new Set(),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const savedProgress = await recipeProgressStorage.loadProgress(recipeId);
      setProgress(savedProgress);
      setIsLoaded(true);
    };
    loadProgress();
  }, [recipeId]);

  // Toggle ingredient checked state
  const toggleIngredient = useCallback(
    (index: number) => {
      setProgress((prev) => {
        const next = new Set(prev.checkedIngredients);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        const updated = { ...prev, checkedIngredients: next };
        recipeProgressStorage.saveProgress(recipeId, updated);
        return updated;
      });
    },
    [recipeId]
  );

  // Toggle step completed state
  const toggleStep = useCallback(
    (index: number) => {
      setProgress((prev) => {
        const next = new Set(prev.completedSteps);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        const updated = { ...prev, completedSteps: next };
        recipeProgressStorage.saveProgress(recipeId, updated);
        return updated;
      });
    },
    [recipeId]
  );

  // Reset all progress
  const resetProgress = useCallback(() => {
    const emptyProgress: RecipeProgress = {
      checkedIngredients: new Set(),
      completedSteps: new Set(),
    };
    setProgress(emptyProgress);
    recipeProgressStorage.clearProgress(recipeId);
  }, [recipeId]);

  // Reset only ingredients
  const resetIngredients = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, checkedIngredients: new Set<number>() };
      recipeProgressStorage.saveProgress(recipeId, updated);
      return updated;
    });
  }, [recipeId]);

  // Reset only steps
  const resetSteps = useCallback(() => {
    setProgress((prev) => {
      const updated = { ...prev, completedSteps: new Set<number>() };
      recipeProgressStorage.saveProgress(recipeId, updated);
      return updated;
    });
  }, [recipeId]);

  return {
    progress,
    toggleIngredient,
    toggleStep,
    resetProgress,
    resetIngredients,
    resetSteps,
    isLoaded,
  };
}
