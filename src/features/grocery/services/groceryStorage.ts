import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@lib/constants';
import type { GroceryItem } from '../types';

const GROCERY_LIST_KEY = STORAGE_KEYS.GROCERY_LIST;

export const groceryStorage = {
  async loadItems(): Promise<GroceryItem[]> {
    try {
      const data = await AsyncStorage.getItem(GROCERY_LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load grocery items:', error);
      return [];
    }
  },

  async saveItems(items: GroceryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save grocery items:', error);
      throw error;
    }
  },

  async addItems(texts: string[]): Promise<GroceryItem[]> {
    const existing = await this.loadItems();
    const newItems: GroceryItem[] = texts
      .filter((text) => text.trim().length > 0)
      .map((text) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        checked: false,
        addedAt: Date.now(),
      }));
    
    const updated = [...newItems, ...existing];
    await this.saveItems(updated);
    return updated;
  },

  async toggleCheck(id: string): Promise<GroceryItem[]> {
    const items = await this.loadItems();
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await this.saveItems(updated);
    return updated;
  },

  async deleteItem(id: string): Promise<GroceryItem[]> {
    const items = await this.loadItems();
    const updated = items.filter((item) => item.id !== id);
    await this.saveItems(updated);
    return updated;
  },

  async clearChecked(): Promise<GroceryItem[]> {
    const items = await this.loadItems();
    const updated = items.filter((item) => !item.checked);
    await this.saveItems(updated);
    return updated;
  },

  async checkAll(): Promise<GroceryItem[]> {
    const items = await this.loadItems();
    const updated = items.map((item) => ({ ...item, checked: true }));
    await this.saveItems(updated);
    return updated;
  },

  async uncheckAll(): Promise<GroceryItem[]> {
    const items = await this.loadItems();
    const updated = items.map((item) => ({ ...item, checked: false }));
    await this.saveItems(updated);
    return updated;
  },

  async clearAll(): Promise<void> {
    await this.saveItems([]);
  },
};