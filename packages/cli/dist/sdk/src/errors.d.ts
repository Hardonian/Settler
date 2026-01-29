/**
 * Base error class for all Settler SDK errors
 */
export declare class SettlerError extends Error {
    readonly code: string;
    readonly statusCode?: number;
    readonly details?: unknown;
    constructor(message: string, code: string, statusCode?: number, details?: unknown);
}
/**
 * Network-related errors (timeouts, connection failures, etc.)
 */
export declare class NetworkError extends SettlerError {
    constructor(message: string, cause?: Error);
}
/**
 * Authentication errors (invalid API key, expired token, etc.)
 */
export declare class AuthError extends SettlerError {
    constructor(message: string, statusCode?: number, details?: unknown);
}
/**
 * Validation errors (invalid request parameters, etc.)
 */
export declare class ValidationError extends SettlerError {
    readonly field?: string;
    constructor(message: string, field?: string, statusCode?: number, details?: unknown);
}
/**
 * Rate limit errors (too many requests)
 */
export declare class RateLimitError extends SettlerError {
    readonly retryAfter?: number;
    readonly limit?: number;
    readonly remaining?: number;
    readonly reset?: number;
    constructor(message: string, retryAfter?: number, limit?: number, remaining?: number, reset?: number);
}
/**
 * Server errors (5xx responses)
 */
export declare class ServerError extends SettlerError {
    constructor(message: string, statusCode?: number, details?: unknown);
}
/**
 * Unknown/Unhandled errors
 */
export declare class UnknownError extends SettlerError {
    constructor(message: string, cause?: Error);
}
/**
 * Parses an API error response and returns the appropriate error class
 */
export declare function parseError(response: Response, body?: unknown): SettlerError;
//# sourceMappingURL=errors.d.ts.map