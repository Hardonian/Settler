"use strict";
/**
 * Request Context Middleware
 *
 * Integrates request ID, tenant ID, and user ID into AsyncLocalStorage
 * for automatic propagation through the entire request lifecycle.
 *
 * This enables:
 * - Automatic request ID in all logs without passing it explicitly
 * - Tenant context for multi-tenant isolation
 * - User context for audit trails
 *
 * Usage:
 *   app.use(requestIdMiddleware());
 *   app.use(contextMiddleware);
 *
 * All subsequent logs will automatically include request_id, tenant_id, and user_id.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMiddleware = contextMiddleware;
exports.getCurrentContext = getCurrentContext;
exports.setContextValue = setContextValue;
const logger_1 = require("../utils/logger");
/**
 * Context middleware - stores request context in AsyncLocalStorage
 *
 * Must be used after requestIdMiddleware and authMiddleware
 */
function contextMiddleware(req, _res, next) {
    const context = {
        requestId: req.requestId,
        tenantId: req.tenantId, // Set by auth middleware
        userId: req.userId, // Set by auth middleware
        traceId: req.traceId,
        executionId: req.executionId,
    };
    // Run the rest of the request handling in this context
    logger_1.requestContext.run(context, () => {
        next();
    });
}
/**
 * Get current request context
 *
 * Returns undefined if called outside of a request context
 */
function getCurrentContext() {
    return logger_1.requestContext.getStore();
}
/**
 * Set additional context values during request processing
 *
 * Usage:
 *   setContextValue('jobId', job.id);
 *   setContextValue('executionId', execution.id);
 */
function setContextValue(key, value) {
    const context = logger_1.requestContext.getStore();
    if (context) {
        context[key] = value;
    }
}
//# sourceMappingURL=context.js.map