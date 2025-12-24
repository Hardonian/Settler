/**
 * Event Bus
 * 
 * Internal event bus for platform coordination
 * Part of Phase VIII: Future-Proof Architecture
 */

import { EventEmitter } from 'events';
import { logInfo, logError } from '../../utils/logger';

export type EventType =
  | 'recon.completed'
  | 'recon.failed'
  | 'validation.failed'
  | 'mapping.suggested'
  | 'drift.detected'
  | 'workflow.failed'
  | 'audit.ready'
  | 'contract.breaking_change'
  | 'usage.limit_exceeded'
  | 'agent.fallback'
  | 'value.reconciliation_completed'
  | 'value.errors_prevented';

export interface PlatformEvent {
  id: string;
  type: EventType;
  tenantId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: PlatformEvent) => Promise<void> | void;

export class EventBus extends EventEmitter {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  /**
   * Subscribe to event type
   */
  subscribe(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Publish event
   */
  async publish(event: PlatformEvent): Promise<void> {
    try {
      logInfo('Event published', { eventType: event.type, eventId: event.id });

      // Emit to EventEmitter for backward compatibility
      this.emit(event.type, event);

      // Call registered handlers
      const handlers = this.handlers.get(event.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            logError('Event handler failed', { error, eventType: event.type, eventId: event.id });
          }
        }
      }

      // Also call wildcard handlers
      const wildcardHandlers = this.handlers.get('*' as EventType);
      if (wildcardHandlers) {
        for (const handler of wildcardHandlers) {
          try {
            await handler(event);
          } catch (error) {
            logError('Wildcard event handler failed', { error, eventType: event.type });
          }
        }
      }
    } catch (error) {
      logError('Failed to publish event', { error, event });
      throw error;
    }
  }

  /**
   * Create and publish event
   */
  async emitEvent(
    type: EventType,
    tenantId: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const event: PlatformEvent = {
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

// Singleton instance
export const eventBus = new EventBus();
