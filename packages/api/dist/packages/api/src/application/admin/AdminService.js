"use strict";
/**
 * Admin Service
 * Provides admin/debug endpoints for inspecting and managing sagas and events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
class AdminService {
    sagaOrchestrator;
    eventStore;
    deadLetterQueue;
    constructor(sagaOrchestrator, eventStore, deadLetterQueue) {
        this.sagaOrchestrator = sagaOrchestrator;
        this.eventStore = eventStore;
        this.deadLetterQueue = deadLetterQueue;
    }
    /**
     * Get saga status
     */
    async getSagaStatus(sagaId, sagaType) {
        return await this.sagaOrchestrator.getSagaStatus(sagaId, sagaType);
    }
    /**
     * List all events for an aggregate
     */
    async listEventsForAggregate(aggregateId, aggregateType) {
        return await this.eventStore.getEvents(aggregateId, aggregateType);
    }
    /**
     * List events by correlation ID
     */
    async listEventsByCorrelationId(correlationId) {
        return await this.eventStore.getEventsByCorrelationId(correlationId);
    }
    /**
     * Resume a saga
     */
    async resumeSaga(sagaId, sagaType) {
        await this.sagaOrchestrator.resumeSaga(sagaId, sagaType);
    }
    /**
     * Retry a saga
     */
    async retrySaga(sagaId, sagaType) {
        // Retry is same as resume for now
        await this.sagaOrchestrator.resumeSaga(sagaId, sagaType);
    }
    /**
     * Cancel a saga
     */
    async cancelSaga(sagaId, sagaType) {
        await this.sagaOrchestrator.cancelSaga(sagaId, sagaType);
    }
    /**
     * Get dead letter queue entries
     */
    async getDeadLetterQueueEntries(tenantId, limit = 100) {
        if (tenantId) {
            return await this.deadLetterQueue.getEntriesByTenant(tenantId, limit);
        }
        return await this.deadLetterQueue.getUnresolvedEntries(limit);
    }
    /**
     * Resolve a dead letter queue entry
     */
    async resolveDeadLetterEntry(id, resolutionNotes) {
        await this.deadLetterQueue.resolveEntry(id, resolutionNotes);
    }
    /**
     * Dry-run reconciliation using historical events
     */
    async dryRunReconciliation(_reconciliationId, events) {
        // Replay events to simulate reconciliation
        let matched = 0;
        let unmatched = 0;
        let errors = 0;
        for (const event of events) {
            switch (event.event_type) {
                case 'RecordMatched':
                    matched++;
                    break;
                case 'RecordUnmatched':
                    unmatched++;
                    break;
                case 'ReconciliationFailed':
                    errors++;
                    break;
            }
        }
        return { matched, unmatched, errors };
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=AdminService.js.map