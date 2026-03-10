import {
  buildPlatformOverview,
  loadTenantTelemetry,
  type PlatformOverview,
  type TelemetryExecutionRecord,
} from "../../ops-intelligence/control-plane-analytics";
import {
  getRunExplorer as getRunExplorerCore,
  getSystemHealthSnapshot as getSystemHealthSnapshotCore,
  type RunExplorerEntry,
  type SystemHealthSnapshot,
} from "../../ops-intelligence/runtime-events";
import type { CapabilityStatus } from "../types";

export interface OperatorIntelligenceProvider {
  status(): CapabilityStatus;
  getSystemHealthSnapshot(tenantId: string, days: number): Promise<SystemHealthSnapshot>;
  getRunExplorer(
    tenantId: string,
    filters: { status?: string; runId?: string; limit?: number }
  ): Promise<RunExplorerEntry[]>;
  getPlatformOverview(tenantId: string, days: number): Promise<PlatformOverview>;
  getTelemetryForExport(tenantId: string, days: number): Promise<TelemetryExecutionRecord[]>;
}

export class OssOperatorIntelligenceProvider implements OperatorIntelligenceProvider {
  public status(): CapabilityStatus {
    return {
      key: "operator_intelligence",
      state: "available",
      available: true,
      source: "oss",
      reason: "Using OSS operator intelligence implementation",
    };
  }

  public getSystemHealthSnapshot(tenantId: string, days: number): Promise<SystemHealthSnapshot> {
    return getSystemHealthSnapshotCore(tenantId, days);
  }

  public getRunExplorer(
    tenantId: string,
    filters: { status?: string; runId?: string; limit?: number }
  ): Promise<RunExplorerEntry[]> {
    return getRunExplorerCore(tenantId, filters);
  }

  public async getPlatformOverview(tenantId: string, days: number): Promise<PlatformOverview> {
    const telemetry = await loadTenantTelemetry(tenantId, days);
    return buildPlatformOverview(telemetry);
  }

  public getTelemetryForExport(
    tenantId: string,
    days: number
  ): Promise<TelemetryExecutionRecord[]> {
    return loadTenantTelemetry(tenantId, days);
  }
}

export class UnavailableOperatorIntelligenceProvider implements OperatorIntelligenceProvider {
  public constructor(private readonly reason: string) {}

  public status(): CapabilityStatus {
    return {
      key: "operator_intelligence",
      state: "unavailable",
      available: false,
      source: "oss",
      reason: this.reason,
    };
  }

  public async getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
    return this.emptySnapshot();
  }

  public async getRunExplorer(): Promise<RunExplorerEntry[]> {
    return [];
  }

  public async getPlatformOverview(): Promise<PlatformOverview> {
    return {
      telemetry: {
        systemHealth: 0,
        executionThroughputPerMinute: 0,
        replayRate: 0,
        policyViolations: 0,
        failureTrends: {},
        infrastructureUtilization: { avgLatencyMs: 0, p95LatencyMs: 0, avgQueueMs: 0 },
      },
      analytics: {
        executionSuccessRate: 0,
        mttrMinutes: 0,
        failureRecurrenceClusters: [],
        apiEndpointAdoption: [],
        latencyTrend: "stable",
        infrastructureTrend: "stable",
      },
      costs: { perExecutionAverageUsd: 0, totalUsd: 0, byTenantUsd: 0 },
      autonomousOperations: { recommendations: [], controlledAutoRemediation: [] },
      leaderboard: [],
    };
  }

  public async getTelemetryForExport(): Promise<TelemetryExecutionRecord[]> {
    return [];
  }

  private emptySnapshot(): SystemHealthSnapshot {
    return {
      runsPerDay: 0,
      recordsProcessed: 0,
      matchRate: 0,
      manualReviewRate: 0,
      runDurationMsP50: 0,
      runDurationMsP95: 0,
      runFailureRate: 0,
      apiLatencyMsP50: 0,
      apiLatencyMsP95: 0,
      errorRate: 0,
    };
  }
}
