/**
 * Standardized Logging Utilities
 * Structured logging for observability and debugging
 * Part of Phase 5: Observability
 */
class Logger {
    isDevelopment;
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev";
    }
    createLogEntry(level, message, context, error, metadata) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...metadata,
        };
        if (context && Object.keys(context).length > 0) {
            entry.context = context;
        }
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined,
            };
        }
        return entry;
    }
    output(entry) {
        if (this.isDevelopment) {
            const colorCode = {
                debug: "\x1b[36m", // Cyan
                info: "\x1b[32m", // Green
                warn: "\x1b[33m", // Yellow
                error: "\x1b[31m", // Red
                fatal: "\x1b[35m", // Magenta
            }[entry.level];
            console.log(`${colorCode}[${entry.level.toUpperCase()}]\x1b[0m ${entry.timestamp} - ${entry.message}`, entry.context || "", entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : "");
        }
        else {
            console.log(JSON.stringify(entry));
        }
    }
    debug(message, context) {
        this.output(this.createLogEntry("debug", message, context));
    }
    info(message, context) {
        this.output(this.createLogEntry("info", message, context));
    }
    warn(message, context, error) {
        this.output(this.createLogEntry("warn", message, context, error));
    }
    error(message, context, error) {
        this.output(this.createLogEntry("error", message, context, error));
    }
    fatal(message, context, error) {
        this.output(this.createLogEntry("fatal", message, context, error));
    }
    /**
     * Log request start with correlation ID
     */
    requestStart(method, path, requestId, tenantId) {
        this.info(`Request started: ${method} ${path}`, {
            method,
            path,
            requestId,
            tenantId,
            type: "request_start",
        });
    }
    /**
     * Log request end with duration and status
     */
    requestEnd(method, path, statusCode, duration, requestId, tenantId) {
        const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
        this.output(this.createLogEntry(level, `Request completed: ${method} ${path} - ${statusCode} (${duration}ms)`, {
            method,
            path,
            statusCode,
            duration,
            type: "request_end",
        }, undefined, { requestId, tenantId, duration }));
    }
}
export const logger = new Logger();
/**
 * Request correlation utilities
 */
export class RequestCorrelation {
    static requestIdStore = new Map();
    static generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    static getRequestId() {
        const asyncId = process.asyncId?.();
        return asyncId ? RequestCorrelation.requestIdStore.get(asyncId) : undefined;
    }
    static setRequestId(requestId) {
        const asyncId = process.asyncId?.();
        if (asyncId) {
            RequestCorrelation.requestIdStore.set(asyncId, requestId);
        }
    }
}
/**
 * Error boundary for standardized error handling
 */
export class AppError extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 500, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = "AppError";
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
            },
        };
    }
}
/**
 * Safe async handler wrapper
 * Ensures all errors are caught and logged
 */
export function safeAsync(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error("Unhandled error in async function", { ...context, args }, err);
            return {
                error: err.message,
                code: "INTERNAL_ERROR",
            };
        }
    };
}
//# sourceMappingURL=logging.js.map