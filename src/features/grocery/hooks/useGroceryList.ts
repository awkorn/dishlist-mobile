import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { groceryStorage } from '../services/groceryStorage';
import {
  useAddGroceryItems,
  useToggleGroceryItem,
  useDeleteGroceryItem,
  useUpdateGroceryItem,
  useClearCheckedGroceryItems,
  useCheckAllGroceryItems,
  useUncheckAllGroceryItems,
} from './useGroceryMutations';
import { STALE_TIMES } from '@lib/constants';
import { queryKeys } from '@lib/queryKeys';

export function useGroceryList() {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Query for fetching items
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.grocery.list(),
    queryFn: groceryStorage.loadItems,
    staleTime: STALE_TIMES.GROCERY,
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Mutations
  const addItemsMutation = useAddGroceryItems();
  const toggleMutation = useToggleGroceryItem();
  const deleteMutation = useDeleteGroceryItem();
  const updateMutation = useUpdateGroceryItem();
  const clearCheckedMutation = useClearCheckedGroceryItems();
  const checkAllMutation = useCheckAllGroceryItems();
  const uncheckAllMutation = useUncheckAllGroceryItems();

  // Computed values
  const allChecked = useMemo(
    () => items.length > 0 && items.every((item) => item.checked),
    [items]
  );

  const checkedCount = useMemo(
    () => items.filter((item) => item.checked).length,
    [items]
  );

  // Actions
  const toggleCheck = useCallback(
    (id: string) => {
      toggleMutation.mutate(id);
    },
    [toggleMutation]
  );

  const deleteItem = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const saveCurrentItem = useCallback(async () => {
    if (!editingText.trim()) return;

    addItemsMutation.mutate([editingText], {
      onSuccess: () => {
        setEditingText('');
      },
    });
  }, [editingText, addItemsMutation]);

  const startEditing = useCallback((id: string, currentText: string) => {
    setEditingItemId(id);
    setEditingText(currentText);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingItemId(null);
    setEditingText('');
  }, []);

  const saveEditedItem = useCallback(
    (id: string, newText: string) => {
      const trimmed = newText.trim();

      // If empty, cancel edit (don't delete)
      if (!trimmed) {
        cancelEditing();
        return;
      }

      updateMutation.mutate(
        { id, text: trimmed },
        {
          onSuccess: () => {
            setEditingItemId(null);
            setEditingText('');
          },
        }
      );
    },
    [updateMutation, cancelEditing]
  );

  const handleClearChecked = useCallback(() => {
    const count = checkedCount;

    if (count === 0) {
      return;
    }

    Alert.alert(
      'Clear Checked Items',
      `Remove ${count} checked ${count === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearCheckedMutation.mutate(),
        },
      ]
    );
  }, [checkedCount, clearCheckedMutation]);

  const handleToggleAll = useCallback(() => {
    if (allChecked) {
      uncheckAllMutation.mutate();
    } else {
      checkAllMutation.mutate();
    }
  }, [allChecked, checkAllMutation, uncheckAllMutation]);

  return {
    // Data
    items,
    isLoading,
    allChecked,
    checkedCount,

    // UI state
    isAddingItem,
    editingText,
    editingItemId,

    // UI state setters
    setIsAddingItem,
    setEditingText,

    // Actions
    toggleCheck,
    deleteItem,
    saveCurrentItem,
    startEditing,
    cancelEditing,
    saveEditedItem,
    handleClearChecked,
    handleToggleAll,
    refresh: refetch,
  };
}