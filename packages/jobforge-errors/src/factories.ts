import { AppError, ErrorCode, ValidationErrorDetail } from './types'

/**
 * Factory functions for creating standardized errors.
 * These ensure consistent error creation across the application.
 */

export function createBadRequestError(
  message: string,
  options?: { correlationId?: string; details?: Record<string, unknown> }
): AppError {
  return new AppError(ErrorCode.BAD_REQUEST, message, options)
}

export function createUnauthorizedError(
  message = 'Authentication required',
  options?: { correlationId?: string }
): AppError {
  return new AppError(ErrorCode.UNAUTHORIZED, message, options)
}

export function createForbiddenError(
  message = 'Insufficient permissions',
  options?: { correlationId?: string }
): AppError {
  return new AppError(ErrorCode.FORBIDDEN, message, options)
}

export function createNotFoundError(
  resource: string,
  options?: { correlationId?: string }
): AppError {
  return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, options)
}

export function createConflictError(
  message: string,
  options?: { correlationId?: string; details?: Record<string, unknown> }
): AppError {
  return new AppError(ErrorCode.CONFLICT, message, options)
}

export function createValidationError(
  message: string,
  validationDetails: ValidationErrorDetail[],
  options?: { correlationId?: string }
): AppError {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, {
    ...options,
    details: validationDetails,
  })
}

export function createRateLimitError(
  message = 'Rate limit exceeded',
  options?: { correlationId?: string; details?: Record<string, unknown> }
): AppError {
  return new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, options)
}

export function createInternalError(
  message = 'An internal error occurred',
  options?: { correlationId?: string; cause?: Error }
): AppError {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, {
    ...options,
    isOperational: false,
  })
}

export function createDatabaseError(
  message = 'Database operation failed',
  options?: { correlationId?: string; cause?: Error }
): AppError {
  return new AppError(ErrorCode.DATABASE_ERROR, message, {
    ...options,
    isOperational: false,
  })
}

export function createExternalServiceError(
  service: string,
  options?: { correlationId?: string; cause?: Error }
): AppError {
  return new AppError(
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    `External service error: ${service}`,
    options
  )
}

export function createTimeoutError(
  operation: string,
  options?: { correlationId?: string }
): AppError {
  return new AppError(ErrorCode.TIMEOUT_ERROR, `Operation timed out: ${operation}`, options)
}

/**
 * Convert unknown error to AppError with correlation ID
 */
export function toAppError(error: unknown, correlationId?: string): AppError {
  if (error instanceof AppError) {
    // Preserve existing AppError but add correlation ID if missing
    if (!error.correlationId && correlationId) {
      return new AppError(error.code, error.message, {
        correlationId,
        details: error.details,
        cause: error.cause as Error | undefined,
        isOperational: error.isOperational,
      })
    }
    return error
  }

  if (error instanceof Error) {
    return createInternalError(error.message, {
      correlationId,
      cause: error,
    })
  }

  return createInternalError(String(error), { correlationId })
}
