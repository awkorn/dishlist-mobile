import AsyncStorage from '@react-native-async-storage/async-storage';
import { groceryStorage } from '../services/groceryStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('groceryStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadItems', () => {
    it('returns empty array when no data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const items = await groceryStorage.loadItems();

      expect(items).toEqual([]);
    });

    it('returns parsed items from storage', async () => {
      const mockItems = [
        { id: '1', text: 'Milk', checked: false, addedAt: 123 },
        { id: '2', text: 'Bread', checked: true, addedAt: 124 },
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockItems)
      );

      const items = await groceryStorage.loadItems();

      expect(items).toEqual(mockItems);
    });

    it('returns empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const items = await groceryStorage.loadItems();

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

      const result = await groceryStorage.addItems(['New Item']);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('New Item');
      expect(result[0].checked).toBe(false);
      expect(result[1].text).toBe('Existing');
    });

    it('filters out empty strings', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.addItems(['Valid', '', '  ', 'Also Valid']);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Valid');
      expect(result[1].text).toBe('Also Valid');
    });

    it('trims whitespace from item text', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('[]');
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await groceryStorage.addItems(['  Trimmed  ']);

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

      const result = await groceryStorage.toggleCheck('1');

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

      const result = await groceryStorage.toggleCheck('1');

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

      const result = await groceryStorage.deleteItem('1');

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

      const result = await groceryStorage.clearChecked();

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

      const result = await groceryStorage.checkAll();

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

      const result = await groceryStorage.uncheckAll();

      expect(result.every((item) => !item.checked)).toBe(true);
    });
  });
});