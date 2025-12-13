/**
 * Timeout Utility
 * 
 * Provides timeout functionality for async operations
 * to prevent hanging requests.
 */

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(
          timeoutMessage || `Operation timed out after ${timeoutMs}ms`,
          timeoutMs
        ));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Create a timeout promise
 */
export function createTimeout(timeoutMs: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(
        message || `Timeout after ${timeoutMs}ms`,
        timeoutMs
      ));
    }, timeoutMs);
  });
}

/**
 * Timeout decorator for async functions
 */
export function timeout<T extends (...args: unknown[]) => Promise<unknown>>(
  timeoutMs: number,
  timeoutMessage?: string
): (fn: T) => T {
  return (fn: T) => {
    return (async (...args: Parameters<T>) => {
      return withTimeout(
        () => fn(...args) as Promise<ReturnType<T>>,
        timeoutMs,
        timeoutMessage
      );
    }) as T;
  };
}
