import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useGroceryList } from '../hooks/useGroceryList';
import { groceryStorage } from '../services/groceryStorage';

// Mock the groceryStorage service
jest.mock('../services/groceryStorage', () => ({
  groceryStorage: {
    loadItems: jest.fn(),
    addItems: jest.fn(),
    toggleCheck: jest.fn(),
    deleteItem: jest.fn(),
    clearChecked: jest.fn(),
    checkAll: jest.fn(),
    uncheckAll: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('useGroceryList', () => {
  const mockItems = [
    { id: '1', text: 'Milk', checked: false, addedAt: 123 },
    { id: '2', text: 'Bread', checked: true, addedAt: 124 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (groceryStorage.loadItems as jest.Mock).mockResolvedValue(mockItems);
  });

  it('loads items on mount', async () => {
    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(groceryStorage.loadItems).toHaveBeenCalledTimes(1);
  });

  it('calculates allChecked correctly', async () => {
    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Not all items are checked
    expect(result.current.allChecked).toBe(false);
  });

  it('calculates checkedCount correctly', async () => {
    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.checkedCount).toBe(1);
  });

  it('toggles item check status', async () => {
    const updatedItems = [
      { id: '1', text: 'Milk', checked: true, addedAt: 123 },
      { id: '2', text: 'Bread', checked: true, addedAt: 124 },
    ];
    (groceryStorage.toggleCheck as jest.Mock).mockResolvedValueOnce(updatedItems);

    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleCheck('1');
    });

    expect(groceryStorage.toggleCheck).toHaveBeenCalledWith('1');
    expect(result.current.items).toEqual(updatedItems);
  });

  it('deletes an item', async () => {
    const updatedItems = [{ id: '2', text: 'Bread', checked: true, addedAt: 124 }];
    (groceryStorage.deleteItem as jest.Mock).mockResolvedValueOnce(updatedItems);

    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteItem('1');
    });

    expect(groceryStorage.deleteItem).toHaveBeenCalledWith('1');
    expect(result.current.items).toEqual(updatedItems);
  });

  it('sets editing text and isAddingItem', async () => {
    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setEditingText('New item');
      result.current.setIsAddingItem(true);
    });

    expect(result.current.editingText).toBe('New item');
    expect(result.current.isAddingItem).toBe(true);
  });

  it('saves current item when text is not empty', async () => {
    const newItems = [
      { id: '3', text: 'Eggs', checked: false, addedAt: 125 },
      ...mockItems,
    ];
    (groceryStorage.addItems as jest.Mock).mockResolvedValueOnce(newItems);

    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setEditingText('Eggs');
    });

    await act(async () => {
      await result.current.saveCurrentItem();
    });

    expect(groceryStorage.addItems).toHaveBeenCalledWith(['Eggs']);
    expect(result.current.editingText).toBe('');
  });

  it('does not save when text is empty', async () => {
    const { result } = renderHook(() => useGroceryList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setEditingText('   ');
    });

    await act(async () => {
      await result.current.saveCurrentItem();
    });

    expect(groceryStorage.addItems).not.toHaveBeenCalled();
  });
});