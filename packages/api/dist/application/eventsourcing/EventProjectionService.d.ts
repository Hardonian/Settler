/**
 * Event Projection Service
 * Wires up event handlers to update projections
 */
import { IEventBus } from '../../infrastructure/events/IEventBus';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { EventEnvelope } from '../../domain/eventsourcing/EventEnvelope';
export declare class EventProjectionService {
    private eventBus;
    private eventStore;
    private projectionHandlers;
    constructor(eventBus: IEventBus, eventStore: IEventStore);
    private setupEventHandlers;
    /**
     * Process event envelope and update projections
     */
    processEvent(eventEnvelope: EventEnvelope): Promise<void>;
}
//# sourceMappingURL=EventProjectionService.d.ts.map