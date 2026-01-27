"use strict";
/**
 * Error Normalization Utility
 *
 * Normalizes errors into a consistent shape for API responses and logging.
 *
 * Guarantees:
 * - Consistent error structure across all API endpoints
 * - Safe error messages (no stack traces to clients)
 * - Request ID correlation for debugging
 * - Proper HTTP status codes
 * - Full stack traces in server logs only
 *
 * Critical for:
 * - Production error handling (no hard-500s without context)
 * - Client error reporting
 * - Security (no information leakage)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.HttpError = void 0;
exports.normalizeError = normalizeError;
exports.sendErrorResponse = sendErrorResponse;
exports.errorHandlerMiddleware = errorHandlerMiddleware;
exports.asyncHandler = asyncHandler;
exports.validationError = validationError;
const logger_1 = require("./logger");
const redaction_1 = require("./redaction");
/**
 * Extended error with HTTP status code
 */
class HttpError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "HttpError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpError = HttpError;
/**
 * Common HTTP error constructors
 */
class BadRequestError extends HttpError {
    constructor(message, details) {
        super(message, 400, "BAD_REQUEST", details);
        this.name = "BadRequestError";
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends HttpError {
    constructor(message = "Authentication required", details) {
        super(message, 401, "UNAUTHORIZED", details);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends HttpError {
    constructor(message = "Access denied", details) {
        super(message, 403, "FORBIDDEN", details);
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends HttpError {
    constructor(resource = "Resource", details) {
        super(`${resource} not found`, 404, "NOT_FOUND", details);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends HttpError {
    constructor(message, details) {
        super(message, 409, "CONFLICT", details);
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends HttpError {
    constructor(message = "Rate limit exceeded", details) {
        super(message, 429, "RATE_LIMIT_EXCEEDED", details);
        this.name = "TooManyRequestsError";
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends HttpError {
    constructor(message = "Internal server error", details) {
        super(message, 500, "INTERNAL_ERROR", details);
        this.name = "InternalServerError";
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Normalize any error into a safe client response
 *
 * @param error - Any error object
 * @param requestId - Request ID for correlation
 * @returns Normalized error response
 */
function normalizeError(error, requestId) {
    const timestamp = new Date().toISOString();
    // Handle HttpError instances
    if (error instanceof HttpError) {
        return {
            status: "error",
            code: error.code,
            message: error.message,
            requestId,
            details: error.details ? (0, redaction_1.redact)(error.details) : undefined,
            timestamp,
        };
    }
    // Handle standard Error instances
    if (error instanceof Error) {
        // Check if it's a known error type by name
        if (error.name === "ValidationError") {
            return {
                status: "error",
                code: "VALIDATION_ERROR",
                message: error.message,
                requestId,
                timestamp,
            };
        }
        if (error.name === "UnauthorizedError" || error.message.includes("unauthorized")) {
            return {
                status: "error",
                code: "UNAUTHORIZED",
                message: "Authentication required",
                requestId,
                timestamp,
            };
        }
        // Generic error response (don't leak internal error messages)
        return {
            status: "error",
            code: "INTERNAL_ERROR",
            message: "An internal error occurred",
            requestId,
            timestamp,
        };
    }
    // Handle unknown error types
    return {
        status: "error",
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
        requestId,
        timestamp,
    };
}
/**
 * Send normalized error response
 *
 * Usage in route handlers:
 *   try {
 *     // ... handler logic
 *   } catch (error) {
 *     return sendErrorResponse(res, error, req.requestId);
 *   }
 *
 * @param res - Express response object
 * @param error - Any error object
 * @param requestId - Request ID for correlation
 * @param statusCodeOverride - Override status code (optional)
 */
function sendErrorResponse(res, error, requestId, statusCodeOverride) {
    const normalizedError = normalizeError(error, requestId);
    // Determine status code
    let statusCode = statusCodeOverride || 500;
    if (error instanceof HttpError) {
        statusCode = error.statusCode;
    }
    // Log the full error with stack trace (for internal debugging)
    (0, logger_1.logError)(`Error handling request: ${normalizedError.message}`, error, {
        requestId,
        code: normalizedError.code,
        statusCode,
        ...normalizedError.details,
    });
    // Send safe error response to client (no stack traces)
    res.status(statusCode).json(normalizedError);
}
/**
 * Express error handling middleware
 *
 * Usage:
 *   app.use(errorHandlerMiddleware);
 *
 * This should be the last middleware in your app.
 * Catches all unhandled errors and returns normalized responses.
 */
function errorHandlerMiddleware(error, req, res, _next) {
    sendErrorResponse(res, error, req.requestId);
}
/**
 * Async route handler wrapper
 *
 * Wraps async route handlers to automatically catch errors and normalize responses.
 *
 * Usage:
 *   router.get('/jobs', asyncHandler(async (req, res) => {
 *     const jobs = await getJobs();
 *     res.json(jobs);
 *   }));
 *
 * Errors thrown in the handler are automatically caught and normalized.
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res)).catch(next);
    };
}
/**
 * Validation error helper
 *
 * Creates a BadRequestError with validation details.
 *
 * Usage:
 *   if (!isValid) {
 *     throw validationError('Invalid input', { field: 'email', issue: 'invalid format' });
 *   }
 */
function validationError(message, details) {
    return new BadRequestError(message, details);
}
//# sourceMappingURL=error-normalizer.js.map