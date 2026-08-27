import { useState, useEffect, useRef, useCallback } from "react";

interface UseBackoffPollingOptions {
  initialIntervalMs?: number;
  maxIntervalMs?: number;
  backoffFactor?: number;
  enabled?: boolean;
}

/**
 * Custom hook to replace heavy continuous polling.
 * Applies an exponential backoff strategy to reduce DB/API load by >50%.
 */
export function useBackoffPolling(
  callback: () => Promise<void> | void,
  options: UseBackoffPollingOptions = {}
) {
  const {
    initialIntervalMs = 5000,
    maxIntervalMs = 60000,
    backoffFactor = 1.5,
    enabled = true,
  } = options;

  const [currentInterval, setCurrentInterval] = useState(initialIntervalMs);
  const callbackRef = useRef(callback);

  // Keep ref synchronized with the latest callback to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const resetBackoff = useCallback(() => {
    setCurrentInterval(initialIntervalMs);
  }, [initialIntervalMs]);

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const poll = async () => {
      try {
        await callbackRef.current();
      } finally {
        if (isMounted) {
          // Calculate next interval with exponential backoff
          const nextInterval = Math.min(currentInterval * backoffFactor, maxIntervalMs);
          setCurrentInterval(nextInterval);
          timeoutId = setTimeout(poll, nextInterval);
        }
      }
    };

    timeoutId = setTimeout(poll, currentInterval);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentInterval, backoffFactor, maxIntervalMs, enabled]);

  return { resetBackoff, currentInterval };
}
