"use strict";
/**
 * Cache Invalidation Strategies
 * Provides utilities for invalidating cache entries based on patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateJobCache = invalidateJobCache;
exports.invalidateUserCache = invalidateUserCache;
exports.invalidateTenantCache = invalidateTenantCache;
exports.invalidateAdapterCache = invalidateAdapterCache;
exports.invalidateJobStatusCache = invalidateJobStatusCache;
exports.invalidateReportCache = invalidateReportCache;
const cache_1 = require("./cache");
const logger_1 = require("./logger");
/**
 * Invalidate cache for a specific job
 */
async function invalidateJobCache(jobId) {
    const patterns = [
        (0, cache_1.cacheKey)('job', jobId),
        (0, cache_1.cacheKey)('job', jobId, '*'),
        (0, cache_1.cacheKey)('reports', jobId),
        (0, cache_1.cacheKey)('reports', jobId, '*'),
    ];
    for (const pattern of patterns) {
        await (0, cache_1.del)(pattern);
    }
    (0, logger_1.logInfo)('Job cache invalidated', { jobId });
}
/**
 * Invalidate cache for a specific user
 */
async function invalidateUserCache(userId) {
    const patterns = [
        (0, cache_1.cacheKey)('user', userId),
        (0, cache_1.cacheKey)('user', userId, '*'),
        (0, cache_1.cacheKey)('jobs', userId, '*'),
    ];
    for (const pattern of patterns) {
        await (0, cache_1.delPattern)(pattern);
    }
    (0, logger_1.logInfo)('User cache invalidated', { userId });
}
/**
 * Invalidate cache for a specific tenant
 */
async function invalidateTenantCache(tenantId) {
    const patterns = [
        (0, cache_1.cacheKey)('tenant', tenantId),
        (0, cache_1.cacheKey)('tenant', tenantId, '*'),
    ];
    for (const pattern of patterns) {
        await (0, cache_1.delPattern)(pattern);
    }
    (0, logger_1.logInfo)('Tenant cache invalidated', { tenantId });
}
/**
 * Invalidate all adapter-related cache
 */
async function invalidateAdapterCache(adapterName) {
    const patterns = [
        (0, cache_1.cacheKey)('adapter', adapterName),
        (0, cache_1.cacheKey)('adapter', adapterName, '*'),
    ];
    for (const pattern of patterns) {
        await (0, cache_1.delPattern)(pattern);
    }
    (0, logger_1.logInfo)('Adapter cache invalidated', { adapterName });
}
/**
 * Invalidate cache after job status change
 */
async function invalidateJobStatusCache(jobId, oldStatus, newStatus) {
    // Invalidate job cache
    await invalidateJobCache(jobId);
    // Invalidate status-specific caches
    if (oldStatus !== newStatus) {
        await (0, cache_1.del)((0, cache_1.cacheKey)('jobs', 'status', oldStatus));
        await (0, cache_1.del)((0, cache_1.cacheKey)('jobs', 'status', newStatus));
    }
}
/**
 * Invalidate cache after report generation
 */
async function invalidateReportCache(jobId) {
    await (0, cache_1.del)((0, cache_1.cacheKey)('reports', jobId));
    await (0, cache_1.del)((0, cache_1.cacheKey)('reports', jobId, 'summary'));
    await (0, cache_1.del)((0, cache_1.cacheKey)('reports', jobId, 'details'));
}
//# sourceMappingURL=cache-invalidation.js.map