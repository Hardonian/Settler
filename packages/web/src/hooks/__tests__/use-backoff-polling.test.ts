import { renderHook, act } from "@testing-library/react";
import { useBackoffPolling } from "../use-backoff-polling";

describe("useBackoffPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("polls with exponential backoff", async () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useBackoffPolling(callback, {
        initialIntervalMs: 1000,
        maxIntervalMs: 5000,
        backoffFactor: 2,
        enabled: true,
        pauseWhenHidden: false,
      })
    );

    expect(result.current.currentInterval).toBe(1000);

    // Fast-forward initial interval
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // Fast-forward next interval (2000ms)
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("resets backoff to initial interval on demand", async () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useBackoffPolling(callback, {
        initialIntervalMs: 1000,
        maxIntervalMs: 10000,
        backoffFactor: 2,
        enabled: true,
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.resetBackoff();
    });

    expect(result.current.currentInterval).toBe(1000);
  });

  it("handles tab visibility changes and resets backoff on focus", async () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useBackoffPolling(callback, {
        initialIntervalMs: 1000,
        maxIntervalMs: 10000,
        backoffFactor: 2,
        enabled: true,
        pauseWhenHidden: true,
      })
    );

    // Simulate tab focus change to visible
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(callback).toHaveBeenCalled();
    expect(result.current.currentInterval).toBe(1000);
  });
});
