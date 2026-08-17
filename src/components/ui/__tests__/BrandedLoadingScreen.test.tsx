import React from "react";
import { render } from "@testing-library/react-native";
import { BrandedLoadingScreen } from "../BrandedLoadingScreen";

describe("BrandedLoadingScreen", () => {
  it("shows the DishList brand and announces that the app is opening", () => {
    const { getByLabelText, getByRole, getByText } = render(
      <BrandedLoadingScreen />
    );

    expect(getByText("DishList", { includeHiddenElements: true })).toBeTruthy();
    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Opening DishList")).toHaveAccessibilityState({
      busy: true,
    });
  });
});
