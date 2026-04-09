/**
 * Event Tracking Middleware
 * Automatically tracks common events like API calls, page views, etc.
 * Part of Operator-in-a-Box blueprint
 */

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { trackEventAsync } from "../utils/event-tracker";

/**
 * Track API call events
 */
export function eventTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Track after response is sent (don't block request)
  const originalSend = res.send;
  res.send = function (body: unknown) {
    // Track API call event
    const authReq = req as AuthRequest;
    if (authReq.userId) {
      trackEventAsync(authReq.userId, "APICall", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.headers["user-agent"],
      });
    }

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Track page view events (for web UI)
 */
export function trackPageView(page: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (authReq.userId) {
      trackEventAsync(authReq.userId, "PageViewed", {
        page,
        referrer: req.headers.referer,
        userAgent: req.headers["user-agent"],
      });
    }
    next();
  };
}
