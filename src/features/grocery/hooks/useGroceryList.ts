import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { groceryStorage } from '../services/groceryStorage';
import type { GroceryItem } from '../types';

export function useGroceryList() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const loaded = await groceryStorage.loadItems();
      setItems(loaded);
    } catch (error) {
      Alert.alert('Error', 'Failed to load grocery list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const toggleCheck = useCallback(async (id: string) => {
    try {
      const updated = await groceryStorage.toggleCheck(id);
      setItems(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const updated = await groceryStorage.deleteItem(id);
      setItems(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    }
  }, []);

  const saveCurrentItem = useCallback(async () => {
    if (!editingText.trim()) return;

    try {
      const updated = await groceryStorage.addItems([editingText]);
      setItems(updated);
      setEditingText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  }, [editingText]);

  // Start editing an existing item
  const startEditing = useCallback((id: string, currentText: string) => {
    setEditingItemId(id);
    setEditingText(currentText);
  }, []);

  // Cancel editing and revert
  const cancelEditing = useCallback(() => {
    setEditingItemId(null);
    setEditingText('');
  }, []);

  // Save the edited item
  const saveEditedItem = useCallback(async (id: string, newText: string) => {
    const trimmed = newText.trim();
    
    // If empty, cancel edit (don't delete)
    if (!trimmed) {
      cancelEditing();
      return;
    }

    try {
      const updated = await groceryStorage.updateItem(id, trimmed);
      setItems(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setEditingItemId(null);
      setEditingText('');
    }
  }, [cancelEditing]);

  const handleClearChecked = useCallback(async () => {
    const checkedCount = items.filter((i) => i.checked).length;
    
    if (checkedCount === 0) {
      return;
    }

    Alert.alert(
      'Clear Checked Items',
      `Remove ${checkedCount} checked ${checkedCount === 1 ? 'item' : 'items'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await groceryStorage.clearChecked();
              setItems(updated);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear items');
            }
          },
        },
      ]
    );
  }, [items]);

  const handleToggleAll = useCallback(async () => {
    const allChecked = items.length > 0 && items.every((i) => i.checked);
    
    try {
      const updated = allChecked
        ? await groceryStorage.uncheckAll()
        : await groceryStorage.checkAll();
      setItems(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update items');
    }
  }, [items]);

  const allChecked = items.length > 0 && items.every((i) => i.checked);
  const checkedCount = items.filter((i) => i.checked).length;

  return {
    items,
    isLoading,
    isAddingItem,
    editingText,
    editingItemId,
    allChecked,
    checkedCount,
    setIsAddingItem,
    setEditingText,
    toggleCheck,
    deleteItem,
    saveCurrentItem,
    startEditing,
    cancelEditing,
    saveEditedItem,
    handleClearChecked,
    handleToggleAll,
    refresh: loadItems,
  };
}