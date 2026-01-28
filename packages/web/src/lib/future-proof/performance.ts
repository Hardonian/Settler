/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for performance monitoring and optimization.
 */

/**
 * Measure execution time of async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label}: ${durationMs.toFixed(2)}ms`);
  }

  return { result, durationMs };
}

/**
 * Batch operations with concurrency limit
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];

  async function processBatch(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const result = await processor(item);
        results.push(result);
      } catch (error) {
        console.error('[Batch] Error processing item:', error);
        // Continue processing other items
      }
    }
  }

  // Process in parallel with concurrency limit
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    processBatch()
  );
  await Promise.all(workers);

  return results;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delayMs) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = null;
      }, delayMs - (now - lastCall));
    }
  };
}
