import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
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
        sourceTransactionId: "s-tx-1",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.51,
        reviewed: false,
        reviewedAt: null,
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
        sourceTransactionId: "s-tx-2",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.54,
        reviewed: true,
        reviewedAt: new Date("2026-03-28T11:10:00Z"),
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
        sourceTransactionId: "s-tx-3",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.55,
        reviewed: false,
        reviewedAt: null,
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

  it("returns degraded proof graph when run is missing", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue(null);
    const graph = await service.getProofGraph("tenant-1", "run-1");
    expect(graph.degraded).toBe(true);
    expect(graph.degradedReasons).toContain("run_not_found_or_not_scoped");
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
});
