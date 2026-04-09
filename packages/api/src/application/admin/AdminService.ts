/**
 * Admin Service
 * Provides admin/debug endpoints for inspecting and managing sagas and events
 */

import { SagaOrchestrator } from "../sagas/SagaOrchestrator";
import { IEventStore } from "../../infrastructure/eventsourcing/EventStore";
import { DeadLetterQueue } from "../../infrastructure/resilience/DeadLetterQueue";
import { EventEnvelope } from "../../domain/eventsourcing/EventEnvelope";

export class AdminService {
  constructor(
    private sagaOrchestrator: SagaOrchestrator,
    private eventStore: IEventStore,
    private deadLetterQueue: DeadLetterQueue
  ) {}

  /**
   * Get saga status
   */
  async getSagaStatus(sagaId: string, sagaType: string) {
    return await this.sagaOrchestrator.getSagaStatus(sagaId, sagaType);
  }

  /**
   * List all events for an aggregate
   */
  async listEventsForAggregate(
    aggregateId: string,
    aggregateType: string
  ): Promise<EventEnvelope[]> {
    return await this.eventStore.getEvents(aggregateId, aggregateType);
  }

  /**
   * List events by correlation ID
   */
  async listEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]> {
    return await this.eventStore.getEventsByCorrelationId(correlationId);
  }

  /**
   * Resume a saga
   */
  async resumeSaga(sagaId: string, sagaType: string): Promise<void> {
    await this.sagaOrchestrator.resumeSaga(sagaId, sagaType);
  }

  /**
   * Retry a saga
   */
  async retrySaga(sagaId: string, sagaType: string): Promise<void> {
    // Retry is same as resume for now
    await this.sagaOrchestrator.resumeSaga(sagaId, sagaType);
  }

  /**
   * Cancel a saga
   */
  async cancelSaga(sagaId: string, sagaType: string): Promise<void> {
    await this.sagaOrchestrator.cancelSaga(sagaId, sagaType);
  }

  /**
   * Get dead letter queue entries
   */
  async getDeadLetterQueueEntries(tenantId?: string, limit: number = 100) {
    if (tenantId) {
      return await this.deadLetterQueue.getEntriesByTenant(tenantId, limit);
    }
    return await this.deadLetterQueue.getUnresolvedEntries(limit);
  }

  /**
   * Resolve a dead letter queue entry
   */
  async resolveDeadLetterEntry(id: string, resolutionNotes?: string): Promise<void> {
    await this.deadLetterQueue.resolveEntry(id, resolutionNotes);
  }

  /**
   * Dry-run reconciliation using historical events
   */
  async dryRunReconciliation(
    _reconciliationId: string,
    events: EventEnvelope[]
  ): Promise<{
    matched: number;
    unmatched: number;
    errors: number;
  }> {
    // Replay events to simulate reconciliation
    let matched = 0;
    let unmatched = 0;
    let errors = 0;

    for (const event of events) {
      switch (event.event_type) {
        case "RecordMatched":
          matched++;
          break;
        case "RecordUnmatched":
          unmatched++;
          break;
        case "ReconciliationFailed":
          errors++;
          break;
      }
    }

    return { matched, unmatched, errors };
  }
}
