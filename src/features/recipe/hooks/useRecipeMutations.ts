import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { recipeService } from '../services';
import { queryKeys } from '@lib/queryKeys';
import type { Recipe, CreateRecipeData, UpdateRecipeData } from '../types';
import type { DishListRecipe } from '@features/dishlist/types';
import {
  appendRecipeToDetailCache,
  updateRecipeInDetailCache,
  type DishListDetailCache,
  type DishListRecipePatch,
} from '@features/dishlist/hooks';
import {
  dishlistService,
  DISH_LIST_RECIPES_PAGE_SIZE,
} from '@features/dishlist/services';

const RECIPE_QUERY_KEY = 'recipe';

function createDishListRecipePatch(
  recipeId: string,
  data: UpdateRecipeData,
  updatedAt: string
): DishListRecipePatch {
  return {
    id: recipeId,
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl ?? undefined,
    imageUrls: data.imageUrls,
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    servings: data.servings,
    tags: data.tags,
    updatedAt,
  };
}

function createDishListRecipePatchFromRecipe(
  recipe: Recipe
): DishListRecipePatch {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    imageUrls: recipe.imageUrls,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    tags: recipe.tags,
    updatedAt: recipe.updatedAt,
  };
}

/**
 * Hook for creating a new recipe
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeData) => recipeService.createRecipe(data),

    onSuccess: (newRecipe, variables) => {
      // Directly add recipe to dishlist detail cache for instant UI update
      const dishListRecipe: DishListRecipe = {
        id: newRecipe.id,
        title: newRecipe.title,
        description: newRecipe.description,
        imageUrl: newRecipe.imageUrl,
        imageUrls: newRecipe.imageUrls,
        prepTime: newRecipe.prepTime,
        cookTime: newRecipe.cookTime,
        servings: newRecipe.servings,
        tags: newRecipe.tags,
        creatorId: newRecipe.creatorId,
        creator: newRecipe.creator,
        createdAt: newRecipe.createdAt,
        updatedAt: newRecipe.updatedAt,
      };
      queryClient.setQueryData<DishListDetailCache>(
        queryKeys.dishLists.detail(variables.dishListId),
        (old) => appendRecipeToDetailCache(old, dishListRecipe)
      );
      // Eagerly fetch detail data for when cache didn't exist yet (e.g. Recipe Builder flow)
      queryClient.prefetchInfiniteQuery({
        queryKey: queryKeys.dishLists.detail(variables.dishListId),
        queryFn: () =>
          dishlistService.getDishListDetail(variables.dishListId, {
            recipesLimit: DISH_LIST_RECIPES_PAGE_SIZE,
            recipesOffset: 0,
          }),
        initialPageParam: 0,
      });
      // Background invalidation for list views
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
      // Prevent in-flight responses from overwriting the optimistic update.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: [RECIPE_QUERY_KEY, recipeId] }),
        queryClient.cancelQueries({ queryKey: queryKeys.dishLists.details() }),
      ]);

      // Snapshot every affected cache so a failed save can be fully rolled back.
      const previousRecipe = queryClient.getQueryData<Recipe>([RECIPE_QUERY_KEY, recipeId]);
      const previousDishListDetails =
        queryClient.getQueriesData<DishListDetailCache>({
          queryKey: queryKeys.dishLists.details(),
        });
      const optimisticUpdatedAt = new Date().toISOString();

      queryClient.setQueryData([RECIPE_QUERY_KEY, recipeId], (old: Recipe | undefined) => 
        old ? { ...old, ...data, updatedAt: optimisticUpdatedAt } : old
      );
      queryClient.setQueriesData<DishListDetailCache>(
        { queryKey: queryKeys.dishLists.details() },
        (old) =>
          updateRecipeInDetailCache(
            old,
            createDishListRecipePatch(recipeId, data, optimisticUpdatedAt)
          )
      );

      return { previousRecipe, previousDishListDetails, recipeId };
    },

    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          [RECIPE_QUERY_KEY, context.recipeId],
          context.previousRecipe
        );
      }
      context?.previousDishListDetails.forEach(([queryKey, cache]) => {
        queryClient.setQueryData(queryKey, cache);
      });
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update recipe. Please try again.'
      );
    },

    onSuccess: (data, variables) => {
      // Update with real server data
      queryClient.setQueryData([RECIPE_QUERY_KEY, variables.recipeId], data);
      queryClient.setQueriesData<DishListDetailCache>(
        { queryKey: queryKeys.dishLists.details() },
        (old) =>
          updateRecipeInDetailCache(
            old,
            createDishListRecipePatchFromRecipe(data)
          )
      );

      // Refetch in the background while keeping the confirmed title visible.
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

    onSuccess: (result, variables) => {
      const attachedRecipe = result.recipe;
      queryClient.setQueryData(
        [RECIPE_QUERY_KEY, attachedRecipe.id],
        attachedRecipe,
      );
      const dishListRecipe: DishListRecipe = {
        id: attachedRecipe.id,
        title: attachedRecipe.title,
        description: attachedRecipe.description,
        imageUrl: attachedRecipe.imageUrl,
        imageUrls: attachedRecipe.imageUrls,
        prepTime: attachedRecipe.prepTime,
        cookTime: attachedRecipe.cookTime,
        servings: attachedRecipe.servings,
        tags: attachedRecipe.tags,
        creatorId: attachedRecipe.creatorId,
        creator: attachedRecipe.creator,
        createdAt: attachedRecipe.createdAt,
        updatedAt: attachedRecipe.updatedAt,
      };
      queryClient.setQueryData<DishListDetailCache>(
        queryKeys.dishLists.detail(variables.dishListId),
        (old) => appendRecipeToDetailCache(old, dishListRecipe)
      );
      // Background invalidation for full consistency
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
