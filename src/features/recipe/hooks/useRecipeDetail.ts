import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../services';
import type { Recipe, NutritionInfo } from '../types';

export const RECIPE_QUERY_KEY = 'recipe';

interface UseRecipeDetailOptions {
  recipeId: string;
  enabled?: boolean;
}

interface UseRecipeDetailReturn {
  recipe: Recipe | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  updateNutritionCache: (nutrition: NutritionInfo) => void;
}

export function useRecipeDetail({ 
  recipeId, 
  enabled = true 
}: UseRecipeDetailOptions): UseRecipeDetailReturn {
  const queryClient = useQueryClient();

  const {
    data: recipe,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [RECIPE_QUERY_KEY, recipeId],
    queryFn: () => recipeService.getRecipe(recipeId),
    enabled: enabled && !!recipeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateNutritionCache = (nutrition: NutritionInfo) => {
    queryClient.setQueryData([RECIPE_QUERY_KEY, recipeId], (old: Recipe | undefined) =>
      old ? { ...old, nutrition } : old
    );
  };

  return {
    recipe,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    updateNutritionCache,
  };
}