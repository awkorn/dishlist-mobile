import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Alert } from "react-native";
import { useGroceryList } from "../hooks/useGroceryList";
import { groceryStorage } from "../services/groceryStorage";

// Mock the groceryStorage service
jest.mock("../services/groceryStorage", () => ({
  groceryStorage: {
    loadItems: jest.fn(),
    addItems: jest.fn(),
    toggleCheck: jest.fn(),
    deleteItem: jest.fn(),
    updateItem: jest.fn(),
    clearChecked: jest.fn(),
    checkAll: jest.fn(),
    uncheckAll: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Wrapper component for React Query
const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useGroceryList", () => {
  const mockItems = [
    { id: "1", text: "Milk", checked: false, addedAt: 123 },
    { id: "2", text: "Bread", checked: true, addedAt: 124 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (groceryStorage.loadItems as jest.Mock).mockResolvedValue(mockItems);
  });

  describe("initial loading", () => {
    it("loads items on mount", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual(mockItems);
      expect(groceryStorage.loadItems).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no items exist", async () => {
      (groceryStorage.loadItems as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe("computed values", () => {
    it("calculates allChecked correctly when not all checked", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // mockItems has 1 checked, 1 unchecked
      expect(result.current.allChecked).toBe(false);
    });

    it("calculates allChecked correctly when all checked", async () => {
      const allCheckedItems = [
        { id: "1", text: "Milk", checked: true, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.loadItems as jest.Mock).mockResolvedValue(allCheckedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allChecked).toBe(true);
    });

    it("calculates allChecked as false for empty list", async () => {
      (groceryStorage.loadItems as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allChecked).toBe(false);
    });

    it("calculates checkedCount correctly", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.checkedCount).toBe(1);
    });
  });

  describe("toggle check", () => {
    it("calls toggleCheck mutation with correct id", async () => {
      const updatedItems = [
        { id: "1", text: "Milk", checked: true, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.toggleCheck as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleCheck("1");
      });

      await waitFor(() => {
        expect(groceryStorage.toggleCheck).toHaveBeenCalledWith("1");
      });
    });

    it("updates items after successful toggle", async () => {
      const updatedItems = [
        { id: "1", text: "Milk", checked: true, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.toggleCheck as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleCheck("1");
      });

      await waitFor(() => {
        expect(result.current.items).toEqual(updatedItems);
      });
    });
  });

  describe("delete item", () => {
    it("calls deleteItem mutation with correct id", async () => {
      const updatedItems = [{ id: "2", text: "Bread", checked: true, addedAt: 124 }];
      (groceryStorage.deleteItem as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItem("1");
      });

      await waitFor(() => {
        expect(groceryStorage.deleteItem).toHaveBeenCalledWith("1");
      });
    });

    it("updates items after successful delete", async () => {
      const updatedItems = [{ id: "2", text: "Bread", checked: true, addedAt: 124 }];
      (groceryStorage.deleteItem as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItem("1");
      });

      await waitFor(() => {
        expect(result.current.items).toEqual(updatedItems);
      });
    });
  });

  describe("local state management", () => {
    it("sets editing text", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setEditingText("New item");
      });

      expect(result.current.editingText).toBe("New item");
    });

    it("sets isAddingItem", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setIsAddingItem(true);
      });

      expect(result.current.isAddingItem).toBe(true);
    });

    it("startEditing sets editingItemId and editingText", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.startEditing("1", "Milk");
      });

      expect(result.current.editingItemId).toBe("1");
      expect(result.current.editingText).toBe("Milk");
    });

    it("cancelEditing clears editingItemId and editingText", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.startEditing("1", "Milk");
      });

      act(() => {
        result.current.cancelEditing();
      });

      expect(result.current.editingItemId).toBe(null);
      expect(result.current.editingText).toBe("");
    });
  });

  describe("save current item", () => {
    it("adds item when text is not empty", async () => {
      const newItems = [
        { id: "3", text: "Eggs", checked: false, addedAt: 125 },
        ...mockItems,
      ];
      (groceryStorage.addItems as jest.Mock).mockResolvedValue(newItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setEditingText("Eggs");
      });

      await act(async () => {
        await result.current.saveCurrentItem();
      });

      await waitFor(() => {
        expect(groceryStorage.addItems).toHaveBeenCalledWith(["Eggs"]);
      });
    });

    it("clears editing text after successful save", async () => {
      const newItems = [
        { id: "3", text: "Eggs", checked: false, addedAt: 125 },
        ...mockItems,
      ];
      (groceryStorage.addItems as jest.Mock).mockResolvedValue(newItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setEditingText("Eggs");
      });

      await act(async () => {
        await result.current.saveCurrentItem();
      });

      await waitFor(() => {
        expect(result.current.editingText).toBe("");
      });
    });

    it("does not add item when text is empty", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setEditingText("   ");
      });

      await act(async () => {
        await result.current.saveCurrentItem();
      });

      expect(groceryStorage.addItems).not.toHaveBeenCalled();
    });
  });

  describe("save edited item", () => {
    it("calls updateItem mutation with correct parameters", async () => {
      const updatedItems = [
        { id: "1", text: "Updated Milk", checked: false, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.updateItem as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.saveEditedItem("1", "Updated Milk");
      });

      await waitFor(() => {
        expect(groceryStorage.updateItem).toHaveBeenCalledWith("1", "Updated Milk");
      });
    });

    it("clears editingItemId after successful update", async () => {
      const updatedItems = [
        { id: "1", text: "Updated Milk", checked: false, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.updateItem as jest.Mock).mockResolvedValue(updatedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.startEditing("1", "Milk");
      });

      act(() => {
        result.current.saveEditedItem("1", "Updated Milk");
      });

      await waitFor(() => {
        expect(result.current.editingItemId).toBe(null);
      });
    });

    it("cancels editing when text is empty", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.startEditing("1", "Milk");
      });

      act(() => {
        result.current.saveEditedItem("1", "   ");
      });

      // Should cancel editing, not call updateItem
      expect(groceryStorage.updateItem).not.toHaveBeenCalled();
      expect(result.current.editingItemId).toBe(null);
    });
  });

  describe("handleToggleAll", () => {
    it("calls checkAll when not all items are checked", async () => {
      const allChecked = [
        { id: "1", text: "Milk", checked: true, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      (groceryStorage.checkAll as jest.Mock).mockResolvedValue(allChecked);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // mockItems has 1 unchecked, so not all checked
      expect(result.current.allChecked).toBe(false);

      act(() => {
        result.current.handleToggleAll();
      });

      await waitFor(() => {
        expect(groceryStorage.checkAll).toHaveBeenCalled();
      });
    });

    it("calls uncheckAll when all items are checked", async () => {
      const allCheckedItems = [
        { id: "1", text: "Milk", checked: true, addedAt: 123 },
        { id: "2", text: "Bread", checked: true, addedAt: 124 },
      ];
      const allUnchecked = [
        { id: "1", text: "Milk", checked: false, addedAt: 123 },
        { id: "2", text: "Bread", checked: false, addedAt: 124 },
      ];
      (groceryStorage.loadItems as jest.Mock).mockResolvedValue(allCheckedItems);
      (groceryStorage.uncheckAll as jest.Mock).mockResolvedValue(allUnchecked);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.allChecked).toBe(true);

      act(() => {
        result.current.handleToggleAll();
      });

      await waitFor(() => {
        expect(groceryStorage.uncheckAll).toHaveBeenCalled();
      });
    });
  });

  describe("handleClearChecked", () => {
    it("shows confirmation alert before clearing", async () => {
      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // mockItems has 1 checked item
      act(() => {
        result.current.handleClearChecked();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Clear Checked Items",
        "Remove 1 checked item?",
        expect.any(Array)
      );
    });

    it("calls clearChecked when user confirms", async () => {
      const uncheckedOnly = [{ id: "1", text: "Milk", checked: false, addedAt: 123 }];
      (groceryStorage.clearChecked as jest.Mock).mockResolvedValue(uncheckedOnly);

      // Capture the Alert.alert callback
      let alertCallback: (() => void) | undefined;
      (Alert.alert as jest.Mock).mockImplementation(
        (_title: string, _message: string, buttons?: Array<{ text: string; onPress?: () => void }>) => {
          const clearButton = buttons?.find((b) => b.text === "Clear");
          alertCallback = clearButton?.onPress;
        }
      );

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleClearChecked();
      });

      // Simulate user pressing "Clear"
      if (alertCallback) {
        act(() => {
          alertCallback!();
        });
      }

      await waitFor(() => {
        expect(groceryStorage.clearChecked).toHaveBeenCalled();
      });
    });

    it("does nothing when no items are checked", async () => {
      const noCheckedItems = [
        { id: "1", text: "Milk", checked: false, addedAt: 123 },
        { id: "2", text: "Bread", checked: false, addedAt: 124 },
      ];
      (groceryStorage.loadItems as jest.Mock).mockResolvedValue(noCheckedItems);

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleClearChecked();
      });

      // Should not show alert when no checked items
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("shows alert on toggle error", async () => {
      (groceryStorage.toggleCheck as jest.Mock).mockRejectedValue(new Error("Toggle failed"));

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.toggleCheck("1");
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update item");
      });
    });

    it("shows alert on delete error", async () => {
      (groceryStorage.deleteItem as jest.Mock).mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteItem("1");
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to delete item");
      });
    });

    it("shows alert on add error", async () => {
      (groceryStorage.addItems as jest.Mock).mockRejectedValue(new Error("Add failed"));

      const { result } = renderHook(() => useGroceryList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setEditingText("Test");
      });

      await act(async () => {
        await result.current.saveCurrentItem();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to add items");
      });
    });
  });
});