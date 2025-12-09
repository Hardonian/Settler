"use strict";
/**
 * API Gateway Cache Middleware
 * Redis-based request caching for API responses
 * Provides performant query layers with intelligent cache invalidation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheConfigs = void 0;
exports.apiGatewayCache = apiGatewayCache;
exports.cacheInvalidation = cacheInvalidation;
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const DEFAULT_TTL = 300; // 5 minutes
/**
 * Generate cache key for request
 */
function generateRequestCacheKey(req, config) {
    if (config.keyGenerator) {
        return config.keyGenerator(req);
    }
    const parts = ['api', req.method.toLowerCase(), req.path];
    // Include query params if specified
    if (config.includeQueryParams && Object.keys(req.query).length > 0) {
        const sortedQuery = Object.keys(req.query)
            .sort()
            .map((key) => `${key}=${req.query[key]}`)
            .join('&');
        parts.push(sortedQuery);
    }
    // Include user ID if specified
    if (config.includeUserId && req.userId) {
        parts.push(`user:${req.userId}`);
    }
    return parts.join(':');
}
/**
 * API Gateway Cache Middleware
 * Caches GET request responses in Redis
 */
function apiGatewayCache(config = {}) {
    const { ttl = DEFAULT_TTL, enabled = true, tags = [], } = config;
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET' || !enabled) {
            return next();
        }
        // Skip caching for authenticated endpoints that require fresh data
        if (req.path.includes('/auth/') || req.path.includes('/webhooks/')) {
            return next();
        }
        try {
            const cacheKey = generateRequestCacheKey(req, config);
            const cached = await (0, cache_1.get)(cacheKey);
            if (cached) {
                (0, logger_1.logDebug)('Cache hit', { key: cacheKey, path: req.path });
                res.setHeader('X-Cache', 'HIT');
                res.json(cached);
                return;
            }
            // Cache miss - intercept response
            res.setHeader('X-Cache', 'MISS');
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                // Cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    (0, cache_1.set)(cacheKey, body, ttl).catch((error) => {
                        (0, logger_1.logDebug)('Cache set failed', { error, key: cacheKey });
                    });
                    // Store cache tags for invalidation
                    if (tags.length > 0) {
                        tags.forEach((tag) => {
                            const tagKey = `cache:tag:${tag}`;
                            (0, cache_1.get)(tagKey).then((taggedKeys) => {
                                const keys = taggedKeys || [];
                                if (!keys.includes(cacheKey)) {
                                    keys.push(cacheKey);
                                    (0, cache_1.set)(tagKey, keys, ttl * 2).catch(() => { });
                                }
                            });
                        });
                    }
                }
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            (0, logger_1.logDebug)('Cache middleware error', { error });
            // Continue without caching on error
            next();
        }
    };
}
/**
 * Cache invalidation middleware
 * Invalidates cache on state-changing operations
 */
function cacheInvalidation(tags = []) {
    return async (req, res, next) => {
        // Only invalidate on state-changing methods
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next();
        }
        const originalEnd = res.end.bind(res);
        res.end = function (chunk, encoding, cb) {
            // Invalidate cache on successful state changes
            if (res.statusCode >= 200 && res.statusCode < 300) {
                invalidateCache(req, tags).catch((error) => {
                    (0, logger_1.logDebug)('Cache invalidation error', { error });
                });
            }
            if (encoding !== undefined && typeof encoding === 'string') {
                originalEnd(chunk, encoding, cb);
            }
            else if (cb !== undefined) {
                originalEnd(chunk, cb);
            }
            else {
                originalEnd(chunk);
            }
        };
        next();
    };
}
/**
 * Invalidate cache by tags or patterns
 */
async function invalidateCache(req, tags) {
    try {
        // Invalidate by tags
        for (const tag of tags) {
            const tagKey = `cache:tag:${tag}`;
            const taggedKeys = await (0, cache_1.get)(tagKey);
            if (taggedKeys) {
                for (const key of taggedKeys) {
                    await (0, cache_1.del)(key);
                }
                await (0, cache_1.del)(tagKey);
            }
        }
        // Invalidate by pattern
        const patterns = generateInvalidationPatterns(req);
        for (const _pattern of patterns) {
            // Pattern-based invalidation would require Redis SCAN
            // For now, skip pattern-based invalidation
            // await delPattern(pattern);
        }
        (0, logger_1.logInfo)('Cache invalidated', { tags, patterns, path: req.path });
    }
    catch (error) {
        (0, logger_1.logDebug)('Cache invalidation failed', { error });
    }
}
/**
 * Generate cache invalidation patterns from request
 */
function generateInvalidationPatterns(req) {
    const patterns = [];
    // Invalidate by path
    patterns.push(`api:*:${req.path}*`);
    // Invalidate by resource ID
    const resourceId = req.params.id;
    if (resourceId) {
        patterns.push(`api:*:*${resourceId}*`);
    }
    // Invalidate user-specific cache
    if (req.userId) {
        patterns.push(`api:*:*user:${req.userId}*`);
    }
    return patterns;
}
/**
 * Predefined cache configurations for common endpoints
 */
exports.cacheConfigs = {
    // Jobs endpoints
    jobsList: () => ({
        ttl: 60, // 1 minute
        includeQueryParams: true,
        includeUserId: true,
        tags: ['jobs'],
    }),
    jobGet: () => ({
        ttl: 300, // 5 minutes
        includeUserId: true,
        tags: ['jobs'],
    }),
    // Reports endpoints
    reportGet: () => ({
        ttl: 60, // 1 minute (reports change frequently)
        includeUserId: true,
        tags: ['reports'],
    }),
    // Adapters endpoints (rarely change)
    adaptersList: () => ({
        ttl: 3600, // 1 hour
        tags: ['adapters'],
    }),
    adapterGet: () => ({
        ttl: 3600, // 1 hour
        tags: ['adapters'],
    }),
    // Reconciliation summary (cached aggressively)
    reconciliationSummary: () => ({
        ttl: 30, // 30 seconds
        includeQueryParams: true,
        includeUserId: true,
        tags: ['reconciliation', 'summary'],
    }),
};
//# sourceMappingURL=api-gateway-cache.js.map