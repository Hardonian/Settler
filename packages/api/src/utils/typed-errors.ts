/**
 * Typed Error Classes for API
 * Provides strongly-typed error handling with status codes and error codes
 */

export abstract class ApiError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): {
    error: string;
    errorCode: string;
    message: string;
    details?: unknown;
  } {
    const result: {
      error: string;
      errorCode: string;
      message: string;
      details?: unknown;
    } = {
      error: this.name,
      errorCode: this.errorCode,
      message: this.message,
    };
    if (this.details !== undefined) {
      result.details = this.details;
    }
    return result;
  }
}

export class ValidationError extends ApiError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly field?: string;
  declare readonly details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(
    message: string,
    field?: string,
    details?: unknown
  ) {
    super(message, details);
    if (field !== undefined) {
      this.field = field;
    }
    // If details is an array of field errors, use it
    if (Array.isArray(details)) {
      this.details = details;
    }
  }
}

export class AuthenticationError extends ApiError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTHENTICATION_ERROR';
}

export class AuthorizationError extends ApiError {
  readonly statusCode = 403;
  readonly errorCode = 'AUTHORIZATION_ERROR';
}

export class NotFoundError extends ApiError {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';
  readonly resourceType?: string;
  readonly resourceId?: string;

  constructor(message: string, resourceType?: string, resourceId?: string, details?: unknown) {
    super(message, details);
    if (resourceType !== undefined) {
      this.resourceType = resourceType;
    }
    if (resourceId !== undefined) {
      this.resourceId = resourceId;
    }
  }
}

export class ConflictError extends ApiError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICT';
}

export class RateLimitError extends ApiError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';
  readonly retryAfter?: number;
  readonly limit?: number;
  readonly remaining?: number;

  constructor(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    details?: unknown
  ) {
    super(message, details);
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    if (limit !== undefined) {
      this.limit = limit;
    }
    if (remaining !== undefined) {
      this.remaining = remaining;
    }
  }
}

export class InternalServerError extends ApiError {
  readonly statusCode = 500;
  readonly errorCode = 'INTERNAL_SERVER_ERROR';
}

export class ServiceUnavailableError extends ApiError {
  readonly statusCode = 503;
  readonly errorCode = 'SERVICE_UNAVAILABLE';
  readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: unknown) {
    super(message, details);
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert unknown error to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.name });
  }

  return new InternalServerError('An unexpected error occurred', { error });
}
