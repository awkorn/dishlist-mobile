import React from "react";
import { StyleSheet, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { typography } from "@styles/typography";
import Modal from "../Modal";

describe("Modal", () => {
  it("renders matching header slots, a right action, and a drag handle", () => {
    const { getByTestId, getByText } = render(
      <Modal
        visible
        onClose={() => {}}
        title="Edit Profile"
        rightAction={<Text>Save</Text>}
        showDragHandle
      >
        <Text>Content</Text>
      </Modal>,
    );

    expect(getByText("Edit Profile")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByTestId("modal-drag-handle")).toBeTruthy();
    expect(
      StyleSheet.flatten(getByTestId("modal-header-left-slot").props.style),
    ).toMatchObject({ flex: 1, minWidth: 44 });
    expect(
      StyleSheet.flatten(getByTestId("modal-header-right-slot").props.style),
    ).toMatchObject({ flex: 1, minWidth: 44 });
  });

  it("uses the standard close action", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <Modal visible onClose={onClose} title="Import Recipe">
        <Text>Content</Text>
      </Modal>,
    );

    fireEvent.press(getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports a contextual title style without changing other modals", () => {
    const { getByText } = render(
      <Modal
        visible
        onClose={() => {}}
        title="Roasted Tomato Pasta"
        titleStyle={typography.recipeSheetTitle}
      >
        <Text>Content</Text>
      </Modal>,
    );

    expect(
      StyleSheet.flatten(getByText("Roasted Tomato Pasta").props.style),
    ).toMatchObject({ fontFamily: typography.families.editorialMedium });
  });

  it("can hide or disable the close action", () => {
    const onClose = jest.fn();
    const { getByLabelText, queryByLabelText, rerender } = render(
      <Modal
        visible
        onClose={onClose}
        title="Import Recipe"
        closeButtonDisabled
      >
        <Text>Content</Text>
      </Modal>,
    );

    fireEvent.press(getByLabelText("Close modal"));
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Modal
        visible
        onClose={onClose}
        title="Import Recipe"
        showCloseButton={false}
      >
        <Text>Content</Text>
      </Modal>,
    );
    expect(queryByLabelText("Close modal")).toBeNull();
  });
});
