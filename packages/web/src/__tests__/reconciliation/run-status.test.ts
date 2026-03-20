import {
  buildCanonicalRunTruth,
  buildRunSummary,
  deriveRunStatus,
  extractProgressPercent,
  getRunProgressState,
  getRunSummaryState,
  isTerminalRunState,
  normalizeRunStatus,
  toStageRows,
} from "@/lib/reconciliation/run-status";

describe("run-status helpers", () => {
  test("prefers latest result status over job status", () => {
    expect(deriveRunStatus("active", "completed")).toBe("completed");
    expect(deriveRunStatus("failed", "running")).toBe("running");
    expect(deriveRunStatus("pending", null)).toBe("pending");
  });

  test("normalizes unknown states safely", () => {
    expect(normalizeRunStatus("ACTIVE")).toBe("pending");
    expect(normalizeRunStatus("queued")).toBe("pending");
    expect(normalizeRunStatus("succeeded")).toBe("completed");
    expect(normalizeRunStatus("failed")).toBe("failed");
    expect(normalizeRunStatus(undefined)).toBe("unknown");
  });

  test("builds summary deterministically", () => {
    expect(
      buildRunSummary({
        id: "r1",
        recon_job_id: "j1",
        status: "completed",
        started_at: "2026-01-01T00:00:00.000Z",
        completed_at: "2026-01-01T00:00:10.000Z",
        source_count: 8,
        target_count: 10,
        matched_count: 7,
        unmatched_source_count: 1,
        unmatched_target_count: 3,
        conflict_count: 2,
      })
    ).toEqual({
      total: 18,
      sourceCount: 8,
      targetCount: 10,
      matched: 7,
      unmatched: 4,
      unmatchedSourceCount: 1,
      unmatchedTargetCount: 3,
      conflicts: 2,
    });
  });

  test("extracts progress from metadata and clamps range", () => {
    expect(
      extractProgressPercent({
        id: "r1",
        recon_job_id: "j1",
        status: "running",
        started_at: null,
        completed_at: null,
        source_count: null,
        target_count: null,
        matched_count: null,
        unmatched_source_count: null,
        unmatched_target_count: null,
        conflict_count: null,
        metadata: { progress: { percentage: 135 } },
      })
    ).toBe(100);

    expect(
      extractProgressPercent({
        id: "r1",
        recon_job_id: "j1",
        status: "running",
        started_at: null,
        completed_at: null,
        source_count: null,
        target_count: null,
        matched_count: null,
        unmatched_source_count: null,
        unmatched_target_count: null,
        conflict_count: null,
        metadata: { progress: { percentage: -2 } },
      })
    ).toBe(0);
  });

  test("maps audit rows to visible stages with failure reason", () => {
    expect(
      toStageRows([
        {
          id: "a1",
          audit_type: "recon_completed",
          action: "completed",
          metadata: {},
          created_at: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "a2",
          audit_type: "recon_failed",
          action: "execute",
          metadata: { error: "timeout" },
          created_at: "2026-01-01T00:01:00.000Z",
        },
      ])
    ).toEqual([
      {
        id: "a1",
        name: "recon completed",
        status: "completed",
        startedAt: undefined,
        completedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "a2",
        name: "recon failed",
        status: "failed",
        startedAt: undefined,
        completedAt: "2026-01-01T00:01:00.000Z",
        error: "timeout",
      },
    ]);
  });

  test("buildCanonicalRunTruth keeps list/detail truth invariant", () => {
    const raw = {
      id: "r1",
      recon_job_id: "j1",
      status: "succeeded",
      started_at: "2026-01-01T00:00:00.000Z",
      completed_at: "2026-01-01T00:00:10.000Z",
      source_count: 10,
      target_count: 10,
      matched_count: 9,
      unmatched_source_count: 1,
      unmatched_target_count: 0,
      conflict_count: 0,
      metadata: { progress: { percentage: 100 } },
    } as const;

    const listTruth = buildCanonicalRunTruth("active", raw);
    const detailTruth = buildCanonicalRunTruth("active", raw);

    expect(listTruth).toEqual(detailTruth);
    expect(listTruth.status).toBe("completed");
    expect(listTruth.summaryState).toBe("review_needed");
    expect(listTruth.progressState).toBe("completed");
    expect(listTruth.isTerminal).toBe(true);
  });

  test("terminal, summary-state and progress-state semantics are coherent", () => {
    expect(isTerminalRunState("pending")).toBe(false);
    expect(isTerminalRunState("completed")).toBe(true);
    expect(isTerminalRunState("failed")).toBe(true);

    expect(
      getRunSummaryState("completed", {
        total: 10,
        sourceCount: 5,
        targetCount: 5,
        matched: 10,
        unmatched: 0,
        unmatchedSourceCount: 0,
        unmatchedTargetCount: 0,
        conflicts: 0,
      })
    ).toBe("success");
    expect(
      getRunSummaryState("completed", {
        total: 10,
        sourceCount: 5,
        targetCount: 5,
        matched: 9,
        unmatched: 1,
        unmatchedSourceCount: 1,
        unmatchedTargetCount: 0,
        conflicts: 0,
      })
    ).toBe("review_needed");
    expect(
      getRunSummaryState("failed", {
        total: 10,
        sourceCount: 5,
        targetCount: 5,
        matched: 0,
        unmatched: 10,
        unmatchedSourceCount: 5,
        unmatchedTargetCount: 5,
        conflicts: 0,
      })
    ).toBe("failed");

    expect(getRunProgressState("pending", 0)).toBe("not_started");
    expect(getRunProgressState("running", 42)).toBe("in_progress");
    expect(getRunProgressState("completed", 100)).toBe("completed");
    expect(getRunProgressState("failed", 100)).toBe("failed");
  });
});
