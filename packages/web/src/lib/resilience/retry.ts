/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides configurable retry logic with exponential backoff,
 * jitter, and circuit breaker integration.
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // Initial delay in ms
  maxDelay: number; // Maximum delay in ms
  backoffMultiplier: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to prevent thundering herd
  retryableErrors?: (error: unknown) => boolean; // Function to determine if error is retryable
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: (error: unknown) => {
    // Default: retry on network errors and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) {
        return true;
      }
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      return status >= 500 && status < 600;
    }
    return false;
  },
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: unknown
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, config.maxDelay);
  
  if (config.jitter) {
    // Add ±20% jitter
    const jitterAmount = delay * 0.2;
    const jitter = (Math.random() * 2 - 1) * jitterAmount;
    return Math.max(0, delay + jitter);
  }
  
  return delay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (finalConfig.retryableErrors && !finalConfig.retryableErrors(error)) {
        throw error; // Don't retry non-retryable errors
      }
      
      // If this is the last attempt, throw error
      if (attempt === finalConfig.maxAttempts) {
        throw new RetryError(
          `Failed after ${attempt} attempts`,
          attempt,
          lastError
        );
      }
      
      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw new RetryError(
    `Failed after ${finalConfig.maxAttempts} attempts`,
    finalConfig.maxAttempts,
    lastError
  );
}

/**
 * Retry decorator for async functions
 */
export function retryable<T extends (...args: unknown[]) => Promise<unknown>>(
  config: Partial<RetryConfig> = {}
): (fn: T) => T {
  return (fn: T) => {
    return (async (...args: Parameters<T>) => {
      return withRetry(() => fn(...args) as Promise<ReturnType<T>>, config);
    }) as T;
  };
}
