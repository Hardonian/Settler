"use strict";
/**
 * Event Bus
 *
 * Internal event bus for platform coordination
 * Part of Phase VIII: Future-Proof Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class EventBus extends events_1.EventEmitter {
    handlers = new Map();
    /**
     * Subscribe to event type
     */
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        // Return unsubscribe function
        return () => {
            this.handlers.get(eventType)?.delete(handler);
        };
    }
    /**
     * Publish event
     */
    async publish(event) {
        try {
            (0, logger_1.logInfo)('Event published', { eventType: event.type, eventId: event.id });
            // Emit to EventEmitter for backward compatibility
            this.emit(event.type, event);
            // Call registered handlers
            const handlers = this.handlers.get(event.type);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        await handler(event);
                    }
                    catch (error) {
                        (0, logger_1.logError)('Event handler failed', { error, eventType: event.type, eventId: event.id });
                    }
                }
            }
            // Also call wildcard handlers
            const wildcardHandlers = this.handlers.get('*');
            if (wildcardHandlers) {
                for (const handler of wildcardHandlers) {
                    try {
                        await handler(event);
                    }
                    catch (error) {
                        (0, logger_1.logError)('Wildcard event handler failed', { error, eventType: event.type });
                    }
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)('Failed to publish event', { error, event });
            throw error;
        }
    }
    /**
     * Create and publish event
     */
    async emitEvent(type, tenantId, data, metadata) {
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            tenantId,
            timestamp: new Date(),
            data,
            ...(metadata !== undefined && { metadata }),
        };
        await this.publish(event);
    }
}
exports.EventBus = EventBus;
// Singleton instance
exports.eventBus = new EventBus();
//# sourceMappingURL=event-bus.js.map