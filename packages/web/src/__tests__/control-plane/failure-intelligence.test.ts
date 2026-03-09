import {
  classifyFailure,
  clusterFailures,
  computeFailureDashboardMetrics,
  FAILURE_CLASSES,
  listFailures,
  operatorGuidance,
  recordFailure,
  remediateFailure,
  resetFailureIntelligenceStore,
} from "@/lib/control-plane/failure-intelligence";

describe("failure taxonomy", () => {
  beforeEach(() => {
    resetFailureIntelligenceStore();
  });

  it("supports canonical failure class catalog", () => {
    expect(FAILURE_CLASSES).toContain("VALIDATION_ERROR");
    expect(FAILURE_CLASSES).toContain("OPERATOR_ACTION_REQUIRED");
    expect(FAILURE_CLASSES).toHaveLength(17);
  });

  it("classifies rate limit errors as retryable and auto-remediable", () => {
    const classified = classifyFailure({
      traceId: "trace-1",
      component: "api",
      operation: "POST /jobs",
      error: "429 rate limit exceeded",
    });

    expect(classified.failureClass).toBe("RATE_LIMIT_ERROR");
    expect(classified.retryable).toBe(true);
    expect(classified.safeToAutoRemediate).toBe(true);
  });

  it("classifies tenant isolation failures as non-remediable critical", () => {
    const classified = classifyFailure({
      traceId: "trace-2",
      component: "authz",
      operation: "tenant boundary check",
      error: "cross-tenant access blocked by guard",
    });

    expect(classified.failureClass).toBe("TENANT_ISOLATION_ERROR");
    expect(classified.severity).toBe("critical");
    expect(classified.safeToAutoRemediate).toBe(false);
  });
});

describe("recurrence and root-cause evidence", () => {
  beforeEach(() => {
    resetFailureIntelligenceStore();
  });

  it("clusters repeated signatures and estimates blast radius", () => {
    recordFailure({
      traceId: "trace-a",
      tenantId: "tenant-a",
      component: "queue-worker",
      operation: "drain",
      routeOrCommand: "settler reconcile run",
      error: "timeout while waiting for upstream",
    });

    recordFailure({
      traceId: "trace-b",
      tenantId: "tenant-b",
      component: "queue-worker",
      operation: "drain",
      routeOrCommand: "settler reconcile run",
      error: "timeout while waiting for upstream",
    });

    const clusters = clusterFailures();
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.occurrenceCount).toBe(2);
    expect(clusters[0]?.blastRadiusEstimate).toBe("multi-tenant");
  });

  it("adds recurring-signature root-cause hypothesis from history", () => {
    recordFailure({
      traceId: "trace-c-1",
      component: "proof-engine",
      operation: "verify",
      error: "proof verification signature mismatch",
    });

    const second = recordFailure({
      traceId: "trace-c-2",
      component: "proof-engine",
      operation: "verify",
      error: "proof verification signature mismatch",
    });

    expect(second.rootCauseHypothesis[0]?.probableCause).toMatch(/Recurring execution defect/);
    expect(second.rootCauseHypothesis[0]?.confidence).toBeGreaterThan(0.5);
  });
});

describe("remediation runner safety guardrails", () => {
  beforeEach(() => {
    resetFailureIntelligenceStore();
  });

  it("blocks auto-remediation when idempotency proof is missing", () => {
    const failure = recordFailure({
      traceId: "trace-r1",
      component: "queue",
      operation: "process",
      error: "queue dead letter due to transient lock",
    });

    const attempt = remediateFailure(failure.failureId, {
      triggeredBy: "auto",
      idempotencyKeyPresent: false,
    });

    expect(attempt?.outcome).toBe("blocked");
    expect(attempt?.notes.join(" ")).toMatch(/idempotency-key-missing/);
  });

  it("succeeds for bounded safe remediation with idempotency key", () => {
    const failure = recordFailure({
      traceId: "trace-r2",
      component: "queue",
      operation: "process",
      error: "queue dead letter due to transient lock",
    });

    const attempt = remediateFailure(failure.failureId, {
      triggeredBy: "auto",
      idempotencyKeyPresent: true,
    });

    expect(attempt?.outcome).toBe("succeeded");
    expect(attempt?.actionTaken).toBe("retry-queue-job-with-fence");
  });

  it("enforces max remediation attempts", () => {
    const failure = recordFailure({
      traceId: "trace-r3",
      component: "worker",
      operation: "timeout-handler",
      error: "timeout waiting for operation commit",
    });

    remediateFailure(failure.failureId, {
      triggeredBy: "operator",
      idempotencyKeyPresent: true,
    });

    const second = remediateFailure(failure.failureId, {
      triggeredBy: "operator",
      idempotencyKeyPresent: true,
    });

    expect(second?.outcome).toBe("blocked");
    expect(second?.notes.join(" ")).toMatch(/max-attempts-exceeded/);
  });
});

describe("operator guidance and dashboard metrics", () => {
  beforeEach(() => {
    resetFailureIntelligenceStore();
  });

  it("produces specific operator guidance with artifact links", () => {
    const failure = recordFailure({
      traceId: "trace-g1",
      executionId: "exec-g1",
      tenantId: "tenant-guided",
      component: "storage",
      operation: "init",
      error: "missing env var OBJECT_STORAGE_BUCKET",
      linkedLogs: ["https://logs.local/trace-g1"],
      linkedExecutionReceipt: "https://receipts.local/exec-g1",
    });

    const guidance = operatorGuidance(failure);
    expect(guidance.whatFailed).toBe("storage.init");
    expect(guidance.recommendedNextSteps[0]).toMatch(/Inspect trace/);
    expect(guidance.artifactLinks).toContain("https://logs.local/trace-g1");
  });

  it("computes failure dashboard metrics", () => {
    const first = recordFailure({
      traceId: "trace-m1",
      component: "api",
      operation: "POST /ingest",
      error: "429 rate limit exceeded",
    });

    remediateFailure(first.failureId, { triggeredBy: "auto", idempotencyKeyPresent: true });

    recordFailure({
      traceId: "trace-m2",
      component: "api",
      operation: "POST /ingest",
      error: "429 rate limit exceeded",
    });

    const metrics = computeFailureDashboardMetrics();
    expect(metrics.topRecurringFailures.length).toBeGreaterThan(0);
    expect(metrics.classesOverTime[0]?.failureClass).toBe("RATE_LIMIT_ERROR");
    expect(metrics.autoRemediationSuccessRate).toBe(1);
    expect(metrics.highestErrorBurdenComponents[0]?.component).toBe("api");
    expect(listFailures()).toHaveLength(2);
  });
});
