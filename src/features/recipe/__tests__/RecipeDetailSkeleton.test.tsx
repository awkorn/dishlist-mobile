import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { RecipeDetailSkeleton } from "../components/RecipeDetailSkeleton";

describe("RecipeDetailSkeleton", () => {
  it("announces the loading state and keeps back navigation available", () => {
    const onBack = jest.fn();
    const { getByLabelText, getByRole, getByTestId } = render(
      <RecipeDetailSkeleton onBack={onBack} />,
    );

    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Loading recipe")).toBeTruthy();
    const hiddenElements = { includeHiddenElements: true };
    expect(getByTestId("recipe-heading-skeleton", hiddenElements)).toBeTruthy();
    expect(getByTestId("recipe-metadata-skeleton", hiddenElements)).toBeTruthy();
    expect(
      getByTestId("cook-mode-button-skeleton", hiddenElements),
    ).toBeTruthy();
    expect(getByTestId("ingredients-skeleton", hiddenElements)).toBeTruthy();
    expect(getByTestId("instructions-skeleton", hiddenElements)).toBeTruthy();

    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
