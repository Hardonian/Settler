import {
  buildWorkbenchItem,
  compareWorkbenchRuns,
} from "../../routes/v1/reconciliation-trust-contract";

describe("reconciliation trust contract", () => {
  const baseRow = {
    id: "m-1",
    run_id: "run-1",
    match_type: "manual",
    confidence: 0.62,
    match_reason: "requires human check",
    amount_diff: 0.25,
    date_diff: 12,
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
    metadata: {
      group_id: "grp-1",
      status_conflict: true,
      rationale_codes: ["RULE_PATH_STATUS_CONFLICT"],
      group_member_source_transaction_ids: ["src-2", "src-1"],
      group_member_target_transaction_ids: ["tgt-2", "tgt-1"],
      is_dispute_related: true,
      review_state: "escalated",
    },
    source_id: "src-1",
    source_amount: 100,
    source_currency: "USD",
    source_date: new Date("2026-01-01T00:00:00.000Z"),
    source_description: "source",
    source_external_id: "ext-1",
    target_id: "tgt-1",
    target_amount: 99.75,
    target_currency: "USD",
    target_date: new Date("2026-01-13T00:00:00.000Z"),
    target_description: "target",
    target_external_id: "ext-tgt-1",
  } as const;

  it("builds deterministic workbench explanations from runtime fields", () => {
    const item = buildWorkbenchItem(baseRow as never, {
      config: { amountTolerance: 0.01, dateWindowDays: 7, fuzzyDescriptionThreshold: 0.8 },
    });

    expect(item.queue).toBe("status_conflict");
    expect(item.reviewState).toBe("escalated");
    expect(item.explanation.groupedEvidence.groupMemberSourceTransactionIds).toEqual([
      "src-1",
      "src-2",
    ]);
    expect(item.explanation.manualReview.reasonCodes).toContain("AMOUNT_VARIANCE_EXCEEDED");
    expect(item.explanation.manualReview.reasonCodes).toContain("DATE_WINDOW_EXCEEDED");
    expect(item.explanation.disputeRelevance.isDisputeRelated).toBe(true);
    expect(item.explanation.rationaleCodes).toEqual(["RULE_PATH_STATUS_CONFLICT"]);
  });

  it("computes run diff summaries across classifications and variances", () => {
    const fromItem = buildWorkbenchItem(baseRow as never, { config: {} });
    const toItem = buildWorkbenchItem(
      {
        ...baseRow,
        run_id: "run-2",
        match_type: "exact",
        confidence: 1,
        amount_diff: 0,
        date_diff: 0,
        metadata: { review_state: "reviewed" },
      } as never,
      { config: {} }
    );

    const comparison = compareWorkbenchRuns([fromItem], [toItem], "run-1", "run-2");

    expect(comparison.summary.counts.classificationChanges).toBe(1);
    expect(comparison.summary.counts.varianceChanges).toBe(1);
    expect(comparison.summary.counts.newlyMatched).toBe(1);
    expect(comparison.changes).toHaveLength(1);
    expect(comparison.changes[0]?.classification).toEqual({ from: "manual", to: "exact" });
  });
});
