import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDishLists, createDishList, DishList } from '../services/api';
import { Alert } from 'react-native';

// Query keys for cache management
export const dishListKeys = {
  all: ['dishLists'] as const,
  list: (tab: string) => ['dishLists', 'list', tab] as const,
};

// Create DishList with optimistic updates
export const useCreateDishList = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDishList,
    
    onMutate: async (newDishList) => {
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: dishListKeys.all });
      
      // Create optimistic DishList
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
        owner: {
          uid: 'current-user',
          username: '',
          firstName: '',
          lastName: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save current state for rollback
      const previousMyLists = queryClient.getQueryData<DishList[]>(dishListKeys.list('my'));
      const previousAllLists = queryClient.getQueryData<DishList[]>(dishListKeys.list('all'));
      
      // Optimistically update UI
      if (previousMyLists) {
        queryClient.setQueryData<DishList[]>(
          dishListKeys.list('my'),
          [optimisticDishList, ...previousMyLists]
        );
      }
      
      if (previousAllLists) {
        queryClient.setQueryData<DishList[]>(
          dishListKeys.list('all'),
          [optimisticDishList, ...previousAllLists]
        );
      }
      
      return { previousMyLists, previousAllLists };
    },
    
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMyLists) {
        queryClient.setQueryData(dishListKeys.list('my'), context.previousMyLists);
      }
      if (context?.previousAllLists) {
        queryClient.setQueryData(dishListKeys.list('all'), context.previousAllLists);
      }
      
      Alert.alert('Error', 'Failed to create DishList');
    },
    
    onSuccess: (data) => {
      // Replace temp with real data
      queryClient.setQueryData<DishList[]>(dishListKeys.list('my'), (old) => {
        if (!old) return [data];
        return [data, ...old.filter(item => !item.id.startsWith('temp-'))];
      });
      
      queryClient.setQueryData<DishList[]>(dishListKeys.list('all'), (old) => {
        if (!old) return [data];
        return [data, ...old.filter(item => !item.id.startsWith('temp-'))];
      });
    },
    
    onSettled: () => {
      // Ensure data is fresh
      queryClient.invalidateQueries({ queryKey: dishListKeys.all });
    },
  });
};