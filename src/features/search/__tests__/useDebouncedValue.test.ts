import { renderHook, act } from "@testing-library/react-native";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 300));
    expect(result.current).toBe("a");
  });

  it("does not update until the delay elapses", () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("ab");
  });

  it("only emits the latest value when changes come faster than the delay", () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "ab" });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: "abc" });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    // 400ms total elapsed, but the timer reset at 200ms, so still "a"
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(100);
    });
    // now 300ms since the last change -> latest value emitted
    expect(result.current).toBe("abc");
  });
});
