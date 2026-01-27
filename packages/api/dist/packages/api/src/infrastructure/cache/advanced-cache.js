"use strict";
/**
 * Advanced Caching Strategies
 * Implements tag-based invalidation, cache warming, and coherency checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setWithTags = setWithTags;
exports.invalidateByTag = invalidateByTag;
exports.invalidateByTags = invalidateByTags;
exports.warmCache = warmCache;
exports.checkCoherency = checkCoherency;
exports.getCacheStats = getCacheStats;
exports.clearAllCache = clearAllCache;
const cache_1 = require("../../utils/cache");
const logger_1 = require("../../utils/logger");
// In-memory tag index (in production, use Redis SET operations)
const tagIndex = new Map();
/**
 * Set cache value with tags for invalidation
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 * @param tags - Tags for invalidation
 */
async function setWithTags(key, value, ttlSeconds, tags = []) {
    await (0, cache_1.set)(key, value, ttlSeconds);
    // Index tags
    for (const tag of tags) {
        if (!tagIndex.has(tag)) {
            tagIndex.set(tag, new Set());
        }
        tagIndex.get(tag).add(key);
    }
    // Store tag metadata in cache
    if (tags.length > 0) {
        await (0, cache_1.set)(`${key}:tags`, tags, ttlSeconds);
    }
}
/**
 * Invalidate all keys with a specific tag
 *
 * @param tag - Tag to invalidate
 */
async function invalidateByTag(tag) {
    const keys = tagIndex.get(tag);
    if (!keys || keys.size === 0) {
        return 0;
    }
    let invalidated = 0;
    for (const key of keys) {
        await (0, cache_1.del)(key);
        await (0, cache_1.del)(`${key}:tags`);
        invalidated++;
    }
    tagIndex.delete(tag);
    (0, logger_1.logInfo)(`Invalidated ${invalidated} cache entries for tag: ${tag}`);
    return invalidated;
}
/**
 * Invalidate multiple tags at once
 *
 * @param tags - Tags to invalidate
 */
async function invalidateByTags(tags) {
    let total = 0;
    for (const tag of tags) {
        total += await invalidateByTag(tag);
    }
    return total;
}
/**
 * Warm cache with frequently accessed data
 *
 * @param warmupFn - Function that returns key-value pairs to cache
 * @param ttlSeconds - Time to live for warmed entries
 */
async function warmCache(warmupFn, ttlSeconds = 3600) {
    try {
        const entries = await warmupFn();
        for (const entry of entries) {
            await setWithTags(entry.key, entry.value, ttlSeconds, entry.tags || []);
        }
        (0, logger_1.logInfo)(`Warmed cache with ${entries.length} entries`);
    }
    catch (error) {
        (0, logger_1.logWarn)('Cache warming failed', { error });
    }
}
/**
 * Check cache coherency (verify cached data is still valid)
 *
 * @param key - Cache key to check
 * @param validator - Function that validates cached value
 * @returns True if cache is coherent, false if invalid
 */
async function checkCoherency(key, validator) {
    const cached = await (0, cache_1.get)(key);
    if (!cached) {
        return false;
    }
    try {
        const isValid = await validator(cached);
        if (!isValid) {
            await (0, cache_1.del)(key);
            (0, logger_1.logWarn)('Cache coherency check failed, invalidated', { key });
            return false;
        }
        return true;
    }
    catch (error) {
        (0, logger_1.logWarn)('Cache coherency check error', { key, error });
        return false;
    }
}
/**
 * Get cache statistics
 */
function getCacheStats() {
    const allKeys = new Set();
    for (const keys of tagIndex.values()) {
        for (const key of keys) {
            allKeys.add(key);
        }
    }
    return {
        tagCount: tagIndex.size,
        tags: Array.from(tagIndex.keys()),
        totalKeys: allKeys.size,
    };
}
/**
 * Clear all cache and tags
 */
async function clearAllCache() {
    tagIndex.clear();
    // Note: This would need to clear Redis cache as well
    // Implementation depends on cache utility
}
//# sourceMappingURL=advanced-cache.js.map