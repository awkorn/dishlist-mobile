import React from "react";
import { FlatList } from "react-native";
import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import GroceryListScreen from "../screens/GroceryListScreen";
import { useGroceryList } from "../hooks/useGroceryList";

jest.mock("../hooks/useGroceryList", () => ({
  useGroceryList: jest.fn(),
}));

describe("GroceryListScreen", () => {
  const createHookValue = (overrides = {}) => ({
    items: [],
    isLoading: false,
    isError: false,
    isFetching: false,
    isAddingItem: false,
    editingText: "",
    editingItemId: null,
    allChecked: false,
    checkedCount: 0,
    setIsAddingItem: jest.fn(),
    setEditingText: jest.fn(),
    toggleCheck: jest.fn(),
    deleteItem: jest.fn(),
    saveCurrentItem: jest.fn(),
    startEditing: jest.fn(),
    cancelEditing: jest.fn(),
    saveEditedItem: jest.fn(),
    handleClearChecked: jest.fn(),
    handleToggleAll: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  });

  it("shows a retryable error without showing an empty list", () => {
    const refresh = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isError: true,
      refresh,
    }));

    const { getByText, queryByText } = render(<GroceryListScreen />);

    expect(
      getByText(
        "We couldn't load your grocery list. Your saved items have not been changed."
      )
    ).toBeTruthy();
    expect(queryByText("Your list is empty")).toBeNull();

    fireEvent.press(getByText("Try Again"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders grocery rows through a virtualized list", () => {
    const items = [
      { id: "1", text: "Milk", checked: false, addedAt: 123 },
      { id: "2", text: "Bread", checked: true, addedAt: 124 },
    ];

    (useGroceryList as jest.Mock).mockReturnValue(
      createHookValue({ items, checkedCount: 1 })
    );

    const { UNSAFE_getByType, getByText, queryByText } = render(
      <GroceryListScreen />
    );
    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data).toEqual(items);
    expect(list.props.initialNumToRender).toBe(12);
    expect(getByText("Milk")).toBeTruthy();
    expect(getByText("Bread")).toBeTruthy();
    expect(queryByText("Your list is empty")).toBeNull();
  });

  it("keeps the add row open when saving fails", async () => {
    const saveCurrentItem = jest.fn().mockResolvedValue(false);
    const setIsAddingItem = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isAddingItem: true,
      editingText: "Milk",
      saveCurrentItem,
      setIsAddingItem,
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    fireEvent(getByTestId("grocery-input"), "submitEditing");

    await waitFor(() => {
      expect(saveCurrentItem).toHaveBeenCalledTimes(1);
    });
    expect(setIsAddingItem).not.toHaveBeenCalledWith(false);
  });

  it("does not clear a pending item when add-another fails", async () => {
    const saveCurrentItem = jest.fn().mockResolvedValue(false);
    const setIsAddingItem = jest.fn();
    const setEditingText = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isAddingItem: true,
      editingText: "Milk",
      saveCurrentItem,
      setIsAddingItem,
      setEditingText,
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    fireEvent.press(getByTestId("add-item-button"));

    await waitFor(() => {
      expect(saveCurrentItem).toHaveBeenCalledTimes(1);
    });
    expect(setIsAddingItem).not.toHaveBeenCalled();
    expect(setEditingText).not.toHaveBeenCalled();
  });
});
