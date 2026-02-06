"use strict";
/**
 * Route Helper Utilities
 * Provides utilities for mounting routes consistently
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountVersionedRoutes = mountVersionedRoutes;
exports.mountRoute = mountRoute;
/**
 * Mount routes for both v1 and v2 API versions with consistent middleware
 *
 * @param app - Express app instance
 * @param path - Route path (e.g., '/jobs', '/reports')
 * @param router - Express router to mount
 * @param middleware - Middleware functions to apply (auth middleware is always applied)
 *
 * @example
 * ```typescript
 * mountVersionedRoutes(app, '/jobs', jobsRouter, authMiddleware, rateLimitMiddleware());
 * ```
 */
function mountVersionedRoutes(app, path, router, ...middleware) {
    app.use(`/api/v1${path}`, ...middleware, router);
    app.use(`/api/v2${path}`, ...middleware, router);
}
/**
 * Mount routes for a single API version
 *
 * @param app - Express app instance
 * @param version - API version ('v1' or 'v2')
 * @param path - Route path
 * @param router - Express router to mount
 * @param middleware - Middleware functions to apply
 */
function mountRoute(app, version, path, router, ...middleware) {
    app.use(`/api/${version}${path}`, ...middleware, router);
}
//# sourceMappingURL=route-helpers.js.map