/**
 * Event Bus Implementation
 * Simple in-memory event bus (can be replaced with Redis/RabbitMQ in production)
 */
import { DomainEvent } from '../../domain/events/DomainEvent';
import { IEventBus } from './IEventBus';
type EventHandler = (event: DomainEvent) => Promise<void>;
export declare class EventBus implements IEventBus {
    private handlers;
    publish(event: DomainEvent): Promise<void>;
    subscribe(eventName: string, handler: EventHandler): void;
}
export {};
//# sourceMappingURL=EventBus.d.ts.map