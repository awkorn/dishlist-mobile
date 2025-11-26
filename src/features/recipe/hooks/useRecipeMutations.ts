import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { recipeService } from '../services';
import { queryKeys } from '@lib/queryKeys';
import type { Recipe, CreateRecipeData, UpdateRecipeData } from '../types';

const RECIPE_QUERY_KEY = 'recipe';

/**
 * Hook for creating a new recipe
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeData) => recipeService.createRecipe(data),

    onSuccess: (_, variables) => {
      // Invalidate dishlist detail to refresh recipe list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dishLists.detail(variables.dishListId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },

    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create recipe';
      Alert.alert('Error', message);
    },
  });
}

/**
 * Hook for updating an existing recipe
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: UpdateRecipeData }) =>
      recipeService.updateRecipe(recipeId, data),

    onMutate: async ({ recipeId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: [RECIPE_QUERY_KEY, recipeId] });

      // Snapshot previous value
      const previousRecipe = queryClient.getQueryData<Recipe>([RECIPE_QUERY_KEY, recipeId]);

      // Optimistically update
      queryClient.setQueryData([RECIPE_QUERY_KEY, recipeId], (old: Recipe | undefined) => 
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      return { previousRecipe, recipeId };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          [RECIPE_QUERY_KEY, context.recipeId],
          context.previousRecipe
        );
      }
      Alert.alert('Error', 'Failed to update recipe. Please try again.');
    },

    onSuccess: (data, variables) => {
      // Update with real server data
      queryClient.setQueryData([RECIPE_QUERY_KEY, variables.recipeId], data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [RECIPE_QUERY_KEY, variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
}

/**
 * Hook for adding a recipe to a DishList
 */
export function useAddRecipeToDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, recipeId }: { dishListId: string; recipeId: string }) =>
      recipeService.addRecipeToDishList(dishListId, recipeId),

    onMutate: async ({ recipeId }) => {
      // Cancel outgoing queries for recipe dishlists
      await queryClient.cancelQueries({
        queryKey: [RECIPE_QUERY_KEY, recipeId, 'dishlists'],
      });

      const previous = queryClient.getQueryData<string[]>([
        RECIPE_QUERY_KEY,
        recipeId,
        'dishlists',
      ]);

      return { previous, recipeId };
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(
          [RECIPE_QUERY_KEY, context.recipeId, 'dishlists'],
          context.previous
        );
      }
      const message = (error as any)?.response?.data?.error || 'Failed to add recipe. Please try again.';
      Alert.alert('Error', message);
    },

    onSuccess: (_, variables) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.detail(variables.dishListId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
      queryClient.invalidateQueries({
        queryKey: [RECIPE_QUERY_KEY, variables.recipeId, 'dishlists'],
      });
    },
  });
}