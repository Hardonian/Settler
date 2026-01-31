/**
 * JobForge constants
 */

export const DEFAULT_MAX_ATTEMPTS = 5
export const DEFAULT_CLAIM_LIMIT = 10
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000 // 30 seconds
export const DEFAULT_POLL_INTERVAL_MS = 2_000 // 2 seconds
export const MIN_BACKOFF_MS = 1_000 // 1 second
export const MAX_BACKOFF_MS = 3_600_000 // 1 hour
export const BACKOFF_MULTIPLIER = 2 // Exponential backoff

/**
 * Calculate exponential backoff delay in milliseconds
 */
export function calculateBackoff(attempt: number): number {
  const delay = MIN_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1)
  return Math.min(delay, MAX_BACKOFF_MS)
}
