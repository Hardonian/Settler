/**
 * Event Bus
 *
 * Internal event bus for platform coordination
 * Part of Phase VIII: Future-Proof Architecture
 */
import { EventEmitter } from 'events';
export type EventType = 'recon.completed' | 'recon.failed' | 'validation.failed' | 'mapping.suggested' | 'drift.detected' | 'workflow.failed' | 'audit.ready' | 'contract.breaking_change' | 'usage.limit_exceeded' | 'agent.fallback';
export interface PlatformEvent {
    id: string;
    type: EventType;
    tenantId: string;
    timestamp: Date;
    data: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export type EventHandler = (event: PlatformEvent) => Promise<void> | void;
export declare class EventBus extends EventEmitter {
    private handlers;
    /**
     * Subscribe to event type
     */
    subscribe(eventType: EventType, handler: EventHandler): () => void;
    /**
     * Publish event
     */
    publish(event: PlatformEvent): Promise<void>;
    /**
     * Create and publish event
     */
    emitEvent(type: EventType, tenantId: string, data: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void>;
}
export declare const eventBus: EventBus;
//# sourceMappingURL=event-bus.d.ts.map