"use strict";
/**
 * Event Bus Implementation
 * Simple in-memory event bus (can be replaced with Redis/RabbitMQ in production)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const logger_1 = require("../../utils/logger");
class EventBus {
    handlers = new Map();
    async publish(event) {
        const eventName = event.eventName;
        const handlers = this.handlers.get(eventName) || [];
        (0, logger_1.logInfo)('Publishing domain event', {
            eventName,
            eventId: event.eventId,
            handlersCount: handlers.length,
        });
        // Execute all handlers in parallel
        await Promise.allSettled(handlers.map(async (handler) => {
            try {
                await handler(event);
            }
            catch (error) {
                (0, logger_1.logError)('Event handler failed', error, {
                    eventName,
                    eventId: event.eventId,
                });
            }
        }));
    }
    subscribe(eventName, handler) {
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        this.handlers.get(eventName).push(handler);
        (0, logger_1.logInfo)('Subscribed to event', { eventName });
    }
}
exports.EventBus = EventBus;
//# sourceMappingURL=EventBus.js.map