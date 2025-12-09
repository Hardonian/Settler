/**
 * Cache Implementation
 * Supports both in-memory (dev) and Redis (production) caching
 */
import Redis from 'ioredis';
export declare function getRedisClient(): Redis | null;
/**
 * Get value from cache
 */
export declare function get<T>(key: string): Promise<T | null>;
/**
 * Set value in cache
 */
export declare function set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
/**
 * Delete value from cache
 */
export declare function del(key: string): Promise<void>;
/**
 * Delete multiple keys matching pattern
 */
export declare function delPattern(pattern: string): Promise<void>;
/**
 * Clear all cache
 */
export declare function clear(): Promise<void>;
/**
 * Generate cache key with namespace
 */
export declare function cacheKey(namespace: string, ...parts: (string | number)[]): string;
/**
 * Close Redis connection
 */
export declare function close(): Promise<void>;
//# sourceMappingURL=cache.d.ts.map