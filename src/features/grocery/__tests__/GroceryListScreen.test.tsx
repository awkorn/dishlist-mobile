import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import GroceryListScreen from "../screens/GroceryListScreen";
import { useGroceryList } from "../hooks/useGroceryList";

jest.mock("../hooks/useGroceryList", () => ({
  useGroceryList: jest.fn(),
}));

describe("GroceryListScreen", () => {
  it("shows a retryable error without showing an empty list", () => {
    const refresh = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue({
      items: [],
      isLoading: false,
      isError: true,
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
      refresh,
    });

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
});
