"use strict";
/**
 * Analytics Event Tracking Service
 * Tracks user events for growth analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = trackEvent;
exports.trackActivationEvent = trackActivationEvent;
exports.trackConversionEvent = trackConversionEvent;
exports.trackUsageEvent = trackUsageEvent;
exports.trackFeatureAccess = trackFeatureAccess;
exports.trackEvents = trackEvents;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Track an analytics event
 */
async function trackEvent(userId, event, properties) {
    try {
        await (0, db_1.query)(`INSERT INTO analytics_events (user_id, event, properties, created_at)
       VALUES ($1, $2, $3, NOW())`, [userId, event, properties ? JSON.stringify(properties) : null]);
        (0, logger_1.logInfo)("Event tracked", { userId, event, properties });
    }
    catch (error) {
        // Don't throw - analytics is non-critical
        (0, logger_1.logInfo)("Failed to track event", {
            userId,
            event,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
/**
 * Track activation event
 */
async function trackActivationEvent(userId, step, additionalProperties) {
    await trackEvent(userId, "onboarding.step_completed", {
        step,
        ...additionalProperties,
    });
}
/**
 * Track conversion event
 */
async function trackConversionEvent(userId, event, properties) {
    await trackEvent(userId, `conversion.${event}`, properties);
}
/**
 * Track usage event
 */
async function trackUsageEvent(userId, metricType, value, additionalProperties) {
    await trackEvent(userId, "usage.metric", {
        metric_type: metricType,
        value,
        ...additionalProperties,
    });
}
/**
 * Track feature access event
 */
async function trackFeatureAccess(userId, feature, accessed, planType) {
    await trackEvent(userId, accessed ? "feature.accessed" : "feature.locked", {
        feature,
        plan_type: planType,
    });
}
/**
 * Batch track events (for performance)
 */
async function trackEvents(events) {
    if (events.length === 0)
        return;
    try {
        const values = events
            .map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3}, NOW())`)
            .join(", ");
        const params = events.flatMap((e) => [
            e.userId,
            e.event,
            e.properties ? JSON.stringify(e.properties) : null,
        ]);
        await (0, db_1.query)(`INSERT INTO analytics_events (user_id, event, properties, created_at)
       VALUES ${values}`, params);
        (0, logger_1.logInfo)("Batch events tracked", { count: events.length });
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to track batch events", {
            count: events.length,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
//# sourceMappingURL=events.js.map