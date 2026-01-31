import { describe, it, expect } from 'vitest'
import {
  calculateRetryDelay,
  isRetryableStatus,
  isRetryableError,
  DEFAULT_RETRY_CONFIG,
} from '../src'

describe('Retry Logic', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = calculateRetryDelay(1, DEFAULT_RETRY_CONFIG)
      const delay2 = calculateRetryDelay(2, DEFAULT_RETRY_CONFIG)
      const delay3 = calculateRetryDelay(3, DEFAULT_RETRY_CONFIG)

      // First retry should be around initial delay (1000ms ± jitter)
      expect(delay1).toBeGreaterThan(700)
      expect(delay1).toBeLessThan(1300)

      // Second retry should be around 2x (2000ms ± jitter)
      expect(delay2).toBeGreaterThan(1500)
      expect(delay2).toBeLessThan(2500)

      // Third retry should be around 4x (4000ms ± jitter)
      expect(delay3).toBeGreaterThan(3000)
      expect(delay3).toBeLessThan(5000)
    })

    it('should respect max delay', () => {
      const config = {
        ...DEFAULT_RETRY_CONFIG,
        maxDelay: 5000,
      }

      const delay = calculateRetryDelay(10, config)
      expect(delay).toBeLessThanOrEqual(5000 * 1.25) // Max + jitter
    })
  })

  describe('isRetryableStatus', () => {
    it('should identify retryable status codes', () => {
      expect(isRetryableStatus(408, [408, 429, 500, 502, 503, 504])).toBe(true)
      expect(isRetryableStatus(429, [408, 429, 500, 502, 503, 504])).toBe(true)
      expect(isRetryableStatus(500, [408, 429, 500, 502, 503, 504])).toBe(true)
      expect(isRetryableStatus(503, [408, 429, 500, 502, 503, 504])).toBe(true)
    })

    it('should reject non-retryable status codes', () => {
      expect(isRetryableStatus(400, [408, 429, 500, 502, 503, 504])).toBe(false)
      expect(isRetryableStatus(404, [408, 429, 500, 502, 503, 504])).toBe(false)
      expect(isRetryableStatus(200, [408, 429, 500, 502, 503, 504])).toBe(false)
    })
  })

  describe('isRetryableError', () => {
    it('should identify network errors', () => {
      const error = new TypeError('Failed to fetch')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should identify timeout errors', () => {
      const timeoutError = new Error('Timeout')
      timeoutError.name = 'TimeoutError'
      expect(isRetryableError(timeoutError)).toBe(true)

      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      expect(isRetryableError(abortError)).toBe(true)
    })

    it('should identify connection errors', () => {
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true)
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true)
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true)
    })

    it('should reject non-retryable errors', () => {
      expect(isRetryableError(new Error('Generic error'))).toBe(false)
      expect(isRetryableError(new Error('Invalid input'))).toBe(false)
    })
  })
})
