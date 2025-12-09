/**
 * Redis Client Configuration (Upstash Redis)
 *
 * Used for:
 * - In-memory matching engine (sub-second reconciliation)
 * - Caching reconciliation results
 * - Rate limiting
 * - Session storage
 */
import { Redis } from '@upstash/redis';
/**
 * Upstash Redis client (serverless-friendly)
 */
export declare const redis: Redis | null;
/**
 * Get Redis client (Upstash or ioredis fallback)
 */
export declare function getRedisClient(): Redis | any;
/**
 * Check if Redis is available
 */
export declare function isRedisAvailable(): boolean;
/**
 * Cache helper functions
 */
export declare const cache: {
    /**
     * Get value from cache
     */
    get<T = any>(key: string): Promise<T | null>;
    /**
     * Set value in cache
     */
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    /**
     * Delete value from cache
     */
    del(key: string): Promise<void>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
};
//# sourceMappingURL=client.d.ts.map