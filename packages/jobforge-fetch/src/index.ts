/**
 * @jobforge/fetch
 * Resilient HTTP client with timeout and retry support.
 */

export { resilientFetch, hasMetadata } from './resilient-fetch'
export type { RetryConfig, TimeoutConfig, ResilientFetchOptions, FetchMetadata } from './types'
export {
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  isRetryableStatus,
  isRetryableError,
} from './retry'
