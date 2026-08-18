import React from "react";
import { Animated, Text, View } from "react-native";
import { act, render } from "@testing-library/react-native";
import { LoadingTransition } from "../LoadingTransition";

describe("LoadingTransition", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("keeps the loader above content while loading", () => {
    const { getByTestId, getByText } = render(
      <LoadingTransition
        loading
        loadingView={
          <View>
            <Text>Loading</Text>
          </View>
        }
      >
        <Text>Content</Text>
      </LoadingTransition>,
    );

    expect(getByTestId("loading-transition-overlay")).toBeTruthy();
    expect(getByText("Loading")).toBeTruthy();
    expect(getByText("Content", { includeHiddenElements: true })).toBeTruthy();
  });

  it("mounts content before fading and removing the loader", () => {
    jest.useFakeTimers();
    jest.spyOn(Animated, "timing").mockReturnValue({
      start: (callback) => callback?.({ finished: true }),
      stop: jest.fn(),
      reset: jest.fn(),
    });

    const loadingView = (
      <View>
        <Text>Loading</Text>
      </View>
    );
    const { getByText, queryByTestId, rerender } = render(
      <LoadingTransition loading loadingView={loadingView}>
        {null}
      </LoadingTransition>,
    );

    rerender(
      <LoadingTransition loading={false} loadingView={loadingView}>
        <Text>Content</Text>
      </LoadingTransition>,
    );

    expect(getByText("Content", { includeHiddenElements: true })).toBeTruthy();
    expect(queryByTestId("loading-transition-overlay")).toBeTruthy();

    act(() => {
      jest.runAllTimers();
    });

    expect(queryByTestId("loading-transition-overlay")).toBeNull();
  });
});
