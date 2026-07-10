import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { DishListDetailSkeleton } from "../components/DishListDetailSkeleton";

describe("DishListDetailSkeleton", () => {
  it("announces the loading state and keeps back navigation available", () => {
    const onBack = jest.fn();
    const { getByLabelText, getByRole } = render(
      <DishListDetailSkeleton onBack={onBack} />,
    );

    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Loading DishList")).toBeTruthy();

    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
