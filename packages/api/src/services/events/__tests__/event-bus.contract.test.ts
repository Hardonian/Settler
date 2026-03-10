import { adaptEventToVersion2, EventBus } from "../event-bus";

describe("EventBus canonical contract", () => {
  it("canonicalizes legacy event names and propagates correlation", async () => {
    const bus = new EventBus();
    const received: any[] = [];

    bus.subscribe("reconciliation.completed", async (event) => {
      received.push(event);
    });

    await bus.emitEvent(
      "recon.completed",
      "tenant-1",
      {
        reconJobId: "job-1",
        reconResultId: "run-1",
      },
      {
        correlationId: "corr-1",
        runId: "run-1",
        executionId: "run-1",
        actorId: "operator-1",
      }
    );

    expect(received).toHaveLength(1);
    expect(received[0].eventType).toBe("reconciliation.completed");
    expect(received[0].eventVersion).toBe(1);
    expect(received[0].correlation.correlationId).toBe("corr-1");
    expect(received[0].correlation.tenantId).toBe("tenant-1");
  });

  it("emits machine-visible degraded event for unknown type", async () => {
    const bus = new EventBus();
    const received: any[] = [];

    bus.subscribe("system.degraded", async (event) => {
      received.push(event);
    });

    await bus.emitEvent("totally.unknown" as any, "tenant-1", { foo: "bar" });

    expect(received).toHaveLength(1);
    expect(received[0].eventType).toBe("system.degraded");
    expect(received[0].severity).toBe("warning");
    expect(received[0].metadata.protocol_degraded).toBe(true);
    expect(received[0].payload.unknown_event_type).toBe("totally.unknown");
  });

  it("preserves tenant-scoped correlation across replay/alert/support/webhook families", async () => {
    const bus = new EventBus();
    const t1: string[] = [];
    const t2: string[] = [];

    bus.subscribe("*", async (event) => {
      if (event.tenantId === "tenant-1") t1.push(event.eventType);
      if (event.tenantId === "tenant-2") t2.push(event.eventType);
    });

    await bus.emitEvent(
      "replay.started",
      "tenant-1",
      { replayId: "rep-1" },
      { correlationId: "c-r1" }
    );
    await bus.emitEvent("alert.created", "tenant-2", { alertId: "a-2" }, { correlationId: "c-a2" });
    await bus.emitEvent(
      "support.issue.created",
      "tenant-1",
      { ticketId: "s-1" },
      { correlationId: "c-s1" }
    );
    await bus.emitEvent(
      "webhook.received",
      "tenant-2",
      { deliveryId: "w-2" },
      { correlationId: "c-w2" }
    );

    expect(t1).toEqual(["replay.started", "support.issue.created"]);
    expect(t2).toEqual(["alert.created", "webhook.received"]);
  });

  it("adapts v1 payload to v2 format", () => {
    const v1 = {
      eventId: "ev-1",
      idempotencyKey: "ik-1",
      tenantId: "tenant-1",
      executionId: "exec-1",
      eventType: "execution.completed",
      eventVersion: 1,
      sequence: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      source: "api.tests",
      severity: "info",
      metadata: {},
      correlation: { correlationId: "corr-1", tenantId: "tenant-1" },
      payload: { run_fingerprint: "fp-1", connector_id: "stripe" },
    } as any;

    const v2 = adaptEventToVersion2(v1);
    expect(v2.eventVersion).toBe(2);
    expect(v2.payload.runFingerprint).toBe("fp-1");
    expect(v2.payload.connectorId).toBe("stripe");
    expect(v2.metadata.payload_adapter).toBe("v1_to_v2");
  });
});
