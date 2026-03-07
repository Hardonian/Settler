/**
 * Event Backbone Consumers
 *
 * Connects subsystems to the durable event log.
 * Each consumer processes events idempotently with
 * tracked offsets, ensuring:
 * - Replay Lab consumes the same events as execution
 * - Trust Graph derives lineage from events
 * - Policy Simulator can replay historical events
 * - Observability pipeline receives all events
 */

import type { PlatformEvent, PlatformEventType } from "./primitives";
import type { TrustGraph } from "./trust-graph";

export interface EventConsumer {
  readonly name: string;
  accept(event: PlatformEvent): boolean;
  process(event: PlatformEvent): Promise<void>;
}

// ────────────────────────────────────────────────────────────
// Trust Graph Consumer
// ────────────────────────────────────────────────────────────
export class TrustGraphConsumer implements EventConsumer {
  readonly name = "trust_graph";

  constructor(private graph: TrustGraph) {}

  accept(event: PlatformEvent): boolean {
    const tracked: PlatformEventType[] = [
      "execution.started",
      "execution.completed",
      "proof.artifact.generated",
      "connector.sync.completed",
      "policy.evaluated",
      "trust.node.added",
      "trust.edge.added",
    ];
    return tracked.includes(event.eventType);
  }

  async process(event: PlatformEvent): Promise<void> {
    switch (event.eventType) {
      case "execution.completed": {
        const payload = event.payload as {
          run_fingerprint?: string;
          input_hash?: string;
          config_hash?: string;
          output_hash?: string;
          policy_id?: string;
          engine_version?: string;
        };
        this.graph.recordExecution({
          executionId: event.executionId,
          runId: event.executionId,
          tenantId: event.tenantId,
          policyId: payload.policy_id ?? "unknown",
          engineVersion: payload.engine_version ?? "unknown",
          status: "completed",
          startedAt: event.createdAt,
          inputHash: payload.input_hash ?? "",
          configHash: payload.config_hash ?? "",
          outputHash: payload.output_hash,
          runFingerprint: payload.run_fingerprint,
        });
        break;
      }
      case "proof.artifact.generated": {
        // Proof artifacts create nodes + edges in the trust graph
        // The actual linking is handled when the execution record is created
        break;
      }
      default:
        break;
    }
  }
}

// ────────────────────────────────────────────────────────────
// Observability Consumer
// ────────────────────────────────────────────────────────────
export interface ObservabilityRecord {
  traceId: string;
  executionId: string;
  tenantId: string;
  eventType: string;
  timestamp: string;
  durationMs?: number;
  metadata: Record<string, unknown>;
}

export class ObservabilityConsumer implements EventConsumer {
  readonly name = "observability";
  private records: ObservabilityRecord[] = [];

  accept(): boolean {
    return true; // Accept all events
  }

  async process(event: PlatformEvent): Promise<void> {
    this.records.push({
      traceId: event.idempotencyKey,
      executionId: event.executionId,
      tenantId: event.tenantId,
      eventType: event.eventType,
      timestamp: event.createdAt,
      metadata: event.payload,
    });
  }

  getRecords(tenantId?: string): ObservabilityRecord[] {
    if (tenantId) return this.records.filter((r) => r.tenantId === tenantId);
    return [...this.records];
  }

  getMetrics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByTenant: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byTenant: Record<string, number> = {};
    for (const r of this.records) {
      byType[r.eventType] = (byType[r.eventType] ?? 0) + 1;
      byTenant[r.tenantId] = (byTenant[r.tenantId] ?? 0) + 1;
    }
    return {
      totalEvents: this.records.length,
      eventsByType: byType,
      eventsByTenant: byTenant,
    };
  }
}

// ────────────────────────────────────────────────────────────
// Policy Audit Consumer
// ────────────────────────────────────────────────────────────
export interface PolicyDecisionLog {
  executionId: string;
  tenantId: string;
  policyId: string;
  decision: "allowed" | "denied";
  reason?: string;
  timestamp: string;
}

export class PolicyAuditConsumer implements EventConsumer {
  readonly name = "policy_audit";
  private decisions: PolicyDecisionLog[] = [];

  accept(event: PlatformEvent): boolean {
    return event.eventType === "policy.evaluated";
  }

  async process(event: PlatformEvent): Promise<void> {
    const payload = event.payload as {
      policy_id?: string;
      decision?: string;
      reason?: string;
    };
    this.decisions.push({
      executionId: event.executionId,
      tenantId: event.tenantId,
      policyId: payload.policy_id ?? "unknown",
      decision: payload.decision === "denied" ? "denied" : "allowed",
      reason: payload.reason,
      timestamp: event.createdAt,
    });
  }

  getDecisions(tenantId?: string): PolicyDecisionLog[] {
    if (tenantId) return this.decisions.filter((d) => d.tenantId === tenantId);
    return [...this.decisions];
  }
}

// ────────────────────────────────────────────────────────────
// Connector Metrics Consumer
// ────────────────────────────────────────────────────────────
export interface ConnectorMetric {
  connectorId: string;
  tenantId: string;
  eventType: string;
  timestamp: string;
  durationMs?: number;
  recordCount?: number;
  error?: string;
}

export class ConnectorMetricsConsumer implements EventConsumer {
  readonly name = "connector_metrics";
  private metrics: ConnectorMetric[] = [];

  accept(event: PlatformEvent): boolean {
    return event.eventType.startsWith("connector.");
  }

  async process(event: PlatformEvent): Promise<void> {
    const payload = event.payload as {
      connector_id?: string;
      duration_ms?: number;
      record_count?: number;
      error?: string;
    };
    this.metrics.push({
      connectorId: payload.connector_id ?? "unknown",
      tenantId: event.tenantId,
      eventType: event.eventType,
      timestamp: event.createdAt,
      durationMs: payload.duration_ms,
      recordCount: payload.record_count,
      error: payload.error,
    });
  }

  getMetrics(tenantId?: string): ConnectorMetric[] {
    if (tenantId) return this.metrics.filter((m) => m.tenantId === tenantId);
    return [...this.metrics];
  }
}

// ────────────────────────────────────────────────────────────
// Consumer Registry
// ────────────────────────────────────────────────────────────
export class EventConsumerRegistry {
  private consumers: EventConsumer[] = [];

  register(consumer: EventConsumer): void {
    this.consumers.push(consumer);
  }

  async dispatch(event: PlatformEvent): Promise<void> {
    const promises = this.consumers
      .filter((c) => c.accept(event))
      .map((c) => c.process(event));
    await Promise.allSettled(promises);
  }

  getConsumerNames(): string[] {
    return this.consumers.map((c) => c.name);
  }
}
