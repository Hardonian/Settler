import { classifyRunDelta } from "./run-delta-classification.js";

describe("classifyRunDelta", () => {
  it("flags input_or_config_change when input or config drift", () => {
    const c = classifyRunDelta({
      matchedDelta: 0,
      unmatchedDelta: 0,
      exceptionDelta: 0,
      inputChanged: true,
      configDriftDetected: false,
    });
    expect(c.category).toBe("input_or_config_change");
    expect(c.reasoningCodes).toContain("DELTA_INPUT_CHANGED");
  });

  it("elevates anomaly severity on critical delta", () => {
    const c = classifyRunDelta({
      matchedDelta: -1,
      unmatchedDelta: 2,
      exceptionDelta: 1,
      inputChanged: false,
      configDriftDetected: false,
      criticalDelta: 1,
    });
    expect(c.anomalySeverity).toBe("high");
    expect(c.reasoningCodes).toContain("DELTA_SEVERITY_HIGH");
  });
});
