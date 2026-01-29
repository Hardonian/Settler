/**
 * Request deduplication utility to prevent duplicate in-flight requests
 */
/**
 * Executes a function with request deduplication
 * If the same request is already in-flight, returns the existing promise
 */
export declare function withDeduplication<T>(method: string, path: string, body: unknown, fn: () => Promise<T>): Promise<T>;
/**
 * Clears all pending requests (useful for testing)
 */
export declare function clearPendingRequests(): void;
//# sourceMappingURL=deduplication.d.ts.map