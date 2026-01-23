/**
 * Request ID Middleware
 *
 * Generates and propagates unique request IDs for distributed tracing and debugging.
 *
 * Features:
 * - Accepts existing X-Request-ID headers from clients/proxies
 * - Generates new IDs if not provided (UUID v4)
 * - Propagates to response headers for client-side correlation
 * - Stores in req.requestId for use in logging and error handling
 *
 * Critical for:
 * - Production debugging at 02:13 AM
 * - Distributed tracing across services
 * - Client error reporting correlation
 * - Support ticket investigation
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Request ID middleware
 *
 * Usage:
 *   app.use(requestIdMiddleware());
 *
 * The request ID is available as:
 *   - req.requestId in route handlers
 *   - X-Request-ID in response headers
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Try to get existing request ID from headers (from client, load balancer, or proxy)
    const existingId =
      req.get('X-Request-ID') ||
      req.get('X-Request-Id') ||
      req.get('x-request-id') ||
      req.get('X-Correlation-ID') ||
      req.get('X-Correlation-Id');

    // Generate new ID if not provided
    const requestId = existingId || randomUUID();

    // Store on request object for use in handlers and logging
    req.requestId = requestId;

    // Set response header for client-side correlation
    res.setHeader('X-Request-ID', requestId);

    next();
  };
}

/**
 * Get request ID from current request
 * Safe accessor that returns undefined if not available
 */
export function getRequestId(req: Request): string | undefined {
  return req.requestId;
}

/**
 * Validate request ID format
 * Returns true if ID is a valid UUID v4
 */
export function isValidRequestId(id: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}
