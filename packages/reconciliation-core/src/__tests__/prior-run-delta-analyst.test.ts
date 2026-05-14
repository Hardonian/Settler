import {
  buildPriorRunDeltaBriefing,
  buildEvidenceRefs,
} from "../prior-run-delta-analyst.js";

describe("buildPriorRunDeltaBriefing", () => {
  const base = {
    id: "d1",
    currentRunId: "c1",
    previousRunId: "p1",
    jobId: "j1",
    exceptionDelta: 2,
    matchedDelta: -1,
    unmatchedDelta: 3,
    inputChanged: false,
    configDriftDetected: false,
    severityDeltas: { critical: 1, high: 0, medium: 0, low: 0 },
    newExceptionPatterns: ["Timing gap"],
    resolvedPatterns: [],
  };

  it("marks first run when no previous run id", () => {
    const b = buildPriorRunDeltaBriefing({ ...base, previousRunId: null });
    expect(b.posture).toBe("first_run_or_incomparable");
    expect(b.basis.priorRunPresent).toBe(false);
  });

  it("flags config drift in bullets and next steps", () => {
    const b = buildPriorRunDeltaBriefing({ ...base, configDriftDetected: true });
    expect(b.summaryBullets.some((x) => x.includes("Configuration drift"))).toBe(true);
    expect(b.recommendedNextSteps.some((x) => x.includes("configuration"))).toBe(true);
  });

  it("builds evidence refs including prior run when present", () => {
    const refs = buildEvidenceRefs(base);
    expect(refs.map((r) => r.kind)).toEqual(
      expect.arrayContaining(["run_delta", "current_run", "previous_run", "job"])
    );
  });
});
