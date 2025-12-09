/**
 * Structured Logging with OpenTelemetry Integration
 * JSON structured logs with trace_id, span_id, tenant_id
 */
import winston from 'winston';
export declare const logger: winston.Logger;
export declare function logInfo(message: string, meta?: Record<string, unknown>): void;
export declare function logError(message: string, error?: unknown, meta?: Record<string, unknown>): void;
export declare function logWarn(message: string, meta?: Record<string, unknown>): void;
export declare function logDebug(message: string, meta?: Record<string, unknown>): void;
export declare function logBusinessEvent(event: string, meta?: {
    tenant_id?: string;
    user_id?: string;
    job_id?: string;
    execution_id?: string;
    [key: string]: unknown;
}): void;
export declare function logPerformance(operation: string, durationMs: number, meta?: {
    tenant_id?: string;
    [key: string]: unknown;
}): void;
//# sourceMappingURL=logger.d.ts.map