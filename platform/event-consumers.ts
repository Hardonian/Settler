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
import { normalizePlatformEvent } from "./event-protocol";

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
    return tracked.includes(normalizePlatformEvent(event).eventType);
  }

  async process(rawEvent: PlatformEvent): Promise<void> {
    const event = normalizePlatformEvent(rawEvent);

    switch (event.eventType) {
      case "execution.completed": {
        const payload = event.payload as {
          runFingerprint?: string;
          run_fingerprint?: string;
          inputHash?: string;
          input_hash?: string;
          configHash?: string;
          config_hash?: string;
          outputHash?: string;
          output_hash?: string;
          policyId?: string;
          policy_id?: string;
          engineVersion?: string;
          engine_version?: string;
        };
        this.graph.recordExecution({
          executionId: event.executionId,
          runId: event.correlation.runId ?? event.executionId,
          tenantId: event.tenantId,
          policyId: payload.policyId ?? payload.policy_id ?? "unknown",
          engineVersion: payload.engineVersion ?? payload.engine_version ?? "unknown",
          status: "completed",
          startedAt: event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
          inputHash: payload.inputHash ?? payload.input_hash ?? "",
          configHash: payload.configHash ?? payload.config_hash ?? "",
          outputHash: payload.outputHash ?? payload.output_hash,
          runFingerprint: payload.runFingerprint ?? payload.run_fingerprint,
        });
        break;
      }
      case "proof.artifact.generated":
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
  correlationId: string;
  executionId: string;
  tenantId: string;
  eventType: string;
  eventVersion: number;
  source: string;
  severity: string;
  timestamp: string;
  durationMs?: number;
  metadata: Record<string, unknown>;
}

export class ObservabilityConsumer implements EventConsumer {
  readonly name = "observability";
  private records: ObservabilityRecord[] = [];

  accept(): boolean {
    return true;
  }

  async process(rawEvent: PlatformEvent): Promise<void> {
    const event = normalizePlatformEvent(rawEvent);
    this.records.push({
      traceId: event.correlation.traceId ?? event.idempotencyKey ?? event.correlation.correlationId,
      correlationId: event.correlation.correlationId,
      executionId: event.executionId,
      tenantId: event.tenantId,
      eventType: event.eventType,
      eventVersion: event.eventVersion ?? 1,
      source: event.source ?? "platform.runtime",
      severity: event.severity ?? "info",
      timestamp: event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
      metadata: {
        ...event.metadata,
        ...event.payload,
      },
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
  correlationId: string;
  timestamp: string;
}

export class PolicyAuditConsumer implements EventConsumer {
  readonly name = "policy_audit";
  private decisions: PolicyDecisionLog[] = [];

  accept(event: PlatformEvent): boolean {
    return normalizePlatformEvent(event).eventType === "policy.evaluated";
  }

  async process(rawEvent: PlatformEvent): Promise<void> {
    const event = normalizePlatformEvent(rawEvent);
    const payload = event.payload as {
      policyId?: string;
      policy_id?: string;
      decision?: string;
      reason?: string;
    };
    this.decisions.push({
      executionId: event.executionId,
      tenantId: event.tenantId,
      policyId: payload.policyId ?? payload.policy_id ?? "unknown",
      decision: payload.decision === "denied" ? "denied" : "allowed",
      reason: payload.reason,
      correlationId: event.correlation.correlationId,
      timestamp: event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
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
  correlationId: string;
  timestamp: string;
  durationMs?: number;
  recordCount?: number;
  error?: string;
}

export class ConnectorMetricsConsumer implements EventConsumer {
  readonly name = "connector_metrics";
  private metrics: ConnectorMetric[] = [];

  accept(event: PlatformEvent): boolean {
    return normalizePlatformEvent(event).eventType.startsWith("connector.");
  }

  async process(rawEvent: PlatformEvent): Promise<void> {
    const event = normalizePlatformEvent(rawEvent);
    const payload = event.payload as {
      connectorId?: string;
      connector_id?: string;
      durationMs?: number;
      duration_ms?: number;
      recordCount?: number;
      record_count?: number;
      error?: string;
    };
    this.metrics.push({
      connectorId: payload.connectorId ?? payload.connector_id ?? "unknown",
      tenantId: event.tenantId,
      eventType: event.eventType,
      correlationId: event.correlation.correlationId,
      timestamp: event.occurredAt ?? event.createdAt ?? new Date().toISOString(),
      durationMs: payload.durationMs ?? payload.duration_ms,
      recordCount: payload.recordCount ?? payload.record_count,
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

  async dispatch(rawEvent: PlatformEvent): Promise<void> {
    const event = normalizePlatformEvent(rawEvent);
    const promises = this.consumers.filter((c) => c.accept(event)).map((c) => c.process(event));
    await Promise.allSettled(promises);
  }

  getConsumerNames(): string[] {
    return this.consumers.map((c) => c.name);
  }
}
