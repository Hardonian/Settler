"use strict";
/**
 * Event Projection Service
 * Wires up event handlers to update projections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventProjectionService = void 0;
const ReconciliationProjections_1 = require("../cqrs/projections/ReconciliationProjections");
const ReconciliationLifecycle_1 = require("../../domain/eventsourcing/reconciliation/ReconciliationLifecycle");
class EventProjectionService {
    eventBus;
    eventStore;
    projectionHandlers;
    constructor(eventBus, eventStore) {
        this.eventBus = eventBus;
        this.eventStore = eventStore;
        this.projectionHandlers = new ReconciliationProjections_1.ReconciliationProjectionHandlers();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.eventBus.subscribe("reconciliation.started", async (event) => {
            const events = await this.eventStore.getEvents(event.reconciliationId, "reconciliation");
            const startedEvent = events.find((e) => e.event_type === "ReconciliationStarted");
            if (startedEvent) {
                await this.projectionHandlers.handleReconciliationStarted(event);
            }
        });
    }
    /**
     * Process event envelope and update projections
     */
    async processEvent(eventEnvelope) {
        if (eventEnvelope.aggregate_type === "reconciliation") {
            const history = await this.eventStore.getEvents(eventEnvelope.aggregate_id, "reconciliation");
            (0, ReconciliationLifecycle_1.assertTenantInvariant)(history, eventEnvelope.metadata.tenant_id);
            (0, ReconciliationLifecycle_1.assertCompletionDataInvariant)(eventEnvelope);
            (0, ReconciliationLifecycle_1.assertProjectionMutationInvariant)(history, eventEnvelope);
        }
        switch (eventEnvelope.event_type) {
            case "ReconciliationStarted":
                await this.projectionHandlers.handleReconciliationStarted(eventEnvelope);
                break;
            case "ReconciliationPaused":
                await this.projectionHandlers.handleReconciliationPaused(eventEnvelope);
                break;
            case "ReconciliationResumed":
                await this.projectionHandlers.handleReconciliationResumed(eventEnvelope);
                break;
            case "OrdersFetched":
                await this.projectionHandlers.handleOrdersFetched(eventEnvelope);
                break;
            case "PaymentsFetched":
                await this.projectionHandlers.handlePaymentsFetched(eventEnvelope);
                break;
            case "RecordMatched":
                await this.projectionHandlers.handleRecordMatched(eventEnvelope);
                break;
            case "RecordUnmatched":
                await this.projectionHandlers.handleRecordUnmatched(eventEnvelope);
                break;
            case "ReconciliationCompleted":
                await this.projectionHandlers.handleReconciliationCompleted(eventEnvelope);
                break;
            case "ReconciliationFailed":
                await this.projectionHandlers.handleReconciliationFailed(eventEnvelope);
                break;
        }
    }
}
exports.EventProjectionService = EventProjectionService;
//# sourceMappingURL=EventProjectionService.js.map