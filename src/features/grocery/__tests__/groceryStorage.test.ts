import AsyncStorage from '@react-native-async-storage/async-storage';
import { groceryStorage } from '../services/groceryStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('groceryStorage', () => {
  const userId = 'user-123';
  const storageKey = `grocery_list:${userId}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadItems', () => {
    it('returns empty array when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const items = await groceryStorage.loadItems(userId);

      expect(items).toEqual([]);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('returns parsed items from storage', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );

      const items = await groceryStorage.loadItems(userId);

      expect(items).toEqual(mockItems);
    });

    it('returns empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const items = await groceryStorage.loadItems(userId);

      expect(items).toEqual([]);
    });
  });

  describe('addItems', () => {
    it('adds new items to the beginning of the list', async () => {
      const existingItems = [
        { id: '1', text: 'Existing', checked: false, addedAt: 100 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existingItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.addItems(userId, ['New Item']);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('New Item');
      expect(result[0].checked).toBe(false);
      expect(result[1].text).toBe('Existing');
    });

    it('filters out empty strings', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.addItems(userId, [
        'Valid',
        '',
        '  ',
        'Also Valid',
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Valid');
      expect(result[1].text).toBe('Also Valid');
    });

    it('trims whitespace from item text', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.addItems(userId, ['  Trimmed  ']);

      expect(result[0].text).toBe('Trimmed');
    });
  });

  describe('toggleCheck', () => {
    it('toggles checked status of an item', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.toggleCheck(userId, '1');

      expect(result[0].checked).toBe(true);
    });

    it('does not affect other items', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.toggleCheck(userId, '1');

      expect(result[0].checked).toBe(true);
      expect(result[1].checked).toBe(true); // unchanged
    });
  });

  describe('deleteItem', () => {
    it('removes the specified item', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.deleteItem(userId, '1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('clearChecked', () => {
    it('removes all checked items', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
        { id: '3', text: 'Eggs', checked: true, addedAt: 125 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.clearChecked(userId);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Milk');
    });
  });

  describe('checkAll', () => {
    it('marks all items as checked', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: false, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.checkAll(userId);

      expect(result.every((item) => item.checked)).toBe(true);
    });
  });

  describe('uncheckAll', () => {
    it('marks all items as unchecked', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: true, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.uncheckAll(userId);

      expect(result.every((item) => !item.checked)).toBe(true);
    });
  });

  describe('concurrent mutations', () => {
    it('applies rapid mutations to the latest saved list', async () => {
      let storedValue = JSON.stringify([
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: false, addedAt: 124 },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockImplementation(
        async () => storedValue
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation(
        async (_key: string, value: string) => {
          await Promise.resolve();
          storedValue = value;
        }
      );

      await Promise.all([
        groceryStorage.toggleCheck(userId, '1'),
        groceryStorage.deleteItem(userId, '2'),
      ]);

      expect(JSON.parse(storedValue)).toEqual([
        { id: '1', text: 'Milk', checked: true, addedAt: 123 },
      ]);
    });

    it('continues processing after an earlier mutation fails', async () => {
      let storedValue = JSON.stringify([
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockImplementation(
        async () => storedValue
      );
      (AsyncStorage.setItem as jest.Mock)
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockImplementationOnce(async (_key: string, value: string) => {
          storedValue = value;
        });

      const failedToggle = groceryStorage.toggleCheck(userId, '1');
      const queuedDelete = groceryStorage.deleteItem(userId, '1');

      await expect(failedToggle).rejects.toThrow('Storage error');
      await expect(queuedDelete).resolves.toEqual([]);
      expect(JSON.parse(storedValue)).toEqual([]);
    });
  });

  describe('account isolation', () => {
    it('uses a different storage key for each user', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('[]')
        .mockResolvedValueOnce('[]');

      await groceryStorage.loadItems('user-a');
      await groceryStorage.loadItems('user-b');

      expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(
        1,
        'grocery_list:user-a'
      );
      expect(AsyncStorage.getItem).toHaveBeenNthCalledWith(
        2,
        'grocery_list:user-b'
      );
    });

    it('clears only the specified user grocery list', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      await groceryStorage.clearAll('user-a');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'grocery_list:user-a'
      );
    });

    it('can remove the legacy unscoped grocery list', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      await groceryStorage.clearLegacyItems();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('grocery_list');
    });
  });
});
