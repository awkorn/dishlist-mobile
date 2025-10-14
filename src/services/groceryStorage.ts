import AsyncStorage from '@react-native-async-storage/async-storage';

const GROCERY_LIST_KEY = 'grocery_list';

export interface GroceryItem {
  id: string;
  text: string;
  checked: boolean;
  addedAt: number;
}

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
    }
  },

  async addItems(texts: string[]): Promise<void> {
    const existing = await this.loadItems();
    const newItems: GroceryItem[] = texts.map(text => ({
      id: `${Date.now()}-${Math.random()}`,
      text: text.trim(),
      checked: false,
      addedAt: Date.now(),
    }));
    await this.saveItems([...existing, ...newItems]);
  },

  async toggleCheck(id: string): Promise<void> {
    const items = await this.loadItems();
    const updated = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await this.saveItems(updated);
  },

  async deleteItem(id: string): Promise<void> {
    const items = await this.loadItems();
    await this.saveItems(items.filter(item => item.id !== id));
  },

  async clearChecked(): Promise<void> {
    const items = await this.loadItems();
    await this.saveItems(items.filter(item => !item.checked));
  },

  async checkAll(): Promise<void> {
    const items = await this.loadItems();
    await this.saveItems(items.map(item => ({ ...item, checked: true })));
  },

  async uncheckAll(): Promise<void> {
    const items = await this.loadItems();
    await this.saveItems(items.map(item => ({ ...item, checked: false })));
  },
};