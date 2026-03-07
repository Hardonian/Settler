import { buildReplayLabReport } from "@/lib/replay-lab/engine";

describe("replay lab engine", () => {
  it("builds deterministic reports for the same execution id", () => {
    const first = buildReplayLabReport("exec_123");
    const second = buildReplayLabReport("exec_123");

    expect(second).toEqual(first);
    expect(first.timeline).toHaveLength(6);
    expect(first.summary.totalSteps).toBe(6);
  });

  it("produces coherent diff metadata when divergence exists", () => {
    const report = buildReplayLabReport("exec_policy_002");

    const sourceTotals = Object.values(report.summary.divergenceSources).reduce(
      (total, count) => total + count,
      0
    );

    expect(report.summary.divergedSteps).toBe(sourceTotals);

    for (const entry of report.diff.entries) {
      expect(["connector_output", "policy_change", "artifact_mutation"]).toContain(entry.source);
      expect(entry.path).toContain("step-");
    }
  });
});
