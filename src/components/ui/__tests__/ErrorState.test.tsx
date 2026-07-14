import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ErrorState } from "../ErrorState";

describe("ErrorState", () => {
  it("renders its copy and retries with the default label", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorState
        title="Unable to load"
        message="Check your connection."
        onRetry={onRetry}
      />
    );

    expect(getByText("Unable to load")).toBeTruthy();
    expect(getByText("Check your connection.")).toBeTruthy();
    fireEvent.press(getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports a custom retry label", () => {
    const { getByText } = render(
      <ErrorState
        title="Unable to load"
        message="Check your connection."
        onRetry={() => {}}
        retryLabel="Retry"
      />
    );

    expect(getByText("Retry")).toBeTruthy();
  });
});
