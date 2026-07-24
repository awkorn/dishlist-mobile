import React from "react";
import { StyleSheet, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { typography } from "@styles/typography";
import { ScreenHeader, ScreenHeaderAction } from "../ScreenHeader";

describe("ScreenHeader", () => {
  it("renders a title-only header with matching side spacers", () => {
    const { getByText, getByTestId } = render(
      <ScreenHeader title="Grocery List" />,
    );

    expect(getByText("Grocery List")).toBeTruthy();
    expect(StyleSheet.flatten(getByText("Grocery List").props.style)).toMatchObject(
      typography.navigationTitle,
    );
    expect(
      StyleSheet.flatten(getByText("Grocery List").props.style),
    ).toMatchObject({
      fontFamily: typography.families.uiMedium,
      textAlign: "center",
    });
    expect(
      StyleSheet.flatten(getByTestId("screen-header-left-slot").props.style),
    ).toMatchObject({ flex: 1, minWidth: 44 });
    expect(
      StyleSheet.flatten(getByTestId("screen-header-right-slot").props.style),
    ).toMatchObject({ flex: 1, minWidth: 44 });
  });

  it("supports a left-aligned title layout", () => {
    const { getByText, getByTestId } = render(
      <ScreenHeader title="Notifications" titleAlign="left" />,
    );

    expect(
      StyleSheet.flatten(getByText("Notifications").props.style),
    ).toMatchObject({ flex: 1, textAlign: "left" });
    expect(
      StyleSheet.flatten(getByTestId("screen-header-left-slot").props.style),
    ).toMatchObject({ flex: 0, minWidth: 0 });
    expect(
      StyleSheet.flatten(getByTestId("screen-header-right-slot").props.style),
    ).toMatchObject({ flex: 0 });
  });

  it("renders optional left and right slots", () => {
    const { getByText } = render(
      <ScreenHeader
        title="Settings"
        leftSlot={<Text>Back</Text>}
        rightSlot={<Text>Save</Text>}
      />,
    );

    expect(getByText("Back")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
  });

  it("provides a 44pt action target", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <ScreenHeaderAction
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text>Back</Text>
      </ScreenHeaderAction>,
    );
    const action = getByRole("button");

    expect(StyleSheet.flatten(action.props.style)).toMatchObject({
      minWidth: 44,
      minHeight: 44,
    });
    fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
