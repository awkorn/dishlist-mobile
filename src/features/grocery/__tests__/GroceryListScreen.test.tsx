import React from "react";
import { Alert, FlatList, StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import GroceryListScreen from "../screens/GroceryListScreen";
import { useGroceryList } from "../hooks/useGroceryList";
import { theme } from "@styles/theme";

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
    liveActivity: {
      isSupported: false,
      areActivitiesEnabled: false,
      isActive: false,
      isLoading: false,
      isChanging: false,
      uncheckedCount: 0,
      start: jest.fn(),
      end: jest.fn(),
      refreshStatus: jest.fn(),
    },
    ...overrides,
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it("matches the Lock Screen control's bottom gap to the header button inset", () => {
    const items = [
      { id: "1", text: "Milk", checked: false, addedAt: 123 },
    ];

    (useGroceryList as jest.Mock).mockReturnValue(
      createHookValue({
        items,
        liveActivity: {
          ...createHookValue().liveActivity,
          isSupported: true,
          uncheckedCount: 1,
        },
      })
    );

    const { getByTestId } = render(<GroceryListScreen />);
    const control = getByTestId("grocery-live-activity-control");

    expect(StyleSheet.flatten(control.props.style)).toMatchObject({
      marginBottom: 12,
    });
  });

  it("centers the empty state within the available list space", () => {
    (useGroceryList as jest.Mock).mockReturnValue(createHookValue());

    const { UNSAFE_getByType, getByText } = render(<GroceryListScreen />);
    const list = UNSAFE_getByType(FlatList);

    expect(getByText("Your list is empty")).toBeTruthy();
    expect(StyleSheet.flatten(list.props.contentContainerStyle)).toMatchObject({
      flexGrow: 1,
    });
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

  it("keeps the add row open after saving so another item can be entered", async () => {
    const saveCurrentItem = jest.fn().mockResolvedValue(true);
    const setIsAddingItem = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isAddingItem: true,
      editingText: "Milk",
      saveCurrentItem,
      setIsAddingItem,
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    const input = getByTestId("grocery-input");

    expect(input.props.returnKeyType).toBe("next");
    fireEvent(input, "submitEditing");

    await waitFor(() => {
      expect(saveCurrentItem).toHaveBeenCalledTimes(1);
    });
    expect(setIsAddingItem).not.toHaveBeenCalledWith(false);
  });

  it("closes the add row when submitting an empty item", () => {
    const saveCurrentItem = jest.fn();
    const setIsAddingItem = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isAddingItem: true,
      editingText: "   ",
      saveCurrentItem,
      setIsAddingItem,
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    fireEvent(getByTestId("grocery-input"), "submitEditing");

    expect(saveCurrentItem).not.toHaveBeenCalled();
    expect(setIsAddingItem).toHaveBeenCalledWith(false);
  });

  it("closes an empty add row when it loses focus", () => {
    const setIsAddingItem = jest.fn();

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      isAddingItem: true,
      editingText: "",
      setIsAddingItem,
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    fireEvent(getByTestId("grocery-input"), "blur");

    expect(setIsAddingItem).toHaveBeenCalledWith(false);
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

  it("asks for privacy confirmation before starting Shopping Mode", () => {
    const start = jest.fn().mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());

    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      liveActivity: {
        isSupported: true,
        areActivitiesEnabled: true,
        isActive: false,
        isLoading: false,
        isChanging: false,
        uncheckedCount: 1,
        start,
        end: jest.fn(),
        refreshStatus: jest.fn(),
      },
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    fireEvent.press(getByTestId("start-shopping-mode"));

    expect(alert).toHaveBeenCalledWith(
      "Add List to Lock Screen?",
      expect.stringContaining("visible to anyone"),
      expect.any(Array)
    );

    const actions = alert.mock.calls[0][2];
    actions?.find((action) => action.text === "Start Shopping")?.onPress?.();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("does not show redundant off text beside the Lock Screen toggle", () => {
    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      liveActivity: {
        isSupported: true,
        areActivitiesEnabled: true,
        isActive: false,
        isLoading: false,
        isChanging: false,
        uncheckedCount: 1,
        start: jest.fn(),
        end: jest.fn(),
        refreshStatus: jest.fn(),
      },
    }));

    const { getByText, queryByText } = render(<GroceryListScreen />);

    expect(getByText("Lock Screen list")).toBeTruthy();
    expect(queryByText("Off")).toBeNull();
  });

  it("uses brand navy for the active Lock Screen toggle", () => {
    (useGroceryList as jest.Mock).mockReturnValue(createHookValue({
      liveActivity: {
        isSupported: true,
        areActivitiesEnabled: true,
        isActive: true,
        isLoading: false,
        isChanging: false,
        uncheckedCount: 1,
        start: jest.fn(),
        end: jest.fn(),
        refreshStatus: jest.fn(),
      },
    }));

    const { getByTestId } = render(<GroceryListScreen />);
    const toggle = getByTestId("end-shopping-mode");

    expect(StyleSheet.flatten(toggle.props.style)).toMatchObject({
      backgroundColor: theme.colors.textPrimary,
    });
  });
});
