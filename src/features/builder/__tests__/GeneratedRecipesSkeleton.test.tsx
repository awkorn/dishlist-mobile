import React from "react";
import { render } from "@testing-library/react-native";
import { GeneratedRecipesSkeleton } from "../components/GeneratedRecipesSkeleton";

describe("GeneratedRecipesSkeleton", () => {
  it("renders and announces four recipe placeholders", () => {
    const { getAllByTestId, getByLabelText, getByRole } = render(
      <GeneratedRecipesSkeleton />
    );

    expect(
      getAllByTestId("recipe-skeleton-card", { includeHiddenElements: true })
    ).toHaveLength(4);
    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Generating four recipes")).toBeTruthy();
  });
});
