/**
 * Fallback Utility
 *
 * Provides fallback mechanisms for failed operations,
 * allowing graceful degradation.
 */

export interface FallbackConfig<T> {
  fallback: T | (() => T | Promise<T>);
  onFallback?: (error: unknown) => void;
}

/**
 * Execute function with fallback
 */
export async function withFallback<T>(fn: () => Promise<T>, config: FallbackConfig<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (config.onFallback) {
      config.onFallback(error);
    }

    if (typeof config.fallback === "function") {
      return await (config.fallback as () => T | Promise<T>)();
    }

    return config.fallback;
  }
}

/**
 * Fallback decorator for async functions
 */
export function fallback<T extends (...args: unknown[]) => Promise<unknown>>(
  config: FallbackConfig<ReturnType<T>>
): (fn: T) => T {
  return (fn: T) => {
    return (async (...args: Parameters<T>) => {
      return withFallback(() => fn(...args) as Promise<ReturnType<T>>, config);
    }) as T;
  };
}

/**
 * Execute multiple functions and return first successful result
 */
export async function raceToSuccess<T>(
  functions: Array<() => Promise<T>>,
  onError?: (error: unknown, index: number) => void
): Promise<T> {
  const errors: Array<{ error: unknown; index: number }> = [];

  for (let i = 0; i < functions.length; i++) {
    const fn = functions[i];
    if (!fn) {
      continue;
    }
    try {
      return await fn();
    } catch (error) {
      errors.push({ error, index: i });
      if (onError) {
        onError(error, i);
      }
    }
  }

  // All functions failed
  throw new Error(
    `All ${functions.length} functions failed. Last error: ${errors[errors.length - 1]?.error}`
  );
}
