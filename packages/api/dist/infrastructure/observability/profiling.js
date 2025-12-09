"use strict";
/**
 * Performance Profiling Utilities
 * Provides request duration tracking, database query profiling, and memory monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilingMiddleware = profilingMiddleware;
exports.profileQuery = profileQuery;
exports.getMemoryUsage = getMemoryUsage;
exports.formatMemoryUsage = formatMemoryUsage;
exports.getMemoryMetrics = getMemoryMetrics;
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../../utils/logger");
const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const SLOW_DB_THRESHOLD = 500; // 500ms
/**
 * Middleware to profile request performance
 */
function profilingMiddleware(req, res, next) {
    const startTime = perf_hooks_1.performance.now();
    const startMemory = process.memoryUsage();
    // Track database queries
    let queryCount = 0;
    let dbDuration = 0;
    // Override res.end to capture metrics
    const originalEnd = res.end.bind(res);
    res.end = function (chunk, encoding, cb) {
        const duration = perf_hooks_1.performance.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryDelta = {
            rss: endMemory.rss - startMemory.rss,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        };
        // Log slow requests
        if (duration > SLOW_REQUEST_THRESHOLD) {
            (0, logger_1.logWarn)('Slow request detected', {
                path: req.path,
                method: req.method,
                duration,
                queryCount,
                dbDuration,
                memoryDelta: memoryDelta.heapUsed,
                traceId: req.traceId,
            });
        }
        // Add metrics to response header (for debugging)
        res.setHeader('X-Request-Duration', `${duration.toFixed(2)}ms`);
        if (queryCount > 0) {
            res.setHeader('X-DB-Queries', queryCount.toString());
            res.setHeader('X-DB-Duration', `${dbDuration.toFixed(2)}ms`);
        }
        // Call original end with proper typing
        if (typeof encoding === 'function') {
            // encoding is actually a callback function
            originalEnd(chunk, encoding);
        }
        else if (typeof chunk === 'function') {
            // chunk is actually a callback function
            originalEnd(chunk);
        }
        else if (encoding !== undefined && typeof encoding === 'string') {
            // encoding is a BufferEncoding string
            originalEnd(chunk, encoding, cb);
        }
        else if (cb !== undefined) {
            // cb is provided but encoding is not - call with chunk and cb only
            originalEnd(chunk, cb);
        }
        else {
            // Only chunk provided
            originalEnd(chunk);
        }
    };
    next();
}
/**
 * Profile database query execution
 */
function profileQuery(queryFn, queryName) {
    const start = perf_hooks_1.performance.now();
    return queryFn().then((result) => {
        const duration = perf_hooks_1.performance.now() - start;
        if (duration > SLOW_DB_THRESHOLD) {
            (0, logger_1.logWarn)('Slow database query detected', {
                query: queryName || 'unknown',
                duration,
            });
        }
        return { result, duration };
    });
}
/**
 * Get current memory usage
 */
function getMemoryUsage() {
    return process.memoryUsage();
}
/**
 * Format memory usage for logging
 */
function formatMemoryUsage(usage) {
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };
    return `Heap: ${formatBytes(usage.heapUsed)}/${formatBytes(usage.heapTotal)}, External: ${formatBytes(usage.external)}`;
}
/**
 * Memory usage monitoring endpoint data
 */
function getMemoryMetrics() {
    const usage = process.memoryUsage();
    return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        formatted: formatMemoryUsage(usage),
    };
}
//# sourceMappingURL=profiling.js.map