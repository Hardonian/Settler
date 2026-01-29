"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownError = exports.ServerError = exports.RateLimitError = exports.ValidationError = exports.AuthError = exports.NetworkError = exports.SettlerError = void 0;
exports.parseError = parseError;
/**
 * Base error class for all Settler SDK errors
 */
class SettlerError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        if (statusCode !== undefined) {
            this.statusCode = statusCode;
        }
        if (details !== undefined) {
            this.details = details;
        }
        Error.captureStackTrace?.(this, this.constructor);
    }
}
exports.SettlerError = SettlerError;
/**
 * Network-related errors (timeouts, connection failures, etc.)
 */
class NetworkError extends SettlerError {
    constructor(message, cause) {
        super(message, "NETWORK_ERROR", undefined, { cause });
        this.name = "NetworkError";
    }
}
exports.NetworkError = NetworkError;
/**
 * Authentication errors (invalid API key, expired token, etc.)
 */
class AuthError extends SettlerError {
    constructor(message, statusCode, details) {
        super(message, "AUTH_ERROR", statusCode || 401, details);
        this.name = "AuthError";
    }
}
exports.AuthError = AuthError;
/**
 * Validation errors (invalid request parameters, etc.)
 */
class ValidationError extends SettlerError {
    field;
    constructor(message, field, statusCode, details) {
        super(message, "VALIDATION_ERROR", statusCode || 400, details);
        this.name = "ValidationError";
        if (field !== undefined) {
            this.field = field;
        }
    }
}
exports.ValidationError = ValidationError;
/**
 * Rate limit errors (too many requests)
 */
class RateLimitError extends SettlerError {
    retryAfter;
    limit;
    remaining;
    reset;
    constructor(message, retryAfter, limit, remaining, reset) {
        super(message, "RATE_LIMIT_ERROR", 429);
        this.name = "RateLimitError";
        if (retryAfter !== undefined) {
            this.retryAfter = retryAfter;
        }
        if (limit !== undefined) {
            this.limit = limit;
        }
        if (remaining !== undefined) {
            this.remaining = remaining;
        }
        if (reset !== undefined) {
            this.reset = reset;
        }
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Server errors (5xx responses)
 */
class ServerError extends SettlerError {
    constructor(message, statusCode, details) {
        super(message, "SERVER_ERROR", statusCode || 500, details);
        this.name = "ServerError";
    }
}
exports.ServerError = ServerError;
/**
 * Unknown/Unhandled errors
 */
class UnknownError extends SettlerError {
    constructor(message, cause) {
        super(message, "UNKNOWN_ERROR", undefined, { cause });
        this.name = "UnknownError";
    }
}
exports.UnknownError = UnknownError;
/**
 * Parses an API error response and returns the appropriate error class
 */
function parseError(response, body) {
    const statusCode = response.status;
    const errorData = typeof body === "object" && body !== null
        ? body
        : {};
    const message = errorData.message ||
        errorData.error ||
        `HTTP ${statusCode}: ${response.statusText}`;
    switch (statusCode) {
        case 400:
            return new ValidationError(message, undefined, statusCode, errorData.details);
        case 401:
        case 403:
            return new AuthError(message, statusCode, errorData.details);
        case 429: {
            const retryAfter = response.headers.get("Retry-After");
            const limit = response.headers.get("X-RateLimit-Limit");
            const remaining = response.headers.get("X-RateLimit-Remaining");
            const reset = response.headers.get("X-RateLimit-Reset");
            return new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : undefined, limit ? parseInt(limit, 10) : undefined, remaining ? parseInt(remaining, 10) : undefined, reset ? parseInt(reset, 10) : undefined);
        }
        case 500:
        case 502:
        case 503:
        case 504:
            return new ServerError(message, statusCode, errorData.details);
        default:
            return new SettlerError(message, "API_ERROR", statusCode, errorData.details);
    }
}
//# sourceMappingURL=errors.js.map