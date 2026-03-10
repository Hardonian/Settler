import express from "express";
import request from "supertest";

jest.mock("../../middleware/auth", () => ({
  authMiddleware: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/tenant", () => ({
  tenantMiddleware: (req: any, _res: unknown, next: () => void) => {
    req.tenantId = "tenant-1";
    next();
  },
}));

describe("GET /api/v1/recon/results/:resultId runtime contract", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serializes runtime_matches with grouped membership determinism", async () => {
    const { ReconCoreEngine } = await import("../../services/recon-core");
    jest.spyOn(ReconCoreEngine.prototype, "getReconResult").mockResolvedValue({
      id: "result-1",
      reconJobId: "job-1",
      tenantId: "tenant-1",
      executionId: null,
      status: "completed",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: new Date("2026-01-01T00:00:01.000Z"),
      sourceCount: 3,
      targetCount: 3,
      matchedCount: 3,
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
      durationMs: null,
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
            confidence: 0.95,
            amount_difference_minor: 0,
            date_difference_days: 0,
            group_id: "grp_1",
            group_member_transaction_ids: ["txn_2", "txn_1", "txn_3"],
            source_member_record_ids: ["src_2", "src_1"],
            target_member_record_ids: ["tgt_2", "tgt_1"],
            grouped_total: 120,
            manual_review_rationale_codes: ["PARTIAL_GROUP_MATCH"],
            is_dispute_related: false,
            is_reversal_related: false,
          },
        ],
      },
      proofCapsule: {},
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:01.000Z"),
      reconJob: null,
    } as any);

    const resultsRouter = (await import("../../routes/v1/recon/results")).default;
    const app = express();
    app.use("/api/v1/recon/results", resultsRouter);

    const response = await request(app).get("/api/v1/recon/results/result-1").expect(200);
    expect(response.body.data.runtime_matches).toHaveLength(1);
    expect(response.body.data.runtime_matches[0].group_member_transaction_ids).toEqual([
      "txn_1",
      "txn_2",
      "txn_3",
    ]);
  });
});
