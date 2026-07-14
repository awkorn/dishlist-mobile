import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders a title and message", () => {
    const { getByText } = render(
      <EmptyState title="Nothing here" message="Add your first item." />
    );

    expect(getByText("Nothing here")).toBeTruthy();
    expect(getByText("Add your first item.")).toBeTruthy();
  });

  it("renders an optional action", () => {
    const { getByText } = render(
      <EmptyState
        title="Nothing here"
        message="Add your first item."
        action={<Text>Create item</Text>}
      />
    );

    expect(getByText("Create item")).toBeTruthy();
  });

  it("supports a message-only state", () => {
    const { getByText } = render(<EmptyState message="No public DishLists" />);

    expect(getByText("No public DishLists")).toBeTruthy();
  });
});
