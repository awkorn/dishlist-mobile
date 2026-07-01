import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { GroceryItemRow } from "../components/GroceryItemRow";

describe("GroceryItemRow", () => {
  it("submits without automatically blurring and saving twice", () => {
    const onSaveEdit = jest.fn();

    const { getByTestId } = render(
      <GroceryItemRow
        item={{
          id: "item-1",
          text: "Milk",
          checked: false,
          addedAt: 123,
        }}
        isEditing
        editingText="Whole milk"
        onToggle={jest.fn()}
        onDelete={jest.fn()}
        onStartEditing={jest.fn()}
        onChangeEditingText={jest.fn()}
        onSaveEdit={onSaveEdit}
        onCancelEdit={jest.fn()}
      />
    );

    const input = getByTestId("edit-input-item-1");
    expect(input.props.submitBehavior).toBe("submit");

    fireEvent(input, "submitEditing");
    expect(onSaveEdit).toHaveBeenCalledTimes(1);
    expect(onSaveEdit).toHaveBeenCalledWith("item-1", "Whole milk");
  });
});
