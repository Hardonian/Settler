import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
    policyEvolutionProposal: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    policyMemoryArtifact: { upsert: jest.fn() },
    policyEvolutionProposalReview: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => jest.clearAllMocks());

  it("builds deterministic recurring clusters with explainable recommendations", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m1",
        runId: "run-1",
        sourceTransactionId: "s-tx-1",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.51,
        reviewed: false,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T10:00:00Z"),
        createdAt: new Date("2026-03-28T10:00:00Z"),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
      {
        id: "m2",
        runId: "run-1",
        sourceTransactionId: "s-tx-2",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.54,
        reviewed: true,
        reviewedBy: "user-1",
        reviewedAt: new Date("2026-03-28T11:10:00Z"),
        updatedAt: new Date("2026-03-28T11:10:00Z"),
        createdAt: new Date("2026-03-28T11:00:00Z"),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
      {
        id: "m3",
        runId: "run-1",
        sourceTransactionId: "s-tx-3",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.55,
        reviewed: false,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T12:00:00Z"),
        createdAt: new Date("2026-03-28T12:00:00Z"),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
    ]);

    const snapshot = await service.getSnapshot("tenant-1", 30);

    expect(snapshot.degraded).toBe(false);
    expect(snapshot.clusters[0]?.signature.signature).toHaveLength(20);
    expect(snapshot.clusters[0]?.recommendation.action).toBe("manual_review");
    expect(snapshot.sourceTrustSignals[0]).toMatchObject({ sourceId: "src-1", totalExceptions: 3 });
  });

  it("persists and returns deterministic policy evolution proposals", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      ...Array.from({ length: 3 }).map((_, i) => ({
        id: `m-${i}`,
        runId: "run-1",
        sourceTransactionId: `s-tx-${i}`,
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.51,
        reviewed: i === 0,
        reviewedAt: i === 0 ? new Date("2026-03-28T11:10:00Z") : null,
        reviewedBy: i === 0 ? "user-1" : null,
        updatedAt: new Date("2026-03-28T11:10:00Z"),
        createdAt: new Date(`2026-03-28T1${i}:00:00Z`),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      })),
    ]);
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([
      {
        proposalKey: "proposal-1",
        proposalType: "manual_guardrail",
        why: "reason",
        historicalSupport: {
          sampleSize: 3,
          signature: "sig-a",
          resolutionDistribution: {},
          operatorReviewedRate: 0.3,
        },
        impactSummary: { supported: [], unsupported: [], estimate: {} },
        riskFlags: [],
        missingData: ["limited_longitudinal_history"],
        status: "pending_review",
        createdAt: new Date("2026-03-29T00:00:00Z"),
      },
    ]);

    const data = await service.listPolicyEvolutionProposals("tenant-1", 30);

    expect(prisma.policyEvolutionProposal.upsert).toHaveBeenCalled();
    expect(prisma.policyMemoryArtifact.upsert).toHaveBeenCalled();
    expect(data[0]?.proposalId).toBe("proposal-1");
  });

  it("returns degraded proof graph when run is missing", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue(null);
    const graph = await service.getProofGraph("tenant-1", "run-1");
    expect(graph.degraded).toBe(true);
    expect(graph.degradedReasons).toContain("run_not_found_or_not_scoped");
  });

  it("marks category completeness in evidence pack", async () => {
    prisma.reconciliationRun.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "completed", matches: [], provenance: [] });

    const pack = await service.buildEvidencePack("tenant-1", "run-1");

    expect(pack.completenessByCategory["policyReferences"]?.complete).toBe(false);
    expect(pack.completenessByCategory["provenanceRecords"]?.degraded).toBe(true);
  });

  it("stores proposal review transitions", async () => {
    prisma.policyEvolutionProposal.findFirst.mockResolvedValue({
      id: "p1",
      status: "pending_review",
    });
    prisma.$transaction.mockResolvedValue([]);

    const result = await service.reviewPolicyEvolutionProposal("tenant-1", "proposal-1", {
      action: "approve",
      actorUserId: "user-1",
      reason: "evidence stable",
    });

    expect(result).toMatchObject({ found: true, status: "approved" });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("marks unsupported policy metrics explicitly", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue(null);
    const result = await service.simulatePolicy("tenant-1", {
      runId: "run-1",
      candidatePolicy: {
        amountTolerance: 1,
        dateWindowDays: 2,
        fuzzyDescriptionThreshold: 0.8,
        requireExactAmount: false,
      },
    });

    expect(result.metricSupport.falsePositiveRate).toBe("unsupported");
    expect(result.degradedReasons).toContain("run_not_found_or_not_scoped");
  });

  it("retrieves decision history with tenant-scoped filters", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m1",
        runId: "run-1",
        sourceTransactionId: "s1",
        matchType: "manual",
        matchReason: "ignored by operator",
        metadata: {},
        confidence: 0.5,
        reviewed: true,
        reviewedBy: "user-1",
        reviewedAt: new Date("2026-03-29T01:00:00Z"),
        updatedAt: new Date("2026-03-29T01:00:00Z"),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          source: { name: "Stripe" },
        },
      },
    ]);
    prisma.policyEvolutionProposalReview.findMany.mockResolvedValue([
      {
        id: "r1",
        action: "approve",
        actorUserId: "user-2",
        reason: "ok",
        priorStatus: "pending_review",
        resultingStatus: "approved",
        createdAt: new Date("2026-03-29T01:05:00Z"),
        proposal: { signatureKey: "sig-1" },
      },
    ]);

    const history = await service.getDecisionHistory("tenant-1", { signature: "sig-1" });
    expect(history[0]?.provenanceType).toBe("proposal_review");
    expect(prisma.reconciliationMatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-1" }) })
    );
  });
});
