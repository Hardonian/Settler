/**
 * Event Bus Implementation
 * Simple in-memory event bus (can be replaced with Redis/RabbitMQ in production)
 */

import { DomainEvent } from "../../domain/events/DomainEvent";
import { IEventBus } from "./IEventBus";
import { logInfo, logError } from "../../utils/logger";

type EventHandler = (event: DomainEvent) => Promise<void>;

export class EventBus implements IEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.eventName;
    const handlers = this.handlers.get(eventName) || [];

    logInfo("Publishing domain event", {
      eventName,
      eventId: event.eventId,
      handlersCount: handlers.length,
    });

    // Execute all handlers in parallel
    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          logError("Event handler failed", error, {
            eventName,
            eventId: event.eventId,
          });
        }
      })
    );
  }

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    this.handlers.get(eventName)!.push(handler);
    logInfo("Subscribed to event", { eventName });
  }
}
