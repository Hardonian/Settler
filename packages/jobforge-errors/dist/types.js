/**
 * Standard error codes for the application.
 * Using string literals for better API debugging.
 */
export var ErrorCode;
(function (ErrorCode) {
    // Client errors (4xx)
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Server errors (5xx)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_CODE_TO_HTTP_STATUS = {
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
};
/**
 * Application error class with correlation ID support
 */
export class AppError extends Error {
    code;
    correlationId;
    details;
    isOperational;
    constructor(code, message, options) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.correlationId = options?.correlationId;
        this.details = options?.details;
        this.isOperational = options?.isOperational ?? true;
        if (options?.cause) {
            this.cause = options.cause;
        }
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Convert error to standard envelope format
     */
    toEnvelope(includeStack = false) {
        return {
            code: this.code,
            message: this.message,
            correlationId: this.correlationId,
            details: this.details,
            stack: includeStack ? this.stack : undefined,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get HTTP status code for this error
     */
    get httpStatus() {
        return ERROR_CODE_TO_HTTP_STATUS[this.code];
    }
}
