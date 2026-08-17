import React from "react";
import { act, render } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import {
  DishListPickerModal,
  useRemoveRecipeFromDishList,
} from "@features/dishlist";
import { toast } from "@components/ui/toast";
import AddToDishListModal from "../components/AddToDishListModal";
import { useAddRecipeToDishList } from "../hooks";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@features/dishlist", () => ({
  DishListPickerModal: jest.fn(() => null),
  useRemoveRecipeFromDishList: jest.fn(),
}));

jest.mock("../hooks", () => ({
  useAddRecipeToDishList: jest.fn(),
}));

jest.mock("@components/ui/toast", () => ({
  toast: { success: jest.fn() },
}));

describe("AddToDishListModal", () => {
  const addMutation = {
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    isError: false,
    error: null,
  };
  const removeMutation = {
    mutateAsync: jest.fn(),
    reset: jest.fn(),
    isError: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useQuery).mockReturnValue({
      data: ["my-recipes"],
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useQuery>);
    jest.mocked(useAddRecipeToDishList).mockReturnValue(
      addMutation as unknown as ReturnType<typeof useAddRecipeToDishList>,
    );
    jest.mocked(useRemoveRecipeFromDishList).mockReturnValue(
      removeMutation as unknown as ReturnType<
        typeof useRemoveRecipeFromDishList
      >,
    );
  });

  function latestPickerProps() {
    const calls = jest.mocked(DishListPickerModal).mock.calls;
    return calls[calls.length - 1][0];
  }

  it("moves a recipe from its current DishList to a newly selected DishList", async () => {
    const onClose = jest.fn();
    render(
      <AddToDishListModal
        visible
        onClose={onClose}
        recipeId="recipe-1"
        recipeTitle="Noodles"
        createsCopy={false}
      />,
    );

    expect(latestPickerProps().selectedDishListIds).toEqual(["my-recipes"]);

    act(() => latestPickerProps().onSelect("my-recipes"));
    expect(latestPickerProps().selectedDishListIds).toEqual([]);

    act(() => latestPickerProps().onSelect("weeknight"));
    expect(latestPickerProps().selectedDishListIds).toEqual(["weeknight"]);

    await act(async () => latestPickerProps().onDone?.());

    expect(addMutation.mutateAsync).toHaveBeenCalledWith({
      dishListId: "weeknight",
      recipeId: "recipe-1",
    });
    expect(removeMutation.mutateAsync).toHaveBeenCalledWith({
      dishListId: "my-recipes",
      recipeId: "recipe-1",
    });
    expect(addMutation.mutateAsync.mock.invocationCallOrder[0]).toBeLessThan(
      removeMutation.mutateAsync.mock.invocationCallOrder[0],
    );
    expect(toast.success).toHaveBeenCalledWith("Recipe DishLists updated");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
