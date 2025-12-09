/**
 * Admin Service
 * Provides admin/debug endpoints for inspecting and managing sagas and events
 */
import { SagaOrchestrator } from '../sagas/SagaOrchestrator';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { DeadLetterQueue } from '../../infrastructure/resilience/DeadLetterQueue';
import { EventEnvelope } from '../../domain/eventsourcing/EventEnvelope';
export declare class AdminService {
    private sagaOrchestrator;
    private eventStore;
    private deadLetterQueue;
    constructor(sagaOrchestrator: SagaOrchestrator, eventStore: IEventStore, deadLetterQueue: DeadLetterQueue);
    /**
     * Get saga status
     */
    getSagaStatus(sagaId: string, sagaType: string): Promise<import("../sagas/SagaOrchestrator").SagaState | null>;
    /**
     * List all events for an aggregate
     */
    listEventsForAggregate(aggregateId: string, aggregateType: string): Promise<EventEnvelope[]>;
    /**
     * List events by correlation ID
     */
    listEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]>;
    /**
     * Resume a saga
     */
    resumeSaga(sagaId: string, sagaType: string): Promise<void>;
    /**
     * Retry a saga
     */
    retrySaga(sagaId: string, sagaType: string): Promise<void>;
    /**
     * Cancel a saga
     */
    cancelSaga(sagaId: string, sagaType: string): Promise<void>;
    /**
     * Get dead letter queue entries
     */
    getDeadLetterQueueEntries(tenantId?: string, limit?: number): Promise<import("../../infrastructure/resilience/DeadLetterQueue").DeadLetterEntry[]>;
    /**
     * Resolve a dead letter queue entry
     */
    resolveDeadLetterEntry(id: string, resolutionNotes?: string): Promise<void>;
    /**
     * Dry-run reconciliation using historical events
     */
    dryRunReconciliation(_reconciliationId: string, events: EventEnvelope[]): Promise<{
        matched: number;
        unmatched: number;
        errors: number;
    }>;
}
//# sourceMappingURL=AdminService.d.ts.map