/**
 * Generate a unique correlation ID for request tracing.
 * Uses UUID v4 for global uniqueness.
 */
export declare function generateCorrelationId(): string;
/**
 * Extract correlation ID from headers (case-insensitive).
 * Common header names: X-Correlation-ID, X-Request-ID, X-Trace-ID
 */
export declare function extractCorrelationId(headers: Record<string, string | string[] | undefined>): string | undefined;
/**
 * Get the current correlation ID from async context
 */
export declare function getCurrentCorrelationId(): string | undefined;
/**
 * Run a function with a correlation ID in async context
 */
export declare function runWithCorrelationId<T>(correlationId: string, callback: () => T): T;
//# sourceMappingURL=correlation.d.ts.map