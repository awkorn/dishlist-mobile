import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import RecipeTile from "../components/RecipeTile";
import { theme } from "@styles/theme";

jest.mock("expo-image", () => ({
  Image: require("react-native").Image,
}));

describe("RecipeTile", () => {
  it("renders an accessible image-led tile without metadata", () => {
    const onPress = jest.fn();
    const { getByRole, getByText, queryByText } = render(
      <RecipeTile
        recipe={{
          id: "recipe-1",
          title: "Tortilla Soup",
          prepTime: 10,
          cookTime: 15,
          servings: 4,
        }}
        onPress={onPress}
      />
    );

    expect(getByText("Tortilla Soup")).toBeTruthy();
    expect(queryByText(/min$/)).toBeNull();
    expect(queryByText("4")).toBeNull();

    const tile = getByRole("button", { name: "Recipe: Tortilla Soup" });
    fireEvent.press(tile);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps the title top-aligned when metadata is absent", () => {
    const { getByTestId, getByText, queryByText } = render(
      <RecipeTile recipe={{ id: "recipe-2", title: "Lettuce Wraps" }} />
    );

    expect(getByText("Lettuce Wraps")).toBeTruthy();
    expect(queryByText(/min$/)).toBeNull();
    expect(
      StyleSheet.flatten(getByTestId("recipe-tile-content").props.style)
    ).toMatchObject({
      justifyContent: "flex-start",
    });
    expect(
      StyleSheet.flatten(getByText("Lettuce Wraps").props.style)
    ).toMatchObject({
      height: 36,
    });
  });

  it("renders the branded placeholder art on a white tile", () => {
    const { getByTestId, queryByText } = render(
      <RecipeTile recipe={{ id: "recipe-placeholder", title: "No Photo" }} />
    );

    expect(getByTestId("recipe-placeholder-art")).toBeTruthy();
    expect(queryByText("🍽️")).toBeNull();
    expect(theme.colors.recipePlaceholderBowl).toBe("#bccfe1");
  });

  it("crops the first recipe image to a 4:3 frame without stretching it", () => {
    const { getByLabelText } = render(
      <RecipeTile
        recipe={{
          id: "recipe-3",
          title: "Roasted Tomato Pasta",
          imageUrl: "https://example.com/fallback.jpg",
          imageUrls: ["https://example.com/cover.jpg"],
        }}
      />
    );

    const image = getByLabelText("Roasted Tomato Pasta image");
    expect(image.props.source).toEqual({
      uri: "https://example.com/cover.jpg",
    });
    expect(image.props.contentFit).toBe("cover");
    expect(StyleSheet.flatten(image.props.style)).toMatchObject({
      width: "100%",
      aspectRatio: 4 / 3,
    });
  });
});
