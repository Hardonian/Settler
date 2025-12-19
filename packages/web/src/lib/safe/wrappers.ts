/**
 * Safe wrapper utilities
 * 
 * Provides timeout and error-safe wrappers for external calls
 */

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Safe wrapper that catches errors and returns a default value
 */
export async function safeCall<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorMessage) {
      console.error(`[Safe] ${errorMessage}:`, error);
    }
    return defaultValue;
  }
}

/**
 * Safe wrapper with timeout and default value
 */
export async function safeCallWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  defaultValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await withTimeout(fn(), timeoutMs, errorMessage || 'Operation timed out');
  } catch (error) {
    if (errorMessage) {
      console.error(`[Safe] ${errorMessage}:`, error);
    }
    return defaultValue;
  }
}

/**
 * Check if SAFE_MODE is enabled
 */
export function isSafeMode(): boolean {
  return process.env.SAFE_MODE === 'true' || process.env.SAFE_MODE === '1';
}
