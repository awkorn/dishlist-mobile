import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { RecipeDetailSkeleton } from "../components/RecipeDetailSkeleton";

describe("RecipeDetailSkeleton", () => {
  it("announces the loading state and keeps back navigation available", () => {
    const onBack = jest.fn();
    const { getByLabelText, getByRole } = render(
      <RecipeDetailSkeleton onBack={onBack} />,
    );

    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Loading recipe")).toBeTruthy();

    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
