import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("renders its label, required marker, placeholder, and helper text", () => {
    const { getByPlaceholderText, getByText } = render(
      <TextField
        label="Name"
        required
        placeholder="Enter a name"
        helperText="Use the name people know you by"
      />,
    );

    expect(getByText(/Name/)).toHaveTextContent("Name *");
    expect(getByPlaceholderText("Enter a name").props.placeholderTextColor).toBe(
      theme.colors.neutral[400],
    );
    expect(getByText("Use the name people know you by")).toBeTruthy();
  });

  it("uses the shared skin and displays error text", () => {
    const { getByTestId, getByText } = render(
      <TextField
        testID="title-input"
        placeholder="Title"
        error="Title is required"
      />,
    );
    const skinStyle = StyleSheet.flatten(
      getByTestId("title-input-container").props.style,
    );

    expect(skinStyle).toMatchObject({
      borderRadius: theme.borderRadius.md,
      borderColor: theme.colors.error,
    });
    expect(getByText("Title is required")).toBeTruthy();
  });

  it("shows a character counter and forwards input events", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <TextField
        placeholder="Bio"
        value="hello"
        onChangeText={onChangeText}
        maxLength={20}
        showCharacterCount
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Bio"), "hello!");

    expect(onChangeText).toHaveBeenCalledWith("hello!");
    expect(getByText("5/20")).toBeTruthy();
  });
});
