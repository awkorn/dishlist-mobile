import React from "react";
import { Animated } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import ActionSheet from "../ActionSheet";

describe("ActionSheet", () => {
  it("notifies the caller only after its closing animation finishes", () => {
    const requestAnimationFrameSpy = jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const parallelSpy = jest
      .spyOn(Animated, "parallel")
      .mockImplementation(() => ({
        start: (callback) => callback?.({ finished: true }),
        stop: jest.fn(),
        reset: jest.fn(),
      }));
    const onClose = jest.fn();
    const onDismiss = jest.fn();
    const onPress = jest.fn();
    const options = [{ title: "Share Recipe", onPress }];

    const { getByRole, rerender } = render(
      <ActionSheet
        visible
        onClose={onClose}
        onDismiss={onDismiss}
        options={options}
      />,
    );

    fireEvent.press(getByRole("button", { name: "Share Recipe" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      rerender(
        <ActionSheet
          visible={false}
          onClose={onClose}
          onDismiss={onDismiss}
          options={options}
        />,
      );
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);

    parallelSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
  });
});
