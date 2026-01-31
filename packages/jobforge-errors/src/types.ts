/**
 * Standard error codes for the application.
 * Using string literals for better API debugging.
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.TIMEOUT_ERROR]: 504,
}

/**
 * Validation error detail for field-level errors
 */
export interface ValidationErrorDetail {
  field: string
  message: string
  code?: string
}

/**
 * Standardized error envelope for all API responses.
 * Ensures consistent error handling across the application.
 */
export interface ErrorEnvelope {
  /** Machine-readable error code */
  code: ErrorCode
  /** Human-readable error message */
  message: string
  /** Unique request identifier for tracing */
  correlationId?: string
  /** Additional context or validation errors */
  details?: ValidationErrorDetail[] | Record<string, unknown>
  /** Stack trace (only in development) */
  stack?: string
  /** ISO timestamp of when the error occurred */
  timestamp: string
}

/**
 * Application error class with correlation ID support
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly correlationId?: string
  public readonly details?: ValidationErrorDetail[] | Record<string, unknown>
  public readonly isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      correlationId?: string
      details?: ValidationErrorDetail[] | Record<string, unknown>
      cause?: Error
      isOperational?: boolean
    }
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.correlationId = options?.correlationId
    this.details = options?.details
    this.isOperational = options?.isOperational ?? true

    if (options?.cause) {
      this.cause = options.cause
    }

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert error to standard envelope format
   */
  toEnvelope(includeStack = false): ErrorEnvelope {
    return {
      code: this.code,
      message: this.message,
      correlationId: this.correlationId,
      details: this.details,
      stack: includeStack ? this.stack : undefined,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get HTTP status code for this error
   */
  get httpStatus(): number {
    return ERROR_CODE_TO_HTTP_STATUS[this.code]
  }
}
