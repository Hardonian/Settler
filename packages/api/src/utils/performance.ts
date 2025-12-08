/**
 * Performance Utilities
 * Provides performance monitoring and optimization helpers
 */

import { logWarn } from './logger';

/**
 * Measure execution time of async function
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label && duration > 100) {
    logWarn(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
      label,
      duration,
      threshold: 100,
    });
  }

  return { result, duration };
}

/**
 * Measure execution time of sync function
 */
export function measureSync<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label && duration > 100) {
    logWarn(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
      label,
      duration,
      threshold: 100,
    });
  }

  return { result, duration };
}

/**
 * Batch operations for better performance
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Debounce function calls
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function calls
 */
export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let lastCall = 0;

  return (...args: TArgs) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}
