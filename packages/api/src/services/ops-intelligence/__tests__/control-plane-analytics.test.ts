import { buildPlatformOverview, TelemetryExecutionRecord } from "../control-plane-analytics";

describe("control-plane analytics", () => {
  it("computes observability, analytics, and cost outputs from telemetry", () => {
    const now = Date.now();
    const records: TelemetryExecutionRecord[] = [
      {
        executionId: "e1",
        tenantId: "t1",
        traceId: "tr1",
        timestamp: new Date(now - 60_000).toISOString(),
        component: "/api/v1/reconciliation",
        status: "success",
        latencyMs: 120,
        queueMs: 20,
        computeMs: 120,
        storageBytes: 2_000_000,
        networkEgressBytes: 500_000,
        loggingBytes: 50_000,
        isReplay: false,
        policyViolationCount: 0,
        workflowKey: "recon-core",
      },
      {
        executionId: "e2",
        tenantId: "t1",
        traceId: "tr2",
        timestamp: new Date(now - 30_000).toISOString(),
        component: "/api/v1/reconciliation",
        status: "failed",
        latencyMs: 500,
        queueMs: 120_000,
        computeMs: 300,
        storageBytes: 3_000_000,
        networkEgressBytes: 900_000,
        loggingBytes: 80_000,
        isReplay: true,
        policyViolationCount: 1,
        failureClass: "IDEMPOTENT_RETRYABLE",
        workflowKey: "recon-core",
      },
      {
        executionId: "e3",
        tenantId: "t1",
        traceId: "tr3",
        timestamp: new Date(now - 5_000).toISOString(),
        component: "/api/v1/exports",
        status: "failed",
        latencyMs: 700,
        queueMs: 90_000,
        computeMs: 500,
        storageBytes: 1_000_000,
        networkEgressBytes: 400_000,
        loggingBytes: 20_000,
        isReplay: false,
        policyViolationCount: 0,
        failureClass: "QUEUE_LOCK_STALE",
        workflowKey: "exports",
      },
    ];

    const result = buildPlatformOverview(records);
    expect(result.telemetry.systemHealth).toBeCloseTo(33.33, 1);
    expect(result.analytics.executionSuccessRate).toBeCloseTo(33.33, 1);
    expect(result.costs.totalUsd).toBeGreaterThan(0);
    expect(
      result.autonomousOperations.controlledAutoRemediation.some(
        (a) => a.action === "retry_idempotent_jobs"
      )
    ).toBe(true);
    expect(result.leaderboard.length).toBeGreaterThan(0);
  });
});
