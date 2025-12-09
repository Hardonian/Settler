/**
 * OpenTelemetry Distributed Tracing
 * Sets up distributed tracing for the application
 */
import { Span } from '@opentelemetry/api';
export declare function initializeTracing(): void;
export declare function shutdownTracing(): Promise<void>;
/**
 * Create a span for a function execution
 */
export declare function traceFunction<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, string | number | boolean>): Promise<T>;
/**
 * Create a database span
 */
export declare function traceDatabase<T>(operation: string, query: string, fn: () => Promise<T>, tenantId?: string): Promise<T>;
/**
 * Create a cache span
 */
export declare function traceCache<T>(operation: string, key: string, fn: () => Promise<T>, tenantId?: string): Promise<T>;
/**
 * Create a queue span
 */
export declare function traceQueue<T>(queueName: string, operation: string, fn: () => Promise<T>, tenantId?: string, jobId?: string): Promise<T>;
/**
 * Create a business span (for domain-specific operations)
 */
export declare function traceBusiness<T>(operation: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, string | number | boolean>, tenantId?: string): Promise<T>;
/**
 * Get the current trace ID
 */
export declare function getTraceId(): string | undefined;
//# sourceMappingURL=tracing.d.ts.map