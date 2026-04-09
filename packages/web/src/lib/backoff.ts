/**
 * Exponential backoff with jitter
 * Used for job retries
 */

export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
  jitter: boolean;
}

const DEFAULT_CONFIG: BackoffConfig = {
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 300000, // 5 minutes
  maxAttempts: 8,
  jitter: true,
};

/**
 * Calculate delay for attempt number
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Partial<BackoffConfig> = {}
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Exponential: baseDelay * 2^(attempt - 1)
  const exponentialDelay = cfg.baseDelayMs * Math.pow(2, attempt - 1);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, cfg.maxDelayMs);

  // Add jitter (random 0-25% of delay)
  if (cfg.jitter) {
    const jitterAmount = cappedDelay * 0.25 * Math.random();
    return Math.floor(cappedDelay + jitterAmount);
  }

  return Math.floor(cappedDelay);
}

/**
 * Get next available_at timestamp for a job
 */
export function getNextAvailableAt(attempt: number, config: Partial<BackoffConfig> = {}): Date {
  const delayMs = calculateBackoffDelay(attempt, config);
  return new Date(Date.now() + delayMs);
}

/**
 * Check if job should be retried
 */
export function shouldRetry(
  attempt: number,
  maxAttempts: number = DEFAULT_CONFIG.maxAttempts
): boolean {
  return attempt < maxAttempts;
}
