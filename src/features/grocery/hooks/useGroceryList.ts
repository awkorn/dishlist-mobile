import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { groceryStorage } from '../services/groceryStorage';
import type { GroceryItem } from '../types';

interface UseGroceryListReturn {
  items: GroceryItem[];
  isLoading: boolean;
  isAddingItem: boolean;
  editingText: string;
  allChecked: boolean;
  checkedCount: number;
  setIsAddingItem: (value: boolean) => void;
  setEditingText: (value: string) => void;
  toggleCheck: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  saveCurrentItem: () => Promise<void>;
  handleClearChecked: () => void;
  handleToggleAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGroceryList(): UseGroceryListReturn {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingText, setEditingText] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const loaded = await groceryStorage.loadItems();
      setItems(loaded);
    } catch (error) {
      console.error('Failed to load grocery items:', error);
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
    const text = editingText.trim();
    if (text) {
      try {
        const updated = await groceryStorage.addItems([text]);
        setItems(updated);
      } catch (error) {
        Alert.alert('Error', 'Failed to add item');
      }
    }
    setEditingText('');
  }, [editingText]);

  const handleClearChecked = useCallback(() => {
    const checkedCount = items.filter((i) => i.checked).length;
    
    if (checkedCount === 0) {
      Alert.alert('No Items', 'There are no checked items to clear.');
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
    allChecked,
    checkedCount,
    setIsAddingItem,
    setEditingText,
    toggleCheck,
    deleteItem,
    saveCurrentItem,
    handleClearChecked,
    handleToggleAll,
    refresh: loadItems,
  };
}