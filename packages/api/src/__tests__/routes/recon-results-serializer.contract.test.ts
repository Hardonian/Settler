import { serializeReconResult } from "../../routes/v1/recon/serializers";

describe("recon result serializer runtime contract", () => {
  const baseResult: any = {
    id: "result-1",
    reconJobId: "job-1",
    tenantId: "tenant-1",
    executionId: null,
    status: "completed",
    startedAt: new Date("2026-01-01T00:00:00.000Z"),
    completedAt: new Date("2026-01-01T00:00:01.000Z"),
    sourceCount: 2,
    targetCount: 2,
    matchedCount: 2,
    unmatchedSourceCount: 0,
    unmatchedTargetCount: 0,
    conflictCount: 0,
    totalAmountSource: null,
    totalAmountTarget: null,
    totalAmountMatched: null,
    totalAmountUnmatched: null,
    currency: "USD",
    confidenceAvg: null,
    confidenceMin: null,
    confidenceMax: null,
    durationMs: BigInt(1000),
    errorMessage: null,
    errorStack: null,
    summary: {},
    metadata: {
      runtime_matches: [
        {
          transaction_id: "txn_1",
          source_record_id: "src_1",
          target_record_id: "tgt_1",
          classification: "GROUPED_MATCH",
          confidence: 0.92,
          amount_difference_minor: 0,
          date_difference_days: 0,
          group_id: "grp_abc",
          group_member_transaction_ids: ["txn_3", "txn_1", "txn_2"],
          source_member_record_ids: ["src_2", "src_1"],
          target_member_record_ids: ["tgt_2", "tgt_1"],
          grouped_total: 42,
          manual_review_rationale_codes: ["PARTIAL_GROUP_MATCH", "AMBIGUOUS_REFERENCE"],
          is_dispute_related: true,
          is_reversal_related: false,
          dispute_phase: "UNDER_REVIEW",
          linked_dispute_id: "disp_1",
        },
      ],
    },
    proofCapsule: {},
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:01.000Z"),
  };

  it("exposes runtime_matches with normalized deterministic membership ordering", () => {
    const serialized = serializeReconResult(baseResult);
    expect(serialized.runtime_matches).toHaveLength(1);
    const match = serialized.runtime_matches[0]!;
    expect(match.group_member_transaction_ids).toEqual(["txn_1", "txn_2", "txn_3"]);
    expect(match.manual_review_rationale_codes).toEqual([
      "AMBIGUOUS_REFERENCE",
      "PARTIAL_GROUP_MATCH",
    ]);
    expect(match.classification).toBe("GROUPED_MATCH");
    expect(match.is_dispute_related).toBe(true);
    expect(match.dispute_phase).toBe("UNDER_REVIEW");
  });

  it("is deterministic across replay serialization for grouped memberships", () => {
    const first = serializeReconResult(baseResult);
    const second = serializeReconResult(baseResult);
    expect(first.runtime_matches).toEqual(second.runtime_matches);
  });
});
