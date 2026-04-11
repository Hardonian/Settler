import { buildExceptionProofLineage } from "./exception-detail-intelligence.js";
import type { ExceptionRunComparisonSnapshot } from "./exception-run-comparison.js";

describe("buildExceptionProofLineage", () => {
  it("exposes prior run result id only when comparison is available with baseline", () => {
    const snap: ExceptionRunComparisonSnapshot = {
      available: true,
      state: "available",
      certainty: "high",
      reasonCodes: [],
      summary: "ok",
      baseline: { priorResultId: "res-1", priorResultStartedAt: "2026-01-01T00:00:00.000Z" },
      deltas: {
        matched: 1,
        unmatched: 0,
        conflicts: 0,
        proofCompleteness: "unchanged",
        recurringFamilyConcentration: "stable",
      },
      changedSincePreviousRun: "unchanged",
      history: {
        lookbackWindow: 3,
        comparableWindowCount: 2,
        certainty: "high",
        trend: "stable",
        pattern: "stable_pattern",
        reasonCodes: [],
        summary: "ok",
      },
    };
    const lineage = buildExceptionProofLineage({
      runId: "run-1",
      evidenceArtifactIds: ["e1"],
      proofPackageIds: ["p1"],
      adjudicationMemoryIds: ["m1"],
      runComparison: snap,
    });
    expect(lineage.priorRunResultId).toBe("res-1");
  });

  it("does not fabricate prior result when comparison unavailable", () => {
    const snap: ExceptionRunComparisonSnapshot = {
      available: false,
      state: "unavailable",
      certainty: "low",
      reasonCodes: ["baseline_missing"],
      summary: "no",
      baseline: { priorResultId: null, priorResultStartedAt: null },
      deltas: {
        matched: null,
        unmatched: null,
        conflicts: null,
        proofCompleteness: "unavailable",
        recurringFamilyConcentration: "unavailable",
      },
      changedSincePreviousRun: "unavailable",
      history: {
        lookbackWindow: 0,
        comparableWindowCount: 0,
        certainty: "low",
        trend: "unavailable",
        pattern: "unavailable",
        reasonCodes: ["history_missing"],
        summary: "—",
      },
    };
    const lineage = buildExceptionProofLineage({
      runId: "run-1",
      evidenceArtifactIds: [],
      proofPackageIds: [],
      adjudicationMemoryIds: [],
      runComparison: snap,
    });
    expect(lineage.priorRunResultId).toBeNull();
  });
});
