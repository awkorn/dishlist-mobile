import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { DishListDetailSkeleton } from "../components/DishListDetailSkeleton";

describe("DishListDetailSkeleton", () => {
  it("announces the loading state and keeps back navigation available", () => {
    const onBack = jest.fn();
    const { getAllByTestId, getByLabelText, getByRole } = render(
      <DishListDetailSkeleton onBack={onBack} />,
    );

    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Loading DishList")).toBeTruthy();

    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);

    const skeletonTiles = getAllByTestId("recipe-skeleton-tile", {
      includeHiddenElements: true,
    });
    const skeletonImages = getAllByTestId("recipe-skeleton-image", {
      includeHiddenElements: true,
    });

    expect(skeletonTiles).toHaveLength(6);
    expect(
      StyleSheet.flatten(skeletonImages[0].props.style)
    ).toMatchObject({
      width: "100%",
      aspectRatio: 4 / 3,
    });
  });
});
