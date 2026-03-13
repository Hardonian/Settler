"use strict";
/**
 * Event Bus
 *
 * Internal event bus for platform coordination.
 * Uses a canonical event envelope with explicit versioning,
 * correlation and degraded-state signaling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
exports.adaptEventToVersion2 = adaptEventToVersion2;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const runtime_events_1 = require("../ops-intelligence/runtime-events");
const EVENT_TYPE_ALIASES = {
    "recon.completed": "reconciliation.completed",
    "recon.failed": "reconciliation.failed",
    "value.reconciliation_completed": "reconciliation.value.realized",
    "value.errors_prevented": "reconciliation.errors.prevented",
};
const EVENT_TYPES = new Set([
    "reconciliation.completed",
    "reconciliation.failed",
    "reconciliation.value.realized",
    "reconciliation.errors.prevented",
    "validation.failed",
    "mapping.suggested",
    "drift.detected",
    "workflow.failed",
    "audit.ready",
    "contract.breaking_change",
    "usage.limit_exceeded",
    "agent.fallback",
    "system.degraded",
    "alert.created",
    "alert.status.changed",
    "webhook.received",
    "webhook.rejected",
    "support.issue.created",
    "support.issue.linked",
    "replay.started",
    "replay.completed",
    "replay.failed",
    "stream.event.emitted",
    "operator.action.executed",
]);
function adaptEventToVersion2(event) {
    if ((event.eventVersion ?? 1) >= 2) {
        return event;
    }
    const payload = { ...event.payload };
    if (typeof payload.run_fingerprint === "string" && typeof payload.runFingerprint !== "string") {
        payload.runFingerprint = payload.run_fingerprint;
    }
    if (typeof payload.connector_id === "string" && typeof payload.connectorId !== "string") {
        payload.connectorId = payload.connector_id;
    }
    return {
        ...event,
        eventVersion: 2,
        metadata: {
            ...event.metadata,
            adapted_from_version: event.eventVersion ?? 1,
            payload_adapter: "v1_to_v2",
        },
        payload,
    };
}
class EventBus extends events_1.EventEmitter {
    handlers = new Map();
    sequence = 0;
    nextSequence() {
        this.sequence += 1;
        return this.sequence;
    }
    canonicalizeEventType(eventType) {
        const canonical = (EVENT_TYPE_ALIASES[eventType] ??
            eventType);
        if (EVENT_TYPES.has(canonical)) {
            return canonical;
        }
        return "system.degraded";
    }
    createEvent(eventType, tenantId, payload, options = {}) {
        const occurredAt = new Date().toISOString();
        const correlationId = options.correlationId ?? crypto.randomUUID();
        const canonicalType = this.canonicalizeEventType(eventType);
        const executionId = options.executionId ?? String(payload.executionId ?? payload.reconResultId ?? "unknown");
        const metadata = {
            ...(options.metadata ?? {}),
            producer_event_type: eventType,
        };
        const normalizedPayload = { ...payload };
        if (canonicalType === "system.degraded") {
            (0, logger_1.logWarn)("Unknown event type received; emitting system.degraded event", {
                eventType,
                tenantId,
                correlationId,
            });
            metadata.protocol_degraded = true;
            metadata.unknown_event_type = eventType;
            normalizedPayload.degraded_reason = "unknown_event_type";
            normalizedPayload.unknown_event_type = eventType;
        }
        return {
            eventId: crypto.randomUUID(),
            idempotencyKey: correlationId,
            tenantId,
            executionId,
            eventType: canonicalType,
            eventVersion: 1,
            sequence: this.nextSequence(),
            occurredAt,
            createdAt: occurredAt,
            source: options.source ?? "api.recon-core",
            severity: options.severity ?? (canonicalType === "system.degraded" ? "warning" : "info"),
            metadata,
            correlation: {
                correlationId,
                tenantId,
                traceId: options.traceId,
                causationId: options.causationId,
                runId: options.runId,
                executionId,
                actorId: options.actorId,
            },
            payload: normalizedPayload,
        };
    }
    async publishDegradedAudit(event) {
        if (event.eventType !== "system.degraded") {
            return;
        }
        if (process.env.NODE_ENV === "test") {
            return;
        }
        try {
            await (0, runtime_events_1.emitOperatorRuntimeEvent)({
                eventType: "error_thrown",
                tenantId: event.tenantId,
                runId: event.correlation.runId ?? event.executionId,
                metadata: {
                    source: event.source,
                    correlation_id: event.correlation.correlationId,
                    degraded_reason: event.payload.degraded_reason,
                    unknown_event_type: event.payload.unknown_event_type,
                    producer_event_type: event.metadata.producer_event_type,
                },
            });
        }
        catch (error) {
            (0, logger_1.logError)("Failed to publish degraded event audit", error, {
                eventId: event.eventId,
                tenantId: event.tenantId,
            });
        }
    }
    subscribe(eventType, handler) {
        const key = eventType === "*" ? "*" : this.canonicalizeEventType(eventType);
        if (!this.handlers.has(key)) {
            this.handlers.set(key, new Set());
        }
        this.handlers.get(key).add(handler);
        return () => {
            this.handlers.get(key)?.delete(handler);
        };
    }
    async publish(event) {
        try {
            (0, logger_1.logInfo)("Event published", {
                eventType: event.eventType,
                eventId: event.eventId,
                tenantId: event.tenantId,
                correlationId: event.correlation.correlationId,
            });
            this.emit(event.eventType, event);
            const handlers = this.handlers.get(event.eventType);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        await handler(event);
                    }
                    catch (error) {
                        (0, logger_1.logError)("Event handler failed", {
                            error,
                            eventType: event.eventType,
                            eventId: event.eventId,
                        });
                    }
                }
            }
            const wildcardHandlers = this.handlers.get("*");
            if (wildcardHandlers) {
                for (const handler of wildcardHandlers) {
                    try {
                        await handler(event);
                    }
                    catch (error) {
                        (0, logger_1.logError)("Wildcard event handler failed", {
                            error,
                            eventType: event.eventType,
                            eventId: event.eventId,
                        });
                    }
                }
            }
            await this.publishDegradedAudit(event);
        }
        catch (error) {
            (0, logger_1.logError)("Failed to publish event", {
                error,
                eventType: event.eventType,
                eventId: event.eventId,
            });
            throw error;
        }
    }
    async emitEvent(type, tenantId, payload, options) {
        const event = this.createEvent(type, tenantId, payload, options);
        await this.publish(event);
    }
}
exports.EventBus = EventBus;
exports.eventBus = new EventBus();
//# sourceMappingURL=event-bus.js.map