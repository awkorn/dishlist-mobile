import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService } from '../services';
import type { DishList, CreateDishListData, UpdateDishListData } from '../types';

/**
 * Hook for creating a new DishList
 */
export function useCreateDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDishListData) => dishlistService.createDishList(data),

    onMutate: async (newDishList) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      const optimisticDishList: DishList = {
        id: `temp-${Date.now()}`,
        title: newDishList.title,
        description: newDishList.description,
        visibility: newDishList.visibility || 'PUBLIC',
        isDefault: false,
        isPinned: false,
        recipeCount: 0,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        owner: { uid: 'current-user', username: '', firstName: '', lastName: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const previousMyLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list('my')
      );
      const previousAllLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list('all')
      );

      if (previousMyLists) {
        queryClient.setQueryData<DishList[]>(
          queryKeys.dishLists.list('my'),
          [optimisticDishList, ...previousMyLists]
        );
      }
      if (previousAllLists) {
        queryClient.setQueryData<DishList[]>(
          queryKeys.dishLists.list('all'),
          [optimisticDishList, ...previousAllLists]
        );
      }

      return { previousMyLists, previousAllLists };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousMyLists) {
        queryClient.setQueryData(queryKeys.dishLists.list('my'), context.previousMyLists);
      }
      if (context?.previousAllLists) {
        queryClient.setQueryData(queryKeys.dishLists.list('all'), context.previousAllLists);
      }
      Alert.alert('Error', 'Failed to create DishList. Please try again.');
    },

    onSuccess: (data) => {
      queryClient.setQueryData<DishList[]>(
        queryKeys.dishLists.list('my'),
        (old) => old ? [data, ...old.filter((item) => !item.id.startsWith('temp-'))] : [data]
      );
      queryClient.setQueryData<DishList[]>(
        queryKeys.dishLists.list('all'),
        (old) => old ? [data, ...old.filter((item) => !item.id.startsWith('temp-'))] : [data]
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
}

/**
 * Hook for updating a DishList
 */
export function useUpdateDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, ...data }: { dishListId: string } & UpdateDishListData) =>
      dishlistService.updateDishList(dishListId, data),

    onMutate: async ({ dishListId, title, description, visibility }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      const previousDetail = queryClient.getQueryData(queryKeys.dishLists.detail(dishListId));
      const previousAllLists = queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('all'));
      const previousMyLists = queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('my'));

      queryClient.setQueryData(queryKeys.dishLists.detail(dishListId), (old: any) => ({
        ...old,
        title,
        description,
        visibility,
        updatedAt: new Date().toISOString(),
      }));

      const updateInList = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.map((list) =>
          list.id === dishListId
            ? { ...list, title, description, visibility, updatedAt: new Date().toISOString() }
            : list
        );
      };

      queryClient.setQueryData(queryKeys.dishLists.list('all'), updateInList(previousAllLists));
      queryClient.setQueryData(queryKeys.dishLists.list('my'), updateInList(previousMyLists));

      return { previousDetail, previousAllLists, previousMyLists };
    },

    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.dishLists.detail(variables.dishListId), context.previousDetail);
      }
      if (context?.previousAllLists) {
        queryClient.setQueryData(queryKeys.dishLists.list('all'), context.previousAllLists);
      }
      if (context?.previousMyLists) {
        queryClient.setQueryData(queryKeys.dishLists.list('my'), context.previousMyLists);
      }
      Alert.alert('Error', 'Failed to update DishList. Please try again.');
    },

    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.dishLists.detail(variables.dishListId), data);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
}

/**
 * Hook for toggling pin status
 */
export function useTogglePinDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, isPinned }: { dishListId: string; isPinned: boolean }) =>
      isPinned ? dishlistService.unpinDishList(dishListId) : dishlistService.pinDishList(dishListId),

    onMutate: async ({ dishListId, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      const updateCache = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.map((list) =>
          list.id === dishListId ? { ...list, isPinned: !isPinned } : list
        );
      };

      const previousStates = {
        all: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('all')),
        my: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('my')),
        collaborations: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('collaborations')),
      };

      queryClient.setQueryData(queryKeys.dishLists.list('all'), updateCache(previousStates.all));
      queryClient.setQueryData(queryKeys.dishLists.list('my'), updateCache(previousStates.my));
      queryClient.setQueryData(queryKeys.dishLists.list('collaborations'), updateCache(previousStates.collaborations));

      return previousStates;
    },

    onError: (_error, _variables, context) => {
      if (context?.all) queryClient.setQueryData(queryKeys.dishLists.list('all'), context.all);
      if (context?.my) queryClient.setQueryData(queryKeys.dishLists.list('my'), context.my);
      if (context?.collaborations) queryClient.setQueryData(queryKeys.dishLists.list('collaborations'), context.collaborations);
      Alert.alert('Error', 'Failed to update pin status. Please try again.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
}

/**
 * Hook for toggling follow status
 */
export function useToggleFollowDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, isFollowing }: { dishListId: string; isFollowing: boolean }) =>
      isFollowing 
        ? dishlistService.unfollowDishList(dishListId) 
        : dishlistService.followDishList(dishListId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.detail(variables.dishListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },

    onError: () => {
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    },
  });
}

/**
 * Hook for deleting a DishList
 */
export function useDeleteDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dishListId: string) => dishlistService.deleteDishList(dishListId),

    onMutate: async (dishListId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      const removeFromCache = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.filter((list) => list.id !== dishListId);
      };

      const previousStates = {
        all: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('all')),
        my: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('my')),
        collaborations: queryClient.getQueryData<DishList[]>(queryKeys.dishLists.list('collaborations')),
      };

      queryClient.setQueryData(queryKeys.dishLists.list('all'), removeFromCache(previousStates.all));
      queryClient.setQueryData(queryKeys.dishLists.list('my'), removeFromCache(previousStates.my));
      queryClient.setQueryData(queryKeys.dishLists.list('collaborations'), removeFromCache(previousStates.collaborations));

      return previousStates;
    },

    onError: (error, _dishListId, context) => {
      if (context?.all) queryClient.setQueryData(queryKeys.dishLists.list('all'), context.all);
      if (context?.my) queryClient.setQueryData(queryKeys.dishLists.list('my'), context.my);
      if (context?.collaborations) queryClient.setQueryData(queryKeys.dishLists.list('collaborations'), context.collaborations);

      const errorMessage = (error as any)?.response?.data?.error || 'Failed to delete DishList. Please try again.';
      Alert.alert('Error', errorMessage);
    },

    onSuccess: (_, dishListId) => {
      queryClient.removeQueries({ queryKey: queryKeys.dishLists.detail(dishListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
}

/**
 * Hook for removing a recipe from a DishList
 */
export function useRemoveRecipeFromDishList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, recipeId }: { dishListId: string; recipeId: string }) =>
      dishlistService.removeRecipeFromDishList(dishListId, recipeId),

    onMutate: async ({ dishListId, recipeId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.detail(dishListId) });

      const previousDetail = queryClient.getQueryData(queryKeys.dishLists.detail(dishListId));

      queryClient.setQueryData(queryKeys.dishLists.detail(dishListId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          recipes: old.recipes.filter((r: any) => r.id !== recipeId),
          recipeCount: old.recipeCount - 1,
        };
      });

      return { previousDetail };
    },

    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.dishLists.detail(variables.dishListId), context.previousDetail);
      }
      Alert.alert('Error', 'Failed to remove recipe. Please try again.');
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.detail(variables.dishListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId, 'dishlists'] });
    },
  });
}