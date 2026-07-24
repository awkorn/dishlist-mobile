import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { SearchInput } from "../SearchInput";

describe("SearchInput", () => {
  it("uses the standard search bar dimensions and border without a shadow", () => {
    const { getByTestId } = render(
      <SearchInput testID="search-input" placeholder="Search" />,
    );
    const containerStyle = StyleSheet.flatten(
      getByTestId("search-input-container").props.style,
    );

    expect(containerStyle).toMatchObject({
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    });
    expect(containerStyle.shadowOpacity).toBeUndefined();
    expect(containerStyle.elevation).toBeUndefined();
  });

  it("forwards text changes and clears a populated query", () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <SearchInput
        value="pasta"
        onChangeText={onChangeText}
        placeholder="Search recipes"
        accessibilityLabel="Search recipes"
      />,
    );

    fireEvent.changeText(getByPlaceholderText("Search recipes"), "soup");
    fireEvent.press(getByLabelText("Clear search"));

    expect(onChangeText).toHaveBeenNthCalledWith(1, "soup");
    expect(onChangeText).toHaveBeenNthCalledWith(2, "");
  });

  it("supports a persistent close action for expandable search bars", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <SearchInput
        value=""
        onChangeText={jest.fn()}
        showClearButton
        onClear={onClose}
        clearAccessibilityLabel="Close search"
      />,
    );

    fireEvent.press(getByLabelText("Close search"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
