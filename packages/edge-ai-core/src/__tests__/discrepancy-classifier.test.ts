import { classifyDiscrepancy, verifyDiscrepancyArithmeticProof } from "../discrepancy-classifier";

describe("Deterministic Discrepancy Classifier (Edge AI Core)", () => {
  it("computes exact mathematical proof for PROCESSOR_FEE_DEDUCTION", () => {
    // Gross: $5000.00, Standard Stripe 2.9% + $0.30 fee = $145.30 -> Net = $4854.70
    const result = classifyDiscrepancy({
      sourceAmount: 5000.0,
      targetAmount: 4854.7,
      sourceCurrency: "USD",
      targetCurrency: "USD",
      sourceTimestamp: "2026-10-18T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
      processorFeeSchedule: {
        basisPoints: 290,
        fixedFeeMinorUnits: 0.3,
      },
    });

    expect(result.rootCause).toBe("PROCESSOR_FEE_DEDUCTION");
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.proof.isMathematicallyProven).toBe(true);
    expect(result.proof.delta).toBe(0);
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(true);
  });

  it("computes exact mathematical proof for FX_CONVERSION_SPREAD", () => {
    // USD $1000.00 -> EUR 925.00 (implied rate = 0.9250 vs declared rate = 0.9200)
    const result = classifyDiscrepancy({
      sourceAmount: 1000.0,
      targetAmount: 925.0,
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      sourceTimestamp: "2026-10-18T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
      declaredFxRate: 0.92,
      fxTolerancePercentage: 0.02,
    });

    expect(result.rootCause).toBe("FX_CONVERSION_SPREAD");
    expect(result.proof.isMathematicallyProven).toBe(true);
    expect(result.groundedAttributes.impliedExchangeRate).toBe(0.925);
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(true);
  });

  it("computes exact mathematical proof for SETTLEMENT_TIMING_DRIFT spanning weekends", () => {
    // Friday authorization -> Monday clearing (72 hours gap)
    const result = classifyDiscrepancy({
      sourceAmount: 1500.0,
      targetAmount: 1500.0,
      sourceCurrency: "USD",
      targetCurrency: "USD",
      sourceTimestamp: "2026-10-16T17:00:00Z", // Friday
      targetTimestamp: "2026-10-19T09:00:00Z", // Monday
    });

    expect(result.rootCause).toBe("SETTLEMENT_TIMING_DRIFT");
    expect(result.proof.isMathematicallyProven).toBe(true);
    expect(result.groundedAttributes.spansWeekend).toBe(true);
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(true);
  });

  it("computes exact edit distance proof for REFERENCE_ID_MUTATION", () => {
    // Stripped processor prefix ch_12345ABC -> 12345ABC
    const result = classifyDiscrepancy({
      sourceAmount: 250.0,
      targetAmount: 250.0,
      sourceCurrency: "USD",
      targetCurrency: "USD",
      sourceTimestamp: "2026-10-18T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
      sourceReferenceId: "ch_9876543210fedcba",
      targetReferenceId: "9876543210fedcba",
    });

    expect(result.rootCause).toBe("REFERENCE_ID_MUTATION");
    expect(result.proof.isMathematicallyProven).toBe(true);
    expect(result.groundedAttributes.prefixStripped).toBe(true);
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(true);
  });

  it("does not call a generic fee-range heuristic a mathematical proof", () => {
    const result = classifyDiscrepancy({
      sourceAmount: 100,
      targetAmount: 98,
      sourceCurrency: "USD",
      targetCurrency: "USD",
      sourceTimestamp: "2026-10-18T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
      processorFeeSchedule: { basisPoints: 290, fixedFeeMinorUnits: 0.3 },
    });

    expect(result.rootCause).toBe("UNKNOWN_DISCREPANCY");
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(false);
  });

  it("does not prove an FX spread without a declared comparison rate", () => {
    const result = classifyDiscrepancy({
      sourceAmount: 100,
      targetAmount: 91,
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      sourceTimestamp: "2026-10-18T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
    });

    expect(result.rootCause).toBe("FX_CONVERSION_SPREAD");
    expect(result.proof.isMathematicallyProven).toBe(false);
    expect(verifyDiscrepancyArithmeticProof(result)).toBe(false);
  });

  it("rejects timing deltas outside the stated clearing bound", () => {
    const result = classifyDiscrepancy({
      sourceAmount: 100,
      targetAmount: 100,
      sourceCurrency: "USD",
      targetCurrency: "USD",
      sourceTimestamp: "2026-09-01T10:00:00Z",
      targetTimestamp: "2026-10-18T10:00:00Z",
    });

    expect(result.rootCause).toBe("UNKNOWN_DISCREPANCY");
    expect(result.proof.isMathematicallyProven).toBe(false);
  });

  it("rejects non-finite inputs instead of emitting a false proof", () => {
    expect(() =>
      classifyDiscrepancy({
        sourceAmount: Number.NaN,
        targetAmount: 100,
        sourceCurrency: "USD",
        targetCurrency: "USD",
        sourceTimestamp: "2026-10-18T10:00:00Z",
        targetTimestamp: "2026-10-18T10:00:00Z",
      })
    ).toThrow(/finite/);
  });
});
