import { describe, expect, it } from "vitest";
import {
  createPlatformEvent,
  normalizePlatformEvent,
  validatePlatformEventContract,
} from "../event-protocol";
import type { PlatformEvent } from "../primitives";

describe("event protocol", () => {
  it("normalizes legacy event aliases and missing envelope fields", () => {
    const legacy: PlatformEvent = {
      eventId: "ev-legacy",
      tenantId: "tenant-1",
      executionId: "exec-1",
      eventType: "connector.sync.succeeded" as any,
      sequence: 7,
      createdAt: "2026-01-01T00:00:00.000Z",
      correlation: {
        correlationId: "corr-legacy",
        tenantId: "tenant-1",
      },
      payload: { connector_id: "stripe" },
    };

    const normalized = normalizePlatformEvent(legacy);
    expect(normalized.eventType).toBe("connector.sync.completed");
    expect(normalized.eventVersion).toBe(1);
    expect(normalized.idempotencyKey).toBe("corr-legacy");
    expect(normalized.severity).toBe("info");
    expect(normalized.source).toBe("platform.runtime");
    expect(normalized.occurredAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("creates canonical event envelope with first-class correlation", () => {
    const event = createPlatformEvent({
      eventId: "ev-1",
      tenantId: "tenant-1",
      executionId: "exec-1",
      eventType: "execution.completed",
      sequence: 1,
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-1",
        traceId: "trace-1",
        tenantId: "tenant-1",
        executionId: "exec-1",
        runId: "run-1",
        actorId: "operator-1",
      },
      payload: { runFingerprint: "fp-1" },
    });

    expect(event.eventVersion).toBe(1);
    expect(event.idempotencyKey).toBe("corr-1");
    expect(event.correlation.actorId).toBe("operator-1");
    expect(event.eventType).toBe("execution.completed");
  });

  it("emits machine-visible degraded event for unknown types", () => {
    const unknown = normalizePlatformEvent({
      eventId: "ev-unknown",
      tenantId: "tenant-1",
      executionId: "exec-1",
      eventType: "totally.unknown" as any,
      sequence: 11,
      createdAt: "2026-01-01T00:00:00.000Z",
      source: "platform.tests",
      correlation: {
        correlationId: "corr-unknown",
        tenantId: "tenant-1",
      },
      payload: {},
    });

    expect(unknown.eventType).toBe("system.degraded");
    expect(unknown.severity).toBe("warning");
    expect(unknown.metadata?.protocol_degraded).toBe(true);
    expect(unknown.payload.unknown_event_type).toBe("totally.unknown");
  });

  it("validates required contract fields", () => {
    const invalid = {
      eventId: "",
      eventType: "",
      eventVersion: 0,
      tenantId: "",
      executionId: "exec-1",
      sequence: 1,
      source: "",
      correlation: { correlationId: "", tenantId: "" },
      payload: undefined,
    } as unknown as PlatformEvent;

    const errors = validatePlatformEventContract(invalid);
    expect(errors).toContain("eventId is required");
    expect(errors).toContain("eventType is required");
    expect(errors).toContain("eventVersion must be >= 1");
    expect(errors).toContain("tenantId is required");
    expect(errors).toContain("correlation.correlationId is required");
  });
});
