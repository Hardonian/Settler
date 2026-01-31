import { describe, it, expect } from 'vitest'
import {
  AppError,
  ErrorCode,
  createBadRequestError,
  createNotFoundError,
  createValidationError,
  toAppError,
} from '../src'

describe('Error Envelope', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 'Resource not found', {
        correlationId: 'test-123',
        details: { resource: 'user' },
      })

      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.message).toBe('Resource not found')
      expect(error.correlationId).toBe('test-123')
      expect(error.details).toEqual({ resource: 'user' })
      expect(error.isOperational).toBe(true)
    })

    it('should convert to error envelope', () => {
      const error = new AppError(ErrorCode.BAD_REQUEST, 'Invalid input', {
        correlationId: 'test-456',
      })

      const envelope = error.toEnvelope()

      expect(envelope.code).toBe(ErrorCode.BAD_REQUEST)
      expect(envelope.message).toBe('Invalid input')
      expect(envelope.correlationId).toBe('test-456')
      expect(envelope.timestamp).toBeDefined()
      expect(envelope.stack).toBeUndefined()
    })

    it('should include stack trace when requested', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'Server error')
      const envelope = error.toEnvelope(true)

      expect(envelope.stack).toBeDefined()
      expect(envelope.stack).toContain('AppError')
    })

    it('should return correct HTTP status', () => {
      const notFoundError = new AppError(ErrorCode.NOT_FOUND, 'Not found')
      expect(notFoundError.httpStatus).toBe(404)

      const serverError = new AppError(ErrorCode.INTERNAL_ERROR, 'Error')
      expect(serverError.httpStatus).toBe(500)
    })
  })

  describe('Error Factories', () => {
    it('should create bad request error', () => {
      const error = createBadRequestError('Invalid data')
      expect(error.code).toBe(ErrorCode.BAD_REQUEST)
      expect(error.httpStatus).toBe(400)
    })

    it('should create not found error', () => {
      const error = createNotFoundError('User')
      expect(error.message).toBe('User not found')
      expect(error.httpStatus).toBe(404)
    })

    it('should create validation error with details', () => {
      const error = createValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be positive' },
      ])

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.httpStatus).toBe(422)
      expect(error.details).toHaveLength(2)
    })
  })

  describe('toAppError', () => {
    it('should preserve existing AppError', () => {
      const original = createNotFoundError('Resource')
      const converted = toAppError(original)

      expect(converted).toBe(original)
    })

    it('should convert Error to AppError', () => {
      const original = new Error('Something went wrong')
      const converted = toAppError(original)

      expect(converted).toBeInstanceOf(AppError)
      expect(converted.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(converted.message).toBe('Something went wrong')
    })

    it('should add correlation ID when converting', () => {
      const original = new Error('Test error')
      const converted = toAppError(original, 'corr-123')

      expect(converted.correlationId).toBe('corr-123')
    })

    it('should handle string errors', () => {
      const converted = toAppError('String error')

      expect(converted).toBeInstanceOf(AppError)
      expect(converted.message).toBe('String error')
    })
  })
})
