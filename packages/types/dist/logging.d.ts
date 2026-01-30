/**
 * Standardized Logging Utilities
 * Structured logging for observability and debugging
 * Part of Phase 5: Observability
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogContext = Record<string, unknown>;
declare class Logger {
    private isDevelopment;
    constructor();
    private createLogEntry;
    private output;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext, error?: Error): void;
    error(message: string, context?: LogContext, error?: Error): void;
    fatal(message: string, context?: LogContext, error?: Error): void;
    /**
     * Log request start with correlation ID
     */
    requestStart(method: string, path: string, requestId: string, tenantId?: string): void;
    /**
     * Log request end with duration and status
     */
    requestEnd(method: string, path: string, statusCode: number, duration: number, requestId: string, tenantId?: string): void;
}
export declare const logger: Logger;
/**
 * Request correlation utilities
 */
export declare class RequestCorrelation {
    private static requestIdStore;
    static generateRequestId(): string;
    static getRequestId(): string | undefined;
    static setRequestId(requestId: string): void;
}
/**
 * Error boundary for standardized error handling
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly context?: LogContext | undefined;
    constructor(message: string, code: string, statusCode?: number, context?: LogContext | undefined);
    toJSON(): {
        error: {
            stack?: string | undefined;
            code: string;
            message: string;
        };
    };
}
/**
 * Safe async handler wrapper
 * Ensures all errors are caught and logged
 */
export declare function safeAsync<T extends unknown[], R>(fn: (...args: T) => Promise<R>, context?: LogContext): (...args: T) => Promise<R | {
    error: string;
    code: string;
}>;
export {};
//# sourceMappingURL=logging.d.ts.map