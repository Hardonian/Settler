"use strict";
/**
 * Cache Headers Middleware
 * Sets appropriate cache headers for safe GET endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePresets = void 0;
exports.setCacheHeaders = setCacheHeaders;
exports.cacheMiddleware = cacheMiddleware;
/**
 * Set cache headers on response
 */
function setCacheHeaders(res, options = {}) {
    const { maxAge = 0, sMaxAge, staleWhileRevalidate, mustRevalidate = false, noCache = false, noStore = false, private: isPrivate = false, } = options;
    if (noStore) {
        res.setHeader('Cache-Control', 'no-store');
        return;
    }
    if (noCache) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        return;
    }
    const directives = [];
    if (isPrivate) {
        directives.push('private');
    }
    else {
        directives.push('public');
    }
    if (maxAge > 0) {
        directives.push(`max-age=${maxAge}`);
    }
    if (sMaxAge !== undefined) {
        directives.push(`s-maxage=${sMaxAge}`);
    }
    if (staleWhileRevalidate !== undefined && staleWhileRevalidate > 0) {
        directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }
    if (mustRevalidate) {
        directives.push('must-revalidate');
    }
    res.setHeader('Cache-Control', directives.join(', '));
}
/**
 * Cache middleware factory
 */
function cacheMiddleware(options = {}) {
    return (req, res, next) => {
        // Only apply to GET/HEAD requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }
        setCacheHeaders(res, options);
        next();
    };
}
/**
 * Cache headers for different endpoint types
 */
exports.cachePresets = {
    // No caching (default for dynamic content)
    noCache: () => ({ noCache: true }),
    // Short cache (1 minute) for frequently changing data
    short: () => ({ maxAge: 60, staleWhileRevalidate: 300 }),
    // Medium cache (5 minutes) for moderately changing data
    medium: () => ({ maxAge: 300, staleWhileRevalidate: 600 }),
    // Long cache (1 hour) for relatively static data
    long: () => ({ maxAge: 3600, staleWhileRevalidate: 7200 }),
    // Static cache (1 day) for rarely changing data
    static: () => ({ maxAge: 86400, sMaxAge: 86400 }),
    // Private cache only (user-specific data)
    private: (maxAge = 300) => ({
        private: true,
        maxAge,
        mustRevalidate: true,
    }),
};
//# sourceMappingURL=cache-headers.js.map