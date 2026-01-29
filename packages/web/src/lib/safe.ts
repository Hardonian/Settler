/**
 * Safe utility functions for error handling
 * 
 * Provides utilities to safely execute async operations with timeouts
 * and graceful error handling.
 */

/**
 * Execute an async function with a timeout
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    defaultValue?: T;
    onError?: (error: Error) => void;
  } = {}
): Promise<T | undefined> {
  const { timeout = 5000, defaultValue, onError } = options;

  try {
    if (timeout > 0) {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        ),
      ]);
    } else {
      return await fn();
    }
  } catch (error) {
    const error = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      onError(error);
    } else {
      console.warn('[safeAsync] Operation failed:', error.message);
    }
    return defaultValue;
  }
}

/**
 * Execute an async function and return a result object
 */
export async function safeResult<T>(
  fn: () => Promise<T>,
  options: {
    timeout?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  const { timeout = 5000, onError } = options;

  try {
    let data: T;
    if (timeout > 0) {
      data = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        ),
      ]);
    } else {
      data = await fn();
    }
    return { success: true, data };
  } catch (error) {
    const error = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      onError(error);
    }
    return { success: false, error: error };
  }
}

/**
 * Check if SAFE_MODE is enabled
 */
export function isSafeMode(): boolean {
  return process.env.SAFE_MODE === '1' || process.env.SAFE_MODE === 'true';
}

/**
 * Execute a function only if safe mode is disabled, otherwise return default
 */
export async function safeModeGuard<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  if (isSafeMode()) {
    return defaultValue;
  }
  try {
    return await fn();
  } catch (error) {
    console.warn('[safeModeGuard] Operation failed, using default:', error);
    return defaultValue;
  }
}
