import type { OperatorRunDetail } from "@/types/operator-run-detail";
import {
  deriveOperatorRunAttention,
  deriveOperatorRunNextActions,
} from "@/lib/runs/operator-run-truth";

function baseRun(overrides: Partial<OperatorRunDetail> = {}): OperatorRunDetail {
  const compactProofSummary: OperatorRunDetail["compactProofSummary"] = {
    proofPackages: {
      total: 1,
      finalized: 1,
      bestCompletenessScore: 1,
      missingEvidenceCount: 0,
      latestCreatedAt: null,
      state: "ready",
      degradedEvidenceReasons: [],
    },
    recurrence: {
      exceptionsWithMemories: 0,
      repeatedResolutionReasons: [],
      state: "ready",
      topRecurringFamilies: [],
    },
    delta: {
      changedSincePreviousRun: "unchanged",
      summary: "ok",
      state: "available",
      certainty: "high",
      reasonCodes: [],
      baseline: { priorResultId: null, priorResultStartedAt: null },
      history: {
        lookbackWindow: 2,
        comparableWindowCount: 2,
        certainty: "high",
        trend: "stable",
        pattern: "stable_pattern",
        reasonCodes: [],
        summary: "Stable.",
      },
      deltas: {
        matched: 0,
        unmatched: 0,
        conflicts: 0,
        proofCompleteness: "unchanged",
        recurringFamilyConcentration: "stable",
      },
    },
    operatorSummary: {
      signal: "strong",
      pattern: "stable_pattern",
      changedSincePreviousRun: "unchanged",
      proofPosture: "stronger",
      primaryReasonCodes: [],
      recurringFamilies: [],
      summary: "Strong signal.",
      explainerCodes: [],
    },
  };

  return {
    runKind: "recon_job",
    sourceModel: "recon_jobs",
    id: "r1",
    detailHref: "/console/runs/r1",
    name: "Test",
    status: "completed",
    statusLabel: "Completed",
    isTerminal: true,
    progress: 100,
    progressState: "done",
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:01:00.000Z",
    summary: {
      total: 100,
      sourceCount: 50,
      targetCount: 50,
      matched: 95,
      unmatched: 5,
      unmatchedSourceCount: 2,
      unmatchedTargetCount: 3,
      conflicts: 0,
    },
    summarySemantics: {
      processed: 100,
      matchedWithTolerance: 0,
      exceptioned: 5,
      unresolved: 5,
      ignored: 0,
      resolved: 0,
    },
    summaryState: "success",
    summaryMath: {
      sourceCount: 50,
      targetCount: 50,
      matchedCount: 95,
      unmatchedSourceCount: 2,
      unmatchedTargetCount: 3,
      conflictCount: 0,
      note: "",
    },
    provenance: {
      sourceModel: "recon_jobs",
      runKind: "recon_job",
      ingestionId: null,
      reconJobId: "r1",
      executedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:01:00.000Z",
      sourceAdapter: "a",
      targetAdapter: "b",
    },
    resultContext: {
      latestResultId: null,
      latestResultStatus: null,
      latestResultStartedAt: null,
      latestResultCompletedAt: null,
      persistedResultCount: 0,
      comparison: null,
    },
    config: {
      sourceAdapter: "a",
      targetAdapter: "b",
      reconStrategy: null,
      templateId: null,
      validationRuleCount: 0,
      validationRuleLabels: [],
      ruleVersionCount: 0,
      ruleVersionLabels: [],
      snapshotId: null,
      inputHash: null,
      configSource: "snapshot",
      configCapturedAt: null,
      definitionDriftDetected: false,
      definitionDriftNotes: [],
      summaryBasis: "",
    },
    configDrift: { status: "none", adapter: "none" },
    exceptions: {
      total: 0,
      pending: 0,
      investigating: 0,
      resolved: 0,
      ignored: 0,
      reviewRequired: 0,
    },
    rowRationale: { available: false, rowCount: 0, codes: [] },
    rowResultsPreview: [],
    stages: [],
    compactProofSummary,
    kindDetail: {
      kind: "recon_job",
      reconJob: { rowRationale: { available: false, rowCount: 0, codes: [] } },
    },
    ...overrides,
  };
}

describe("deriveOperatorRunAttention", () => {
  it("returns empty when run is clean and proof is strong", () => {
    expect(deriveOperatorRunAttention(baseRun())).toEqual([]);
  });

  it("surfaces run error as critical", () => {
    const items = deriveOperatorRunAttention(baseRun({ error: "Upstream timeout" }));
    expect(items.some((i) => i.code === "run_error" && i.severity === "critical")).toBe(true);
  });

  it("surfaces review-required exceptions", () => {
    const items = deriveOperatorRunAttention(
      baseRun({
        exceptions: {
          total: 2,
          pending: 1,
          investigating: 0,
          resolved: 0,
          ignored: 0,
          reviewRequired: 2,
        },
      })
    );
    expect(items.some((i) => i.code === "exceptions_review")).toBe(true);
  });

  it("does not duplicate ingestion exception note on recon_job", () => {
    const items = deriveOperatorRunAttention(
      baseRun({ exceptionWorkflowNote: "Should not show for recon_job" })
    );
    expect(items.some((i) => i.code === "ingestion_exception_scope")).toBe(false);
  });

  it("shows ingestion exception note only for ingestion_run", () => {
    const items = deriveOperatorRunAttention(
      baseRun({
        runKind: "ingestion_run",
        sourceModel: "recon_results",
        exceptionWorkflowNote: "Keyed differently",
      })
    );
    expect(items.some((i) => i.code === "ingestion_exception_scope")).toBe(true);
  });
});

describe("deriveOperatorRunNextActions", () => {
  it("suggests exceptions when queue has work", () => {
    const actions = deriveOperatorRunNextActions(
      baseRun({
        exceptions: {
          total: 1,
          pending: 1,
          investigating: 0,
          resolved: 0,
          ignored: 0,
          reviewRequired: 0,
        },
      })
    );
    expect(actions.some((a) => a.href?.startsWith("/console/exceptions"))).toBe(true);
  });

  it("suggests close evidence when terminal and clean", () => {
    const actions = deriveOperatorRunNextActions(
      baseRun({
        summary: {
          total: 10,
          sourceCount: 5,
          targetCount: 5,
          matched: 10,
          unmatched: 0,
          unmatchedSourceCount: 0,
          unmatchedTargetCount: 0,
          conflicts: 0,
        },
      })
    );
    expect(actions.some((a) => a.label.includes("Archive evidence"))).toBe(true);
  });
});
