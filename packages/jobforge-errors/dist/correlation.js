import { randomUUID } from "crypto";
/**
 * Generate a unique correlation ID for request tracing.
 * Uses UUID v4 for global uniqueness.
 */
export function generateCorrelationId() {
    return randomUUID();
}
/**
 * Extract correlation ID from headers (case-insensitive).
 * Common header names: X-Correlation-ID, X-Request-ID, X-Trace-ID
 */
export function extractCorrelationId(headers) {
    const headerNames = ["x-correlation-id", "x-request-id", "x-trace-id"];
    for (const name of headerNames) {
        const value = headers[name];
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
        if (Array.isArray(value) && value[0]) {
            return value[0];
        }
    }
    return undefined;
}
/**
 * Correlation ID storage using AsyncLocalStorage for Node.js
 * This allows accessing the correlation ID anywhere in the request context
 */
let correlationStorage = null;
try {
    // AsyncLocalStorage is available in Node.js 12.17.0+
    const { AsyncLocalStorage } = require("async_hooks");
    const storage = new AsyncLocalStorage();
    correlationStorage = {
        getStore: () => storage.getStore(),
        run: (correlationId, callback) => storage.run(correlationId, callback),
    };
}
catch {
    // Fallback for environments without AsyncLocalStorage (e.g., edge runtime)
    correlationStorage = {
        getStore: () => undefined,
        run: (_correlationId, callback) => callback(),
    };
}
/**
 * Get the current correlation ID from async context
 */
export function getCurrentCorrelationId() {
    return correlationStorage?.getStore();
}
/**
 * Run a function with a correlation ID in async context
 */
export function runWithCorrelationId(correlationId, callback) {
    if (!correlationStorage) {
        return callback();
    }
    return correlationStorage.run(correlationId, callback);
}
