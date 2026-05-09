import { describe, it, expect, beforeEach } from "vitest";
import { TrustGraph } from "../trust-graph";
import {
  TrustGraphConsumer,
  ObservabilityConsumer,
  PolicyAuditConsumer,
  ConnectorMetricsConsumer,
  EventConsumerRegistry,
} from "../event-consumers";
import type { Execution, Artifact, Proof, Policy, PlatformEvent } from "../primitives";

describe("EventConsumerRegistry", () => {
  it("should dispatch events to matching consumers", async () => {
    const graph = new TrustGraph();
    const registry = new EventConsumerRegistry();
    const observability = new ObservabilityConsumer();
    const policyAudit = new PolicyAuditConsumer();
    const connectorMetrics = new ConnectorMetricsConsumer();

    registry.register(new TrustGraphConsumer(graph));
    registry.register(observability);
    registry.register(policyAudit);
    registry.register(connectorMetrics);

    const event: PlatformEvent = {
      eventId: "ev-1",
      idempotencyKey: "ik-1",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "execution.completed",
      eventVersion: 1,
      sequence: 1,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-1",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { runFingerprint: "fp-1" },
    };

    await registry.dispatch(event);

    // Observability should capture all events
    expect(observability.getRecords().length).toBe(1);

    // Policy audit should not capture execution events
    expect(policyAudit.getDecisions().length).toBe(0);

    // Connector metrics should not capture execution events
    expect(connectorMetrics.getMetrics().length).toBe(0);
  });

  it("should route connector events to connector consumer", async () => {
    const registry = new EventConsumerRegistry();
    const connectorMetrics = new ConnectorMetricsConsumer();
    registry.register(connectorMetrics);

    const event: PlatformEvent = {
      eventId: "ev-2",
      idempotencyKey: "ik-2",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "connector.sync.completed",
      eventVersion: 1,
      sequence: 2,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-2",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { connectorId: "stripe", durationMs: 1500, recordCount: 42 },
    };

    await registry.dispatch(event);
    const metrics = connectorMetrics.getMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].connectorId).toBe("stripe");
    expect(metrics[0].recordCount).toBe(42);
  });

  it("should route policy events to policy audit consumer", async () => {
    const registry = new EventConsumerRegistry();
    const policyAudit = new PolicyAuditConsumer();
    registry.register(policyAudit);

    const event: PlatformEvent = {
      eventId: "ev-3",
      idempotencyKey: "ik-3",
      tenantId: "t-1",
      executionId: "exec-1",
      eventType: "policy.evaluated",
      eventVersion: 1,
      sequence: 3,
      occurredAt: new Date().toISOString(),
      source: "platform.tests",
      severity: "info",
      correlation: {
        correlationId: "corr-3",
        tenantId: "t-1",
        executionId: "exec-1",
        runId: "run-1",
      },
      payload: { policyId: "p-1", decision: "allowed" },
    };

    await registry.dispatch(event);
    const decisions = policyAudit.getDecisions();
    expect(decisions.length).toBe(1);
    expect(decisions[0].decision).toBe("allowed");
  });
});
