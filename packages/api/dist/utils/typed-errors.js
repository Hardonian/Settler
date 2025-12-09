"use strict";
/**
 * Typed Error Classes for API
 * Provides strongly-typed error handling with status codes and error codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.InternalServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.ApiError = void 0;
exports.isApiError = isApiError;
exports.toApiError = toApiError;
class ApiError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
    toJSON() {
        const result = {
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
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    field;
    constructor(message, field, details) {
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
exports.ValidationError = ValidationError;
class AuthenticationError extends ApiError {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_ERROR';
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends ApiError {
    statusCode = 403;
    errorCode = 'AUTHORIZATION_ERROR';
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends ApiError {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    resourceType;
    resourceId;
    constructor(message, resourceType, resourceId, details) {
        super(message, details);
        if (resourceType !== undefined) {
            this.resourceType = resourceType;
        }
        if (resourceId !== undefined) {
            this.resourceId = resourceId;
        }
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApiError {
    statusCode = 409;
    errorCode = 'CONFLICT';
}
exports.ConflictError = ConflictError;
class RateLimitError extends ApiError {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    retryAfter;
    limit;
    remaining;
    constructor(message, retryAfter, limit, remaining, details) {
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
exports.RateLimitError = RateLimitError;
class InternalServerError extends ApiError {
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends ApiError {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    retryAfter;
    constructor(message, retryAfter, details) {
        super(message, details);
        if (retryAfter !== undefined) {
            this.retryAfter = retryAfter;
        }
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Type guard to check if error is an ApiError
 */
function isApiError(error) {
    return error instanceof ApiError;
}
/**
 * Convert unknown error to ApiError
 */
function toApiError(error) {
    if (isApiError(error)) {
        return error;
    }
    if (error instanceof Error) {
        return new InternalServerError(error.message, { originalError: error.name });
    }
    return new InternalServerError('An unexpected error occurred', { error });
}
//# sourceMappingURL=typed-errors.js.map