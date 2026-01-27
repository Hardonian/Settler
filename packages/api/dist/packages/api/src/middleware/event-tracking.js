"use strict";
/**
 * Event Tracking Middleware
 * Automatically tracks common events like API calls, page views, etc.
 * Part of Operator-in-a-Box blueprint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventTrackingMiddleware = eventTrackingMiddleware;
exports.trackPageView = trackPageView;
const event_tracker_1 = require("../utils/event-tracker");
/**
 * Track API call events
 */
function eventTrackingMiddleware(req, res, next) {
    // Track after response is sent (don't block request)
    const originalSend = res.send;
    res.send = function (body) {
        // Track API call event
        const authReq = req;
        if (authReq.userId) {
            (0, event_tracker_1.trackEventAsync)(authReq.userId, 'APICall', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userAgent: req.headers['user-agent'],
            });
        }
        return originalSend.call(this, body);
    };
    next();
}
/**
 * Track page view events (for web UI)
 */
function trackPageView(page) {
    return (req, _res, next) => {
        const authReq = req;
        if (authReq.userId) {
            (0, event_tracker_1.trackEventAsync)(authReq.userId, 'PageViewed', {
                page,
                referrer: req.headers.referer,
                userAgent: req.headers['user-agent'],
            });
        }
        next();
    };
}
//# sourceMappingURL=event-tracking.js.map