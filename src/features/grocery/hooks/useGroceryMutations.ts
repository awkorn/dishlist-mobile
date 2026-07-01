import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Alert } from 'react-native';
import { groceryStorage } from '../services/groceryStorage';
import type { GroceryItem } from '../types';
import { queryKeys } from '@lib/queryKeys';
import { useAuth } from '@providers/AuthProvider/AuthContext';

type GroceryQueryKey = ReturnType<typeof queryKeys.grocery.list>;

const rollbackItems = (
  queryClient: QueryClient,
  queryKey: GroceryQueryKey,
  previousItems: GroceryItem[] | undefined
) => {
  if (previousItems === undefined) {
    queryClient.removeQueries({ queryKey, exact: true });
  } else {
    queryClient.setQueryData(queryKey, previousItems);
  }
};

function useGroceryUser() {
  const { user } = useAuth();
  const userId = user?.id;

  const requireUserId = () => {
    if (!userId) {
      throw new Error('You must be signed in to update grocery items');
    }
    return userId;
  };

  return {
    requireUserId,
    queryKey: queryKeys.grocery.list(userId ?? ''),
  };
}

/**
 * Hook for adding items to grocery list
 */
export function useAddGroceryItems() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: (texts: string[]) =>
      groceryStorage.addItems(requireUserId(), texts),

    onMutate: async (texts) => {
      requireUserId();
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically add new items
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) => {
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
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to add items');
    },

    onSuccess: (data) => {
      // Update with real server data (with real IDs from AsyncStorage)
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for toggling item check status
 */
export function useToggleGroceryItem() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: (id: string) =>
      groceryStorage.toggleCheck(requireUserId(), id),

    onMutate: async (id) => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically toggle
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to update item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for deleting a grocery item
 */
export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: (id: string) =>
      groceryStorage.deleteItem(requireUserId(), id),

    onMutate: async (id) => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to delete item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for updating an item's text
 */
export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      groceryStorage.updateItem(requireUserId(), id, text),

    onMutate: async ({ id, text }) => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, text: text.trim() } : item
        )
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to update item');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for clearing checked items
 */
export function useClearCheckedGroceryItems() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: () => groceryStorage.clearChecked(requireUserId()),

    onMutate: async () => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically remove checked items
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.filter((item) => !item.checked)
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to clear items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for checking all items
 */
export function useCheckAllGroceryItems() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: () => groceryStorage.checkAll(requireUserId()),

    onMutate: async () => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically check all
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.map((item) => ({ ...item, checked: true }))
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to check all items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

/**
 * Hook for unchecking all items
 */
export function useUncheckAllGroceryItems() {
  const queryClient = useQueryClient();
  const { requireUserId, queryKey } = useGroceryUser();

  return useMutation({
    mutationFn: () => groceryStorage.uncheckAll(requireUserId()),

    onMutate: async () => {
      requireUserId();
      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<GroceryItem[]>(queryKey);

      // Optimistically uncheck all
      queryClient.setQueryData<GroceryItem[]>(queryKey, (old = []) =>
        old.map((item) => ({ ...item, checked: false }))
      );

      return { previousItems };
    },

    onError: (_error, _variables, context) => {
      if (context) {
        rollbackItems(queryClient, queryKey, context.previousItems);
      }
      Alert.alert('Error', 'Failed to uncheck all items');
    },

    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
