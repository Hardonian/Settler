"use strict";
/**
 * Reconciliation Domain Events
 * Core lifecycle events for reconciliation flows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationEvents = void 0;
const EventEnvelope_1 = require("../EventEnvelope");
// ============================================================================
// Event Factory Functions
// ============================================================================
class ReconciliationEvents {
    static ReconciliationStarted(reconciliationId, data, tenantId, userId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'ReconciliationStarted', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, userId, correlationId), 1);
    }
    static OrdersFetched(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'OrdersFetched', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
    static PaymentsFetched(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'PaymentsFetched', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
    static RecordMatched(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'RecordMatched', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
    static RecordUnmatched(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'RecordUnmatched', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
    static ReconciliationCompleted(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'ReconciliationCompleted', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
    static ReconciliationFailed(reconciliationId, data, tenantId, correlationId) {
        return (0, EventEnvelope_1.createEventEnvelope)(reconciliationId, 'reconciliation', 'ReconciliationFailed', data, (0, EventEnvelope_1.createEventMetadata)(tenantId, undefined, correlationId), 1);
    }
}
exports.ReconciliationEvents = ReconciliationEvents;
//# sourceMappingURL=ReconciliationEvents.js.map