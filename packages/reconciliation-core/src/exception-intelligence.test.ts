import {
  buildExceptionFamilySummary,
  normalizeExceptionResolutionReason,
  predictExceptionArchetype,
} from "./exception-intelligence.js";

describe("exception intelligence", () => {
  it("normalizes free-form reasons into stable resolution codes without losing explicit reasons", () => {
    const result = normalizeExceptionResolutionReason({
      resolution: "manual",
      explicitReason: "duplicate payout imported twice",
    });

    expect(result.resolutionReason).toBe("duplicate payout imported twice");
    expect(result.resolutionCode).toBe("DUPLICATE_RECORD_CONFIRMED");
    expect(result.source).toBe("reason_keyword");
  });

  it("uses note keywords for workbench actions when no explicit reason is provided", () => {
    const result = normalizeExceptionResolutionReason({
      resolution: "ignored",
      note: "False positive caused by expected settlement timing window",
      action: "ignore",
    });

    expect(result.resolutionReason).toBe("timing difference accepted");
    expect(result.resolutionCode).toBe("TIMING_DIFFERENCE_ACCEPTED");
    expect(result.source).toBe("note_keyword");

    const pluralFalsePositive = normalizeExceptionResolutionReason({
      resolution: "ignored",
      note: "Bulk ignore - false positives",
      action: "ignore",
    });

    expect(pluralFalsePositive.resolutionReason).toBe("false positive confirmed");
    expect(pluralFalsePositive.resolutionCode).toBe("FALSE_POSITIVE_CONFIRMED");
    expect(pluralFalsePositive.source).toBe("note_keyword");
  });

  it("predicts amount mismatch families deterministically", () => {
    const prediction = predictExceptionArchetype({
      matchType: "unmatched",
      amountDiff: 125.25,
      dateDiff: 0,
      confidence: 0.64,
      hasTargetTransaction: true,
    });

    expect(prediction.code).toBe("AMOUNT_MISMATCH");
    expect(prediction.category).toBe("amount");
    expect(prediction.typicalResolutionCode).toBe("AMOUNT_VARIANCE_ACCEPTED");
    expect(prediction.matchFeatures).toEqual({ amountDiff: 125.25 });
  });

  it("builds family summaries from supporting cases and reopened history", () => {
    const summary = buildExceptionFamilySummary({
      currentExceptionId: "exc-current",
      currentStatus: "open",
      familyCode: "AMOUNT_MISMATCH",
      familyLabel: "Amount Mismatch",
      familyCategory: "amount",
      memories: [
        {
          exceptionId: "exc-1",
          resolution: "manual",
          resolutionReason: "duplicate payout imported twice",
          resolutionCode: "DUPLICATE_RECORD_CONFIRMED",
          outcome: "resolved",
          adjudicationType: "initial",
          confidence: 0.92,
          sourceTrustScore: 0.95,
          createdAt: "2026-04-01T10:00:00.000Z",
        },
        {
          exceptionId: "exc-2",
          resolution: "manual",
          resolutionReason: "duplicate payout imported twice",
          resolutionCode: "DUPLICATE_RECORD_CONFIRMED",
          outcome: "resolved",
          adjudicationType: "initial",
          confidence: 0.91,
          sourceTrustScore: 0.93,
          createdAt: "2026-04-03T10:00:00.000Z",
        },
        {
          exceptionId: "exc-2",
          resolution: "manual",
          resolutionReason: "duplicate payout imported twice",
          resolutionCode: "DUPLICATE_RECORD_CONFIRMED",
          outcome: "re_adjudicated",
          adjudicationType: "re_adjudication",
          confidence: 0.89,
          sourceTrustScore: 0.9,
          createdAt: "2026-04-04T10:00:00.000Z",
        },
      ],
    });

    expect(summary.state).toBe("available");
    expect(summary.totalCases).toBe(3);
    expect(summary.supportingCaseCount).toBe(2);
    expect(summary.reopenedCaseCount).toBe(1);
    expect(summary.recurrencePosture).toBe("worsening");
    expect(summary.dominantResolutionCode).toBe("DUPLICATE_RECORD_CONFIRMED");
    expect(summary.dominantResolutionReason).toBe("duplicate record confirmed");
  });

  it("returns building state when a family is classified but has no supporting history yet", () => {
    const summary = buildExceptionFamilySummary({
      currentExceptionId: "exc-current",
      currentStatus: "open",
      familyCode: "DATE_DRIFT",
      familyLabel: "Date Drift",
      familyCategory: "timing",
      memories: [],
    });

    expect(summary.state).toBe("building");
    expect(summary.supportingCaseCount).toBe(0);
    expect(summary.recurrencePosture).toBe("unavailable");
    expect(summary.reasonCodes).toContain("family_history_building");
  });
});
