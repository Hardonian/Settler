import { computeSourceReliabilityProjection } from "./source-reliability.js";

describe("computeSourceReliabilityProjection", () => {
  it("reduces score when proof unavailable and input hash missing", () => {
    const r = computeSourceReliabilityProjection({
      configDriftStatus: "none",
      proofPackagesState: "unavailable",
      inputHashPresent: false,
      comparisonState: "unavailable",
    });
    expect(r.combined).toBeLessThan(1);
    expect(r.reasonCodes).toContain("SRC_PROOF_UNAVAILABLE");
    expect(r.reasonCodes).toContain("SRC_INPUT_HASH_MISSING");
  });
});
