import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@lib/constants';
import type { GroceryItem } from '../types';

const GROCERY_LIST_KEY = STORAGE_KEYS.GROCERY_LIST;
const mutationQueues = new Map<string, Promise<unknown>>();

export class GroceryStorageReadError extends Error {
  cause: unknown;

  constructor(cause: unknown) {
    super('Unable to read the saved grocery list');
    this.name = 'GroceryStorageReadError';
    this.cause = cause;
  }
}

const isValidGroceryItem = (item: unknown): item is GroceryItem => {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const value = item as Record<string, unknown>;

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    typeof value.checked === 'boolean' &&
    typeof value.addedAt === 'number' &&
    Number.isFinite(value.addedAt)
  );
};

const parseStoredItems = (data: string): GroceryItem[] => {
  const parsed: unknown = JSON.parse(data);

  if (!Array.isArray(parsed)) {
    throw new Error('Stored grocery data is not an array');
  }

  const ids = new Set<string>();

  for (const item of parsed) {
    if (!isValidGroceryItem(item) || ids.has(item.id)) {
      throw new Error('Stored grocery data contains an invalid item');
    }

    ids.add(item.id);
  }

  return parsed as GroceryItem[];
};

const getUserGroceryListKey = (userId: string) => {
  if (!userId) {
    throw new Error('A user ID is required to access grocery items');
  }

  return `${GROCERY_LIST_KEY}:${userId}`;
};

const enqueueMutation = <T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> => {
  getUserGroceryListKey(userId);

  const previous = mutationQueues.get(userId) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);

  mutationQueues.set(userId, result);

  return result.finally(() => {
    if (mutationQueues.get(userId) === result) {
      mutationQueues.delete(userId);
    }
  });
};

export const groceryStorage = {
  async loadItems(userId: string): Promise<GroceryItem[]> {
    try {
      const data = await AsyncStorage.getItem(getUserGroceryListKey(userId));
      return data === null ? [] : parseStoredItems(data);
    } catch (error) {
      console.error('Failed to load grocery items:', error);
      throw new GroceryStorageReadError(error);
    }
  },

  async saveItems(userId: string, items: GroceryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        getUserGroceryListKey(userId),
        JSON.stringify(items)
      );
    } catch (error) {
      console.error('Failed to save grocery items:', error);
      throw error;
    }
  },

  async addItems(userId: string, texts: string[]): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const existing = await this.loadItems(userId);
      const newItems: GroceryItem[] = texts
        .filter((text) => text.trim().length > 0)
        .map((text) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: text.trim(),
          checked: false,
          addedAt: Date.now(),
        }));

      const updated = [...newItems, ...existing];
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async toggleCheck(userId: string, id: string): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async deleteItem(userId: string, id: string): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.filter((item) => item.id !== id);
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async updateItem(
    userId: string,
    id: string,
    newText: string
  ): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.map((item) =>
        item.id === id ? { ...item, text: newText.trim() } : item
      );
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async clearChecked(userId: string): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.filter((item) => !item.checked);
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async checkAll(userId: string): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.map((item) => ({ ...item, checked: true }));
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async uncheckAll(userId: string): Promise<GroceryItem[]> {
    return enqueueMutation(userId, async () => {
      const items = await this.loadItems(userId);
      const updated = items.map((item) => ({ ...item, checked: false }));
      await this.saveItems(userId, updated);
      return updated;
    });
  },

  async clearAll(userId: string): Promise<void> {
    return enqueueMutation(userId, () =>
      AsyncStorage.removeItem(getUserGroceryListKey(userId))
    );
  },

  async clearLegacyItems(): Promise<void> {
    await AsyncStorage.removeItem(GROCERY_LIST_KEY);
  },
};
