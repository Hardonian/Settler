"use strict";
/**
 * Request deduplication utility to prevent duplicate in-flight requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDeduplication = withDeduplication;
exports.clearPendingRequests = clearPendingRequests;
const pendingRequests = new Map();
const REQUEST_TIMEOUT = 60000; // 60 seconds
/**
 * Generates a unique key for a request based on method, path, and body
 */
function generateRequestKey(method, path, body) {
    const bodyHash = body ? JSON.stringify(body) : "";
    return `${method}:${path}:${bodyHash}`;
}
/**
 * Cleans up stale pending requests
 */
function cleanupStaleRequests() {
    const now = Date.now();
    for (const [key, request] of pendingRequests.entries()) {
        if (now - request.timestamp > REQUEST_TIMEOUT) {
            pendingRequests.delete(key);
        }
    }
}
/**
 * Executes a function with request deduplication
 * If the same request is already in-flight, returns the existing promise
 */
async function withDeduplication(method, path, body, fn) {
    cleanupStaleRequests();
    const key = generateRequestKey(method, path, body);
    const existing = pendingRequests.get(key);
    if (existing) {
        return existing.promise;
    }
    const promise = fn().finally(() => {
        pendingRequests.delete(key);
    });
    pendingRequests.set(key, {
        promise,
        timestamp: Date.now(),
    });
    return promise;
}
/**
 * Clears all pending requests (useful for testing)
 */
function clearPendingRequests() {
    pendingRequests.clear();
}
//# sourceMappingURL=deduplication.js.map