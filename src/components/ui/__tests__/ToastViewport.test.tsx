import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ToastViewport } from "../ToastViewport";
import { toast } from "../toast";

describe("ToastViewport", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders a compact accessible success message", () => {
    const { getByRole, getByText } = render(<ToastViewport />);

    act(() => {
      toast.success("DishList pinned");
    });

    expect(getByText("DishList pinned")).toBeTruthy();
    expect(getByRole("alert")).toBeTruthy();
  });

  it("runs an optional action", () => {
    const onView = jest.fn();
    const { getByLabelText } = render(<ToastViewport />);

    act(() => {
      toast.success("Recipe saved to My Recipes", {
        action: { label: "View", onPress: onView },
      });
    });

    fireEvent.press(getByLabelText("View"));
    expect(onView).toHaveBeenCalledTimes(1);
  });
});
