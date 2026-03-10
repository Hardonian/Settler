/**
 * Event Bus
 *
 * Internal event bus for platform coordination.
 * Uses a canonical event envelope with explicit versioning,
 * correlation and degraded-state signaling.
 */

import { EventEmitter } from "events";
import { logInfo, logError, logWarn } from "../../utils/logger";
import { emitOperatorRuntimeEvent } from "../ops-intelligence/runtime-events";

export type CanonicalEventType =
  | "reconciliation.completed"
  | "reconciliation.failed"
  | "reconciliation.value.realized"
  | "reconciliation.errors.prevented"
  | "validation.failed"
  | "mapping.suggested"
  | "drift.detected"
  | "workflow.failed"
  | "audit.ready"
  | "contract.breaking_change"
  | "usage.limit_exceeded"
  | "agent.fallback"
  | "system.degraded"
  | "alert.created"
  | "alert.status.changed"
  | "webhook.received"
  | "webhook.rejected"
  | "support.issue.created"
  | "support.issue.linked"
  | "replay.started"
  | "replay.completed"
  | "replay.failed"
  | "stream.event.emitted"
  | "operator.action.executed";

export type LegacyEventType =
  | "recon.completed"
  | "recon.failed"
  | "value.reconciliation_completed"
  | "value.errors_prevented";

export type EventType = CanonicalEventType | LegacyEventType;

const EVENT_TYPE_ALIASES: Record<LegacyEventType, CanonicalEventType> = {
  "recon.completed": "reconciliation.completed",
  "recon.failed": "reconciliation.failed",
  "value.reconciliation_completed": "reconciliation.value.realized",
  "value.errors_prevented": "reconciliation.errors.prevented",
};

const EVENT_TYPES: ReadonlySet<string> = new Set<string>([
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

export interface PlatformEvent {
  eventId: string;
  idempotencyKey: string;
  tenantId: string;
  executionId: string;
  eventType: CanonicalEventType;
  eventVersion: number;
  sequence: number;
  occurredAt: string;
  createdAt: string;
  source: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  metadata: Record<string, unknown>;
  correlation: {
    correlationId: string;
    tenantId: string;
    traceId?: string;
    causationId?: string;
    runId?: string;
    executionId?: string;
    actorId?: string;
  };
  payload: Record<string, unknown>;
}

export interface EmitEventOptions {
  correlationId?: string;
  traceId?: string;
  causationId?: string;
  runId?: string;
  executionId?: string;
  actorId?: string;
  source?: string;
  severity?: PlatformEvent["severity"];
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: PlatformEvent) => Promise<void> | void;

export function adaptEventToVersion2(event: PlatformEvent): PlatformEvent {
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

export class EventBus extends EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private sequence = 0;

  private nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  private canonicalizeEventType(eventType: EventType): CanonicalEventType {
    const canonical = (EVENT_TYPE_ALIASES[eventType as LegacyEventType] ??
      eventType) as CanonicalEventType;
    if (EVENT_TYPES.has(canonical)) {
      return canonical;
    }
    return "system.degraded";
  }

  private createEvent(
    eventType: EventType,
    tenantId: string,
    payload: Record<string, unknown>,
    options: EmitEventOptions = {}
  ): PlatformEvent {
    const occurredAt = new Date().toISOString();
    const correlationId = options.correlationId ?? crypto.randomUUID();
    const canonicalType = this.canonicalizeEventType(eventType);
    const executionId =
      options.executionId ?? String(payload.executionId ?? payload.reconResultId ?? "unknown");

    const metadata: Record<string, unknown> = {
      ...(options.metadata ?? {}),
      producer_event_type: eventType,
    };

    const normalizedPayload = { ...payload };

    if (canonicalType === "system.degraded") {
      logWarn("Unknown event type received; emitting system.degraded event", {
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

  private async publishDegradedAudit(event: PlatformEvent): Promise<void> {
    if (event.eventType !== "system.degraded") {
      return;
    }

    if (process.env.NODE_ENV === "test") {
      return;
    }

    try {
      await emitOperatorRuntimeEvent({
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
    } catch (error) {
      logError("Failed to publish degraded event audit", error, {
        eventId: event.eventId,
        tenantId: event.tenantId,
      });
    }
  }

  subscribe(eventType: EventType | CanonicalEventType | "*", handler: EventHandler): () => void {
    const key = eventType === "*" ? "*" : this.canonicalizeEventType(eventType);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, new Set());
    }

    this.handlers.get(key)!.add(handler);

    return () => {
      this.handlers.get(key)?.delete(handler);
    };
  }

  async publish(event: PlatformEvent): Promise<void> {
    try {
      logInfo("Event published", {
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
          } catch (error) {
            logError("Event handler failed", {
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
          } catch (error) {
            logError("Wildcard event handler failed", {
              error,
              eventType: event.eventType,
              eventId: event.eventId,
            });
          }
        }
      }

      await this.publishDegradedAudit(event);
    } catch (error) {
      logError("Failed to publish event", {
        error,
        eventType: event.eventType,
        eventId: event.eventId,
      });
      throw error;
    }
  }

  async emitEvent(
    type: EventType,
    tenantId: string,
    payload: Record<string, unknown>,
    options?: EmitEventOptions
  ): Promise<void> {
    const event = this.createEvent(type, tenantId, payload, options);
    await this.publish(event);
  }
}

export const eventBus = new EventBus();
