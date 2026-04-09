/**
 * Request Timeout Middleware
 * Ensures requests don't hang indefinitely
 */

import { Request, Response, NextFunction } from "express";
// Config import removed - not used
import { logWarn } from "../utils/logger";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_TIMEOUT = 300000; // 5 minutes

interface TimeoutRequest extends Request {
  timeout?: NodeJS.Timeout;
  startTime?: number;
}

/**
 * Request timeout middleware
 * Automatically cancels requests that exceed the timeout
 */
export function requestTimeoutMiddleware(timeoutMs: number = DEFAULT_TIMEOUT) {
  return (req: TimeoutRequest, res: Response, next: NextFunction): void => {
    // Skip timeout for health checks and metrics
    if (req.path === "/health" || req.path === "/metrics") {
      return next();
    }

    // Validate timeout
    const timeout = Math.min(Math.max(timeoutMs, 1000), MAX_TIMEOUT);

    req.startTime = Date.now();

    // Set timeout
    req.timeout = setTimeout(() => {
      if (!res.headersSent) {
        logWarn("Request timeout", {
          method: req.method,
          path: req.path,
          timeout: timeout,
          duration: Date.now() - (req.startTime || 0),
        });

        res.status(408).json({
          error: "Request Timeout",
          message: `Request exceeded timeout of ${timeout}ms`,
          timeout: timeout,
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) {
      if (req.timeout) {
        clearTimeout(req.timeout);
      }
      if (encoding !== undefined && typeof encoding === "string") {
        originalEnd(chunk, encoding, cb);
      } else if (cb !== undefined) {
        originalEnd(chunk, cb);
      } else {
        originalEnd(chunk);
      }
    } as typeof originalEnd;

    next();
  };
}

/**
 * Get request timeout based on route
 */
export function getRequestTimeout(path: string, method: string): number {
  // Longer timeout for reconciliation jobs
  if (path.includes("/jobs") && method === "POST") {
    return 60000; // 60 seconds
  }

  // Longer timeout for reports
  if (path.includes("/reports") && method === "GET") {
    return 45000; // 45 seconds
  }

  // Default timeout
  return DEFAULT_TIMEOUT;
}
