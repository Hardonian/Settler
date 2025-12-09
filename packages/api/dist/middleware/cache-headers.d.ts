/**
 * Cache Headers Middleware
 * Sets appropriate cache headers for safe GET endpoints
 */
import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    private?: boolean;
}
/**
 * Set cache headers on response
 */
export declare function setCacheHeaders(res: Response, options?: CacheOptions): void;
/**
 * Cache middleware factory
 */
export declare function cacheMiddleware(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cache headers for different endpoint types
 */
export declare const cachePresets: {
    noCache: () => CacheOptions;
    short: () => CacheOptions;
    medium: () => CacheOptions;
    long: () => CacheOptions;
    static: () => CacheOptions;
    private: (maxAge?: number) => CacheOptions;
};
//# sourceMappingURL=cache-headers.d.ts.map