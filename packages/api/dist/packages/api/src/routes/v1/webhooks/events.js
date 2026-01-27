"use strict";
/**
 * Webhook Events API
 *
 * Endpoints for discovering available webhook events
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_registry_1 = require("../../../services/webhooks/event-registry");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/webhooks/events
 * List all available webhook events
 */
router.get('/events', async (_req, res) => {
    const events = (0, event_registry_1.getPublicEvents)();
    res.json({
        data: events.map(event => ({
            type: event.type,
            description: event.description,
            schema: event.schema,
            since: event.since,
            deprecated: event.deprecated,
        })),
        count: events.length,
    });
});
/**
 * GET /api/v1/webhooks/events/:eventType
 * Get details for a specific event type
 */
router.get('/events/:eventType', async (req, res) => {
    const { eventType } = req.params;
    if (!eventType || !(0, event_registry_1.isValidEventType)(eventType)) {
        res.status(400).json({
            error: 'INVALID_EVENT_TYPE',
            message: `Unknown event type: ${eventType || 'undefined'}`,
        });
        return;
    }
    const metadata = (0, event_registry_1.getEventMetadata)(eventType);
    if (!metadata) {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Event type not found: ${eventType}`,
        });
        return;
    }
    if (!metadata.public) {
        res.status(403).json({
            error: 'FORBIDDEN',
            message: 'This event type is not available for public subscription',
        });
        return;
    }
    res.json({
        data: {
            type: metadata.type,
            description: metadata.description,
            schema: metadata.schema,
            since: metadata.since,
            deprecated: metadata.deprecated,
        },
    });
});
exports.default = router;
//# sourceMappingURL=events.js.map