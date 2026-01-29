"use strict";
/**
 * Middleware system for request/response interception and transformation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareChain = void 0;
exports.createLoggingMiddleware = createLoggingMiddleware;
exports.createMetricsMiddleware = createMetricsMiddleware;
/**
 * Middleware chain executor
 */
class MiddlewareChain {
    middlewares = [];
    /**
     * Adds a middleware to the chain
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }
    /**
     * Executes the middleware chain
     */
    async execute(context, handler) {
        let index = 0;
        const next = async () => {
            if (index >= this.middlewares.length) {
                return handler(context);
            }
            const middleware = this.middlewares[index++];
            if (!middleware) {
                return handler(context);
            }
            return middleware(context, next);
        };
        return next();
    }
}
exports.MiddlewareChain = MiddlewareChain;
/**
 * Built-in middleware for logging requests and responses
 */
function createLoggingMiddleware(logger) {
    const log = logger?.info || console.log;
    const logError = logger?.error || console.error;
    return async (context, next) => {
        const startTime = Date.now();
        log(`[Settler SDK] ${context.method} ${context.path}`, {
            method: context.method,
            path: context.path,
            headers: context.headers,
        });
        try {
            const response = await next();
            const duration = Date.now() - startTime;
            log(`[Settler SDK] ${context.method} ${context.path} ${response.status} (${duration}ms)`, {
                method: context.method,
                path: context.path,
                status: response.status,
                duration,
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logError(`[Settler SDK] ${context.method} ${context.path} ERROR (${duration}ms)`, {
                method: context.method,
                path: context.path,
                error,
                duration,
            });
            throw error;
        }
    };
}
/**
 * Built-in middleware for metrics collection
 */
function createMetricsMiddleware(metrics) {
    return async (context, next) => {
        const startTime = Date.now();
        metrics?.increment?.("settler.request.started", {
            method: context.method,
            path: context.path,
        });
        try {
            const response = await next();
            const duration = Date.now() - startTime;
            metrics?.histogram?.("settler.request.duration", duration, {
                method: context.method,
                path: context.path,
                status: String(response.status),
            });
            metrics?.increment?.("settler.request.completed", {
                method: context.method,
                path: context.path,
                status: String(response.status),
            });
            return response;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            metrics?.histogram?.("settler.request.duration", duration, {
                method: context.method,
                path: context.path,
                status: "error",
            });
            metrics?.increment?.("settler.request.failed", {
                method: context.method,
                path: context.path,
            });
            throw error;
        }
    };
}
//# sourceMappingURL=middleware.js.map