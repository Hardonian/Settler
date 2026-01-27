"use strict";
/**
 * Error Standardization Middleware
 * Ensures all errors follow consistent format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardizeErrorResponse = standardizeErrorResponse;
exports.errorStandardizationMiddleware = errorStandardizationMiddleware;
const logger_1 = require("../utils/logger");
/**
 * Error code mapping
 */
const ERROR_CODE_MAP = {
    ValidationError: "VALIDATION_ERROR",
    UnauthorizedError: "UNAUTHORIZED",
    ForbiddenError: "FORBIDDEN",
    NotFoundError: "NOT_FOUND",
    ConflictError: "CONFLICT",
    RateLimitError: "RATE_LIMIT_EXCEEDED",
    QuotaExceededError: "QUOTA_EXCEEDED",
    InternalServerError: "INTERNAL_ERROR",
    ServiceUnavailableError: "SERVICE_UNAVAILABLE",
    BadRequestError: "BAD_REQUEST",
};
/**
 * Get error code from error
 */
function getErrorCode(error) {
    if (error instanceof Error) {
        const errorName = error.constructor.name;
        return ERROR_CODE_MAP[errorName] || "INTERNAL_ERROR";
    }
    return "INTERNAL_ERROR";
}
/**
 * Get HTTP status code from error
 */
function getStatusCode(error) {
    const code = getErrorCode(error);
    const statusMap = {
        VALIDATION_ERROR: 400,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        RATE_LIMIT_EXCEEDED: 429,
        QUOTA_EXCEEDED: 429,
        INTERNAL_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
    };
    return statusMap[code] || 500;
}
/**
 * Get error message
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "An unexpected error occurred";
}
/**
 * Get error details
 */
function getErrorDetails(error) {
    if (error instanceof Error && "details" in error) {
        const errorWithDetails = error;
        return errorWithDetails.details;
    }
    return undefined;
}
/**
 * Standardize error response
 */
function standardizeErrorResponse(error, req, res) {
    const traceId = req.traceId;
    const code = getErrorCode(error);
    const message = getErrorMessage(error);
    const details = getErrorDetails(error);
    const statusCode = getStatusCode(error);
    const standardized = {
        error: code,
        message,
        timestamp: new Date().toISOString(),
    };
    if (traceId) {
        standardized.traceId = traceId;
    }
    if (details) {
        standardized.details = details;
    }
    // Log error for monitoring
    if (statusCode >= 500) {
        (0, logger_1.logError)("Server error", error, {
            traceId,
            code,
            path: req.path,
            method: req.method,
        });
    }
    res.status(statusCode).json(standardized);
}
/**
 * Error handler middleware
 */
function errorStandardizationMiddleware(error, req, res, _next) {
    standardizeErrorResponse(error, req, res);
}
//# sourceMappingURL=error-standardization.js.map