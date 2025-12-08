/**
 * Event Bus Interface
 * Defines the contract for publishing domain events
 */

import { DomainEvent } from '../../domain/events/DomainEvent';

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(
    eventName: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void;
}
