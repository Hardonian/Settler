/**
 * API Gateway Cache Middleware
 * Redis-based request caching for API responses
 * Provides performant query layers with intelligent cache invalidation
 */
import { Request, Response, NextFunction } from 'express';
export interface CacheConfig {
    /** Cache TTL in seconds */
    ttl?: number;
    /** Whether to cache this endpoint */
    enabled?: boolean;
    /** Cache key generator function */
    keyGenerator?: (req: Request) => string;
    /** Whether to include query params in cache key */
    includeQueryParams?: boolean;
    /** Whether to include user ID in cache key (for user-specific data) */
    includeUserId?: boolean;
    /** Cache tags for invalidation */
    tags?: string[];
}
/**
 * API Gateway Cache Middleware
 * Caches GET request responses in Redis
 */
export declare function apiGatewayCache(config?: CacheConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Cache invalidation middleware
 * Invalidates cache on state-changing operations
 */
export declare function cacheInvalidation(tags?: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Predefined cache configurations for common endpoints
 */
export declare const cacheConfigs: {
    jobsList: () => CacheConfig;
    jobGet: () => CacheConfig;
    reportGet: () => CacheConfig;
    adaptersList: () => CacheConfig;
    adapterGet: () => CacheConfig;
    reconciliationSummary: () => CacheConfig;
};
//# sourceMappingURL=api-gateway-cache.d.ts.map