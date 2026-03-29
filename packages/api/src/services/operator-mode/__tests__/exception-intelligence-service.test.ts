import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: {
      findMany: jest.fn(),
    },
    reconciliationRun: {
      findFirst: jest.fn(),
    },
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds recurring exception clusters and recommendations", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m1",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        amountDiff: 12,
        dateDiff: 2,
        confidence: 0.52,
        reviewed: true,
        reviewedAt: new Date("2026-03-28T10:10:00Z"),
        createdAt: new Date("2026-03-28T10:00:00Z"),
        sourceTransaction: {
          sourceId: "s1",
          category: "payments",
          currency: "USD",
          source: { id: "s1", name: "Stripe" },
        },
      },
      {
        id: "m2",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        amountDiff: 12,
        dateDiff: 2,
        confidence: 0.54,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date("2026-03-28T11:00:00Z"),
        sourceTransaction: {
          sourceId: "s1",
          category: "payments",
          currency: "USD",
          source: { id: "s1", name: "Stripe" },
        },
      },
    ]);

    const result = await service.getSnapshot("00000000-0000-4000-8000-000000000001", 30);

    expect(result.totals.exceptions).toBe(2);
    expect(result.totals.recurringSignatures).toBe(1);
    expect(result.clusters[0]?.recommendedAction.action).toBe("manual_review");
    expect(result.sourceReliability[0]).toMatchObject({ sourceId: "s1", totalExceptions: 2 });
  });

  it("returns degraded proof graph when run is missing or out of tenant scope", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue(null);

    const graph = await service.getProofGraph(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000010"
    );

    expect(graph.degraded).toBe(true);
    expect(graph.degradedReasons).toContain("run_not_found_or_not_scoped");
    expect(graph.nodes).toHaveLength(0);
  });

  it("returns explicit simulation degraded note when run is missing", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue(null);

    const result = await service.simulatePolicy("00000000-0000-4000-8000-000000000001", {
      runId: "00000000-0000-4000-8000-000000000010",
      candidatePolicy: {
        amountTolerance: 1,
        dateWindowDays: 5,
        fuzzyDescriptionThreshold: 0.8,
        requireExactAmount: false,
      },
    });

    expect(result.notes).toContain("run_not_found_or_not_scoped");
    expect(result.blastRadius.impactedRecords).toBe(0);
  });
});
