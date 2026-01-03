/**
 * Tick Scheduler Hook
 * 
 * Limits chart/visualization updates to prevent UI thrashing.
 * Implements 4fps max update rate for smooth but performant rendering.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_FPS = 4;
const TICK_INTERVAL_MS = 1000 / MAX_FPS;

/**
 * Hook for throttled tick updates
 * 
 * @param callback Function to call on each tick
 * @param enabled Whether the scheduler is enabled
 * @returns Current tick count
 */
export function useTickScheduler(
  callback: (tick: number) => void,
  enabled: boolean = true
): number {
  const [tick, setTick] = useState(0);
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTick(prev => {
        const next = prev + 1;
        callbackRef.current(next);
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return tick;
}

/**
 * Hook for throttled value updates (for counters that need to be responsive)
 * 
 * @param value Current value
 * @param enabled Whether throttling is enabled
 * @returns Throttled value
 */
export function useThrottledValue<T>(value: T, enabled: boolean = true): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setThrottled(value);
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= TICK_INTERVAL_MS) {
      setThrottled(value);
      lastUpdateRef.current = now;
    } else {
      const timeout = setTimeout(() => {
        setThrottled(value);
        lastUpdateRef.current = Date.now();
      }, TICK_INTERVAL_MS - timeSinceLastUpdate);

      return () => clearTimeout(timeout);
    }
  }, [value, enabled]);

  return throttled;
}
