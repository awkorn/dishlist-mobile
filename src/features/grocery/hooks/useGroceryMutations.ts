import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { groceryStorage } from '../services/groceryStorage';
import type { GroceryItem } from '../types';
import { queryKeys } from '@lib/queryKeys';

/**
 * Hook for adding items to grocery list
 */
export function useAddGroceryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (texts: string[]) => groceryStorage.addItems(texts),

    onMutate: async (texts) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically add new items
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) => {
        const newItems: GroceryItem[] = texts
          .filter((text) => text.trim().length > 0)
          .map((text) => ({
            id: `temp-${Date.now()}-${Math.random()}`,
            text: text.trim(),
            checked: false,
            addedAt: Date.now(),
          }));
        return [...newItems, ...old];
      });

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to add items');
    },

    onSuccess: (data) => {
      // Update with real server data (with real IDs from AsyncStorage)
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for toggling item check status
 */
export function useToggleGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groceryStorage.toggleCheck(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically toggle
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to update item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for deleting a grocery item
 */
export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => groceryStorage.deleteItem(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically remove
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to delete item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for updating an item's text
 */
export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      groceryStorage.updateItem(id, text),

    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically update
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, text: text.trim() } : item
        )
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to update item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for clearing checked items
 */
export function useClearCheckedGroceryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => groceryStorage.clearChecked(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically remove checked items
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.filter((item) => !item.checked)
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to clear items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for checking all items
 */
export function useCheckAllGroceryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => groceryStorage.checkAll(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically check all
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.map((item) => ({ ...item, checked: true }))
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to check all items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}

/**
 * Hook for unchecking all items
 */
export function useUncheckAllGroceryItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => groceryStorage.uncheckAll(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.grocery.list() });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKeys.grocery.list());

      // Optimistically uncheck all
      queryClient.setQueryData<GroceryItem[]>(queryKeys.grocery.list(), (old = []) =>
        old.map((item) => ({ ...item, checked: false }))
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.grocery.list(), context.previousItems);
      }
      Alert.alert('Error', 'Failed to uncheck all items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.grocery.list(), data);
    },
  });
}