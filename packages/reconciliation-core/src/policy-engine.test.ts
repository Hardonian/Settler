import { learnFromAdjudication, PolicyEngine } from "./policy-engine.js";

describe("policy-engine", () => {
  it("learnFromAdjudication returns stable codes for resolve path", () => {
    const out = learnFromAdjudication({
      resolutionReason: "duplicate_detected",
      adjudicationType: "auto_resolved",
      exceptionType: "unmatched",
    });
    expect(out.reasoningCodes).toContain("ADJ_PATH_OTHER");
    expect(out.reasoningCodes).toContain("ADJ_SEMANTIC_DUPLICATE");
    expect(out.policyWeightHints.match_duplicate_tolerance).toBeGreaterThanOrEqual(1);
  });

  it("PolicyEngine namespace delegates to learnFromAdjudication", () => {
    expect(
      PolicyEngine.learnFromAdjudication({ adjudicationType: "ignore" }).reasoningCodes
    ).toContain("ADJ_PATH_IGNORE");
  });
});
