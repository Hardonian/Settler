"use strict";
/**
 * Event Envelope
 * Standard event envelope for event sourcing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventMetadata = createEventMetadata;
exports.createEventEnvelope = createEventEnvelope;
/**
 * Helper to create event metadata
 */
function createEventMetadata(tenantId, userId, correlationId, causationId) {
    const metadata = {
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        correlation_id: correlationId || crypto.randomUUID(),
    };
    if (userId !== undefined) {
        metadata.user_id = userId;
    }
    if (causationId !== undefined) {
        metadata.causation_id = causationId;
    }
    return metadata;
}
/**
 * Helper to create event envelope
 */
function createEventEnvelope(aggregateId, aggregateType, eventType, data, metadata, eventVersion = 1) {
    return {
        id: crypto.randomUUID(),
        aggregate_id: aggregateId,
        aggregate_type: aggregateType,
        event_type: eventType,
        event_version: eventVersion,
        data,
        metadata,
        created_at: new Date(),
    };
}
//# sourceMappingURL=EventEnvelope.js.map