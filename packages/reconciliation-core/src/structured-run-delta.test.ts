import { compareRunsForStructuredDelta, type DeltaRunInput } from "./structured-run-delta.js";

const previous: DeltaRunInput = {
  id: "run-prev",
  completedAt: "2026-01-01T00:00:00.000Z",
  totals: { matched: 10, unmatched: 2, conflicts: 1 },
  issues: [
    {
      key: "timing:1",
      category: "timing",
      severity: "medium",
      status: "open",
      summary: "Bank settlement arrived late",
      evidenceRefs: ["txn-1"],
    },
    {
      key: "amount:1",
      category: "amount",
      severity: "low",
      status: "open",
      summary: "Small amount mismatch",
      evidenceRefs: ["txn-2"],
    },
  ],
};

describe("compareRunsForStructuredDelta", () => {
  it("returns zero diff for identical runs", () => {
    const delta = compareRunsForStructuredDelta({
      current: { ...previous, id: "run-current" },
      previous,
    });

    expect(delta.state).toBe("VERIFIED");
    expect(delta.newIssues).toEqual([]);
    expect(delta.resolvedIssues).toEqual([]);
    expect(delta.regressions).toEqual([]);
    expect(delta.reasonCodes).toEqual(["zero_diff"]);
    expect(delta.metricDelta).toEqual({ matched: 0, unmatched: 0, conflicts: 0 });
  });

  it("detects new, resolved, and regressed issues precisely", () => {
    const current: DeltaRunInput = {
      id: "run-current",
      completedAt: "2026-01-02T00:00:00.000Z",
      totals: { matched: 9, unmatched: 4, conflicts: 3 },
      issues: [
        {
          key: "timing:1",
          category: "timing",
          severity: "critical",
          status: "open",
          summary: "Bank settlement arrived late",
          evidenceRefs: ["txn-1", "txn-3"],
        },
        {
          key: "fee:1",
          category: "fee",
          severity: "high",
          status: "open",
          summary: "Processor fee missing",
          evidenceRefs: ["txn-4"],
        },
      ],
    };

    const delta = compareRunsForStructuredDelta({ current, previous });

    expect(delta.newIssues.map((issue) => issue.key)).toEqual(["fee:1"]);
    expect(delta.resolvedIssues.map((issue) => issue.key)).toEqual(["amount:1"]);
    expect(delta.regressions).toHaveLength(1);
    expect(delta.regressions[0]).toMatchObject({
      key: "timing:1",
      previousSeverity: "medium",
      currentSeverity: "critical",
      reasonCodes: ["severity_regressed"],
    });
    expect(delta.metricDelta).toEqual({ matched: -1, unmatched: 2, conflicts: 2 });
  });

  it("is explicitly unavailable without a prior run", () => {
    const delta = compareRunsForStructuredDelta({ current: previous, previous: null });

    expect(delta.state).toBe("UNAVAILABLE");
    expect(delta.previousRunId).toBeNull();
    expect(delta.reasonCodes).toEqual(["prior_run_missing"]);
  });
});
