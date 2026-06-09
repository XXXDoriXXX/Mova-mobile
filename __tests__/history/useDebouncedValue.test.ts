import { act, renderHook } from "@testing-library/react-native";

import { useDebouncedValue } from "@/features/history/application/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns the initial value synchronously", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 200));
    expect(result.current).toBe("hello");
  });

  it("delays updates by the configured window", () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 200),
      { initialProps: { v: "a" } },
    );

    rerender({ v: "b" });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(199);
    });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("b");
  });

  it("resets the timer on rapid input — last value wins", () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 200),
      { initialProps: { v: "" } },
    );

    rerender({ v: "ai" });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    rerender({ v: "ai-r" });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe("");

    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(result.current).toBe("ai-r");
  });
});
