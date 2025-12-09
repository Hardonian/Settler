"use strict";
/**
 * Event Tracking Utility
 * Tracks business events for analytics, dashboards, and product insights
 * Part of Operator-in-a-Box blueprint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = trackEvent;
exports.trackEventAsync = trackEventAsync;
exports.trackEvents = trackEvents;
const db_1 = require("../db");
const logger_1 = require("./logger");
/**
 * Track a business event
 * @param userId - User ID (optional, can be null for anonymous events)
 * @param eventName - Event name (e.g., 'APIKeyCreated', 'ReconciliationSuccess')
 * @param properties - Event properties (JSON-serializable)
 * @param tenantId - Tenant ID (optional, inferred from userId if not provided)
 */
async function trackEvent(userId, eventName, properties = {}, tenantId) {
    try {
        // Infer tenant_id from user_id if not provided
        let finalTenantId = tenantId;
        if (!finalTenantId && userId) {
            const users = await (0, db_1.query)(`SELECT tenant_id FROM users WHERE id = $1 LIMIT 1`, [userId]);
            if (users.length > 0 && users[0]) {
                finalTenantId = users[0].tenant_id || undefined;
            }
        }
        await (0, db_1.query)(`INSERT INTO events (user_id, tenant_id, event_name, properties, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`, [
            userId,
            finalTenantId || null,
            eventName,
            JSON.stringify(properties),
        ]);
    }
    catch (error) {
        // Don't throw - event tracking should never break the main flow
        (0, logger_1.logError)('Failed to track event', error, {
            userId,
            eventName,
            properties,
        });
    }
}
/**
 * Track event synchronously (fire and forget)
 * Use this when you don't need to wait for the event to be stored
 */
function trackEventAsync(userId, eventName, properties = {}, tenantId) {
    // Fire and forget - don't await
    trackEvent(userId, eventName, properties, tenantId).catch(() => {
        // Already logged in trackEvent
    });
}
/**
 * Track multiple events in a batch
 */
async function trackEvents(events) {
    if (events.length === 0)
        return;
    try {
        const values = [];
        const placeholders = [];
        let paramCount = 1;
        for (const event of events) {
            placeholders.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, NOW())`);
            values.push(event.userId, event.tenantId || null, event.eventName, JSON.stringify(event.properties || {}));
        }
        await (0, db_1.query)(`INSERT INTO events (user_id, tenant_id, event_name, properties, timestamp)
       VALUES ${placeholders.join(', ')}`, values);
    }
    catch (error) {
        (0, logger_1.logError)('Failed to track events batch', error, { eventCount: events.length });
    }
}
//# sourceMappingURL=event-tracker.js.map