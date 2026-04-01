import {
  buildOperatorIngestionRunDetailJson,
  buildOperatorReconRunDetailJson,
  type CanonicalReconciliationRunDetail,
} from "./index.js";

const baseDetail: CanonicalReconciliationRunDetail = {
  runKind: "recon_job",
  id: "run-1",
  tenantId: "tenant-1",
  name: "Run 1",
  reconResultId: "res-1",
  lifecycle: {
    status: "completed",
    statusLabel: "Completed",
    isTerminal: true,
    progressPercent: 100,
    progressState: "completed",
  },
  summaryState: "success",
  summary: {
    total: 10,
    sourceCount: 5,
    targetCount: 5,
    processed: 10,
    matched: 8,
    matchedWithTolerance: 1,
    unmatched: 2,
    unmatchedSourceCount: 1,
    unmatchedTargetCount: 1,
    conflicts: 0,
    exceptioned: 0,
    unresolved: 0,
    ignored: 0,
    resolved: 0,
  },
  provenance: {
    sourceModel: "recon_jobs",
    runKind: "recon_job",
    ingestionId: null,
    reconJobId: "run-1",
  },
  adapters: { sourceAdapter: "stripe", targetAdapter: "netsuite" },
  timestamps: {
    createdAt: "2026-01-01T00:00:00.000Z",
    startedAt: "2026-01-01T00:01:00.000Z",
    completedAt: "2026-01-01T00:02:00.000Z",
    updatedAt: "2026-01-01T00:02:00.000Z",
  },
  configDrift: {
    status: "none",
    strategyChanged: false,
    templateChanged: false,
    validationRulesChanged: false,
    adapter: {
      status: "none",
      comparisonMode: "unavailable",
      sourceChanged: null,
      targetChanged: null,
      sourceHashPresent: false,
      targetHashPresent: false,
    },
    notes: [],
  },
  errorMessage: null,
  traceId: null,
  metadata: {},
  latestResultId: "res-1",
};

describe("operator run detail serializer", () => {
  it("serializes recon_job detail with canonical + kindDetail fields", () => {
    const payload = buildOperatorReconRunDetailJson({
      detail: baseDetail,
      status: "completed",
      startedAt: "2026-01-01T00:01:00.000Z",
      completedAt: "2026-01-01T00:02:00.000Z",
      errorMessage: null,
      summaryMathNote: "math",
      resultContext: {
        latestResultId: "res-1",
        latestResultStatus: "completed",
        latestResultStartedAt: "2026-01-01T00:01:00.000Z",
        latestResultCompletedAt: "2026-01-01T00:02:00.000Z",
        persistedResultCount: 2,
        comparison: null,
      },
      config: {
        sourceAdapter: "stripe",
        targetAdapter: "netsuite",
        reconStrategy: "deterministic",
        templateId: "tpl-1",
        validationRuleCount: 1,
        validationRuleLabels: ["amount • ±0.01"],
        ruleVersionCount: 1,
        ruleVersionLabels: ["rule-a v1"],
        snapshotId: "snap-1",
        inputHash: "hash-1",
        configSource: "snapshot",
        configCapturedAt: "2026-01-01T00:00:59.000Z",
        definitionDriftDetected: false,
        definitionDriftNotes: [],
        summaryBasis: "snapshot",
      },
      exceptions: {
        total: 1,
        pending: 1,
        investigating: 0,
        resolved: 0,
        ignored: 0,
        reviewRequired: 1,
      },
      rowRationaleCodes: ["deterministic_exact"],
      rowResultsPreview: [{ id: "row-1" }],
      stages: [{ id: "stage-1", name: "Stage one", status: "completed" }],
    });

    expect(payload.runKind).toBe("recon_job");
    expect(payload.sourceModel).toBe("recon_jobs");
    expect(payload.kindDetail).toEqual(
      expect.objectContaining({
        kind: "recon_job",
      })
    );
    expect(payload.rowRationale.available).toBe(true);
    expect(payload.resultContext.persistedResultCount).toBe(2);
    expect(payload.traceId).toBeNull();
    expect(payload.metadata).toEqual({});
  });

  it("serializes ingestion_run detail with compatibility note fenced in ingestion kind", () => {
    const detail: CanonicalReconciliationRunDetail = {
      ...baseDetail,
      runKind: "ingestion_run",
      id: "ing-1",
      provenance: {
        sourceModel: "reconciliation_runs",
        runKind: "ingestion_run",
        ingestionId: "ingestion-1",
        reconJobId: null,
      },
      errorMessage: "bad csv",
      traceId: "trace-1",
      metadata: { sourceAdapter: "csv" },
    };

    const payload = buildOperatorIngestionRunDetailJson({
      detail,
      stages: [
        {
          id: "ingestion-reconciliation",
          name: "Ingestion reconciliation",
          status: "failed",
          error: "bad csv",
        },
      ],
    });

    expect(payload.runKind).toBe("ingestion_run");
    expect(payload.sourceModel).toBe("reconciliation_runs");
    expect(payload.kindDetail).toEqual(
      expect.objectContaining({
        kind: "ingestion_run",
      })
    );
    expect(payload.resultContext.latestResultId).toBeNull();
    expect(payload.exceptionWorkflowNote).toContain("recon_job_id");
  });
});
