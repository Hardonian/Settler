import { describe, it, expect } from 'vitest'
import {
  generateCorrelationId,
  extractCorrelationId,
  runWithCorrelationId,
  getCurrentCorrelationId,
} from '../src'

describe('Correlation ID', () => {
  describe('generateCorrelationId', () => {
    it('should generate unique UUIDs', () => {
      const id1 = generateCorrelationId()
      const id2 = generateCorrelationId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)

      // UUID v4 format
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe('extractCorrelationId', () => {
    it('should extract from x-correlation-id header', () => {
      const headers = { 'x-correlation-id': 'test-123' }
      const id = extractCorrelationId(headers)

      expect(id).toBe('test-123')
    })

    it('should extract from x-request-id header', () => {
      const headers = { 'x-request-id': 'req-456' }
      const id = extractCorrelationId(headers)

      expect(id).toBe('req-456')
    })

    it('should handle array values', () => {
      const headers = { 'x-correlation-id': ['id1', 'id2'] }
      const id = extractCorrelationId(headers)

      expect(id).toBe('id1')
    })

    it('should return undefined when no header present', () => {
      const headers = {}
      const id = extractCorrelationId(headers)

      expect(id).toBeUndefined()
    })

    it('should prioritize x-correlation-id over x-request-id', () => {
      const headers = {
        'x-correlation-id': 'corr-123',
        'x-request-id': 'req-456',
      }
      const id = extractCorrelationId(headers)

      expect(id).toBe('corr-123')
    })
  })

  describe('Async Context', () => {
    it('should store and retrieve correlation ID in context', () => {
      const correlationId = 'ctx-123'

      runWithCorrelationId(correlationId, () => {
        const retrieved = getCurrentCorrelationId()
        expect(retrieved).toBe(correlationId)
      })
    })

    it('should return undefined outside of context', () => {
      const id = getCurrentCorrelationId()
      expect(id).toBeUndefined()
    })

    it('should handle nested contexts', () => {
      runWithCorrelationId('outer-123', () => {
        expect(getCurrentCorrelationId()).toBe('outer-123')

        runWithCorrelationId('inner-456', () => {
          expect(getCurrentCorrelationId()).toBe('inner-456')
        })

        expect(getCurrentCorrelationId()).toBe('outer-123')
      })
    })
  })
})
