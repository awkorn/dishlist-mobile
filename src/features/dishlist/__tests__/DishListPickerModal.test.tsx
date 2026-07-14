import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { useDishLists } from "../hooks";
import { DishListPickerModal } from "../components/DishListPickerModal";
import type { DishList } from "../types";

jest.mock("../hooks", () => ({
  useDishLists: jest.fn(),
}));

const dishLists: DishList[] = [
  {
    id: "owned",
    title: "Weeknight dinners",
    visibility: "PRIVATE",
    isDefault: false,
    isPinned: false,
    recipeCount: 3,
    isOwner: true,
    isCollaborator: false,
    isFollowing: false,
    owner: { uid: "user-1" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "shared",
    title: "Shared favorites",
    visibility: "PRIVATE",
    isDefault: false,
    isPinned: false,
    recipeCount: 1,
    isOwner: false,
    isCollaborator: true,
    isFollowing: false,
    owner: { uid: "user-2" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("DishListPickerModal", () => {
  it("disables already-added rows while keeping eligible rows selectable", () => {
    jest.mocked(useDishLists).mockReturnValue({
      dishLists,
      isLoading: false,
      isError: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      dataUpdatedAt: 0,
      refetch: jest.fn(),
    });
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <DishListPickerModal
        visible
        onClose={() => {}}
        onSelect={onSelect}
        title="Add to DishList"
        alreadySelectedDishListIds={["owned"]}
      />,
    );

    fireEvent.press(getByLabelText("Weeknight dinners, already added"));
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.press(
      getByLabelText("Select Shared favorites, Collaborator"),
    );
    expect(onSelect).toHaveBeenCalledWith("shared");
  });
});
