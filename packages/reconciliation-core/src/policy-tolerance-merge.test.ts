import { applyPolicyHintsToTolerances } from "./policy-tolerance-merge.js";

describe("applyPolicyHintsToTolerances", () => {
  it("widens amount tolerance when duplicate adjudication hints present", () => {
    const out = applyPolicyHintsToTolerances(
      { amountTolerance: 0.01, dateToleranceDays: 3 },
      { match_duplicate_tolerance: 3 }
    );
    expect(out.amountTolerance).toBeGreaterThan(0.01);
    expect(out.appliedReasonCodes.length).toBeGreaterThan(0);
  });

  it("is bounded", () => {
    const out = applyPolicyHintsToTolerances(
      { amountTolerance: 0.01, dateToleranceDays: 3 },
      {
        match_duplicate_tolerance: 1000,
        tolerance_date: 100,
        tolerance_amount: 1000,
      }
    );
    expect(out.amountTolerance).toBeLessThanOrEqual(5);
    expect(out.dateToleranceDays).toBeLessThanOrEqual(30);
  });
});
