import type { PlatformEvent, PlatformEventType } from "./primitives";

export type PlatformEventSeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface PlatformEventCorrelation {
  correlationId: string;
  traceId?: string;
  causationId?: string;
  tenantId: string;
  runId?: string;
  executionId?: string;
  actorId?: string;
  alertId?: string;
  replayId?: string;
  supportIssueId?: string;
}

export class UnknownPlatformEventTypeError extends Error {
  constructor(public readonly eventType: string) {
    super(`Unknown platform event type: ${eventType}`);
    this.name = "UnknownPlatformEventTypeError";
  }
}

export const EVENT_TYPE_ALIASES: Record<string, PlatformEventType> = {
  "connector.sync.succeeded": "connector.sync.completed",
  "execution.done": "execution.completed",
  "recon.completed": "reconciliation.completed",
  "recon.failed": "reconciliation.failed",
  "value.reconciliation_completed": "reconciliation.value.realized",
  "value.errors_prevented": "reconciliation.errors.prevented",
};

export const CANONICAL_EVENT_TYPES: ReadonlySet<string> = new Set<string>([
  "workflow.triggered",
  "worker.lease.acquired",
  "execution.started",
  "state.persisted",
  "proof.artifact.generated",
  "execution.completed",
  "execution.failed",
  "connector.sync.started",
  "connector.sync.completed",
  "connector.sync.failed",
  "policy.evaluated",
  "trust.node.added",
  "trust.edge.added",
  "ai.suggestion.created",
  "ai.suggestion.accepted",
  "ai.suggestion.rejected",
  "chaos.fault.injected",
  "chaos.invariant.checked",
  "alert.created",
  "alert.status.changed",
  "replay.started",
  "replay.completed",
  "replay.failed",
  "support.issue.created",
  "support.issue.linked",
  "webhook.received",
  "webhook.rejected",
  "operator.action.executed",
  "stream.event.emitted",
  "system.degraded",
  "reconciliation.started",
  "reconciliation.completed",
  "reconciliation.failed",
  "reconciliation.value.realized",
  "reconciliation.errors.prevented",
]);

export function normalizeEventType(eventType: string): PlatformEventType {
  const canonical = EVENT_TYPE_ALIASES[eventType] ?? eventType;
  if (CANONICAL_EVENT_TYPES.has(canonical)) {
    return canonical as PlatformEventType;
  }
  throw new UnknownPlatformEventTypeError(eventType);
}

function machineVisibleDegradedEvent(
  event: PlatformEvent,
  unknownEventType: string,
  occurredAt: string,
  tenantId: string,
  executionId: string
): PlatformEvent {
  return {
    ...event,
    eventType: "system.degraded",
    eventVersion: 1,
    occurredAt,
    createdAt: occurredAt,
    source: event.source ?? "platform.runtime",
    severity: "warning",
    idempotencyKey: event.idempotencyKey ?? event.correlation.correlationId,
    tenantId,
    executionId,
    correlation: {
      ...event.correlation,
      tenantId,
      executionId,
      correlationId: event.correlation.correlationId,
    },
    metadata: {
      ...(event.metadata ?? {}),
      protocol_degraded: true,
      unknown_event_type: unknownEventType,
      original_event_type: event.eventType,
    },
    payload: {
      ...(event.payload ?? {}),
      degraded_reason: "unknown_event_type",
      unknown_event_type: unknownEventType,
    },
  };
}

export function normalizePlatformEvent(event: PlatformEvent): PlatformEvent {
  const occurredAt = event.occurredAt ?? event.createdAt ?? new Date().toISOString();
  const executionId = event.executionId ?? event.correlation.executionId ?? "unknown";
  const tenantId = event.tenantId ?? event.correlation.tenantId;

  let eventType: PlatformEventType;
  try {
    eventType = normalizeEventType(event.eventType);
  } catch (error) {
    if (error instanceof UnknownPlatformEventTypeError) {
      return machineVisibleDegradedEvent(event, error.eventType, occurredAt, tenantId, executionId);
    }
    throw error;
  }

  return {
    ...event,
    tenantId,
    executionId,
    eventType,
    eventVersion: event.eventVersion ?? 1,
    occurredAt,
    createdAt: occurredAt,
    source: event.source ?? "platform.runtime",
    severity: event.severity ?? "info",
    payload: event.payload ?? {},
    metadata: event.metadata ?? {},
    correlation: {
      ...event.correlation,
      tenantId,
      executionId,
      correlationId: event.correlation.correlationId,
    },
    idempotencyKey: event.idempotencyKey ?? event.correlation.correlationId,
  };
}

export function createPlatformEvent(
  event: Omit<PlatformEvent, "eventVersion" | "occurredAt" | "createdAt" | "idempotencyKey"> &
    Partial<Pick<PlatformEvent, "eventVersion" | "occurredAt" | "createdAt" | "idempotencyKey">>
): PlatformEvent {
  return normalizePlatformEvent({
    ...event,
    eventVersion: event.eventVersion ?? 1,
    occurredAt: event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
    createdAt: event.createdAt ?? event.occurredAt,
    idempotencyKey: event.idempotencyKey ?? event.correlation.correlationId,
  });
}

export function validatePlatformEventContract(event: PlatformEvent): string[] {
  const errors: string[] = [];
  if (!event.eventId) errors.push("eventId is required");
  if (!event.eventType) errors.push("eventType is required");
  if (!event.eventVersion || event.eventVersion < 1) errors.push("eventVersion must be >= 1");
  if (!event.occurredAt && !event.createdAt) errors.push("occurredAt is required");
  if (!event.tenantId) errors.push("tenantId is required");
  if (!event.correlation?.correlationId) errors.push("correlation.correlationId is required");
  if (!event.correlation?.tenantId) errors.push("correlation.tenantId is required");
  if (!event.source) errors.push("source is required");
  if (!event.payload) errors.push("payload is required");
  return errors;
}

export function adaptPlatformEventToVersion(
  event: PlatformEvent,
  targetVersion: number
): PlatformEvent {
  if (targetVersion <= (event.eventVersion ?? 1)) {
    return event;
  }

  if ((event.eventVersion ?? 1) === 1 && targetVersion === 2) {
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
      payload,
      metadata: {
        ...event.metadata,
        adapted_from_version: event.eventVersion ?? 1,
        adapter: "platform_v1_to_v2",
      },
    };
  }

  return {
    ...event,
    eventVersion: targetVersion,
    metadata: {
      ...event.metadata,
      adapted_from_version: event.eventVersion ?? 1,
      adapter: "platform_passthrough",
    },
  };
}
