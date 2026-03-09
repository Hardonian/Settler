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

import { Request, Response, NextFunction } from "express";
import { requestContext } from "../utils/logger";

/**
 * Context middleware - stores request context in AsyncLocalStorage
 *
 * Must be used after requestIdMiddleware and authMiddleware
 */
export function contextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const context = {
    requestId: req.requestId,
    tenantId: (req as any).tenantId, // Set by auth middleware
    userId: (req as any).userId, // Set by auth middleware
    traceId: (req as any).traceId,
    executionId: (req as any).executionId,
  };

  // Run the rest of the request handling in this context
  requestContext.run(context, () => {
    next();
  });
}

/**
 * Get current request context
 *
 * Returns undefined if called outside of a request context
 */
export function getCurrentContext() {
  return requestContext.getStore();
}

/**
 * Set additional context values during request processing
 *
 * Usage:
 *   setContextValue('jobId', job.id);
 *   setContextValue('executionId', execution.id);
 */
export function setContextValue(key: string, value: string | undefined): void {
  const context = requestContext.getStore();
  if (context) {
    (context as any)[key] = value;
  }
}
