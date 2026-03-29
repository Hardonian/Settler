import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
    reconAudit: { create: jest.fn() },
    policyEvolutionProposal: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    policyEvolutionProposalReview: { create: jest.fn(), findMany: jest.fn() },
    policyMemoryArtifact: { upsert: jest.fn(), findMany: jest.fn() },
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService memory graph", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => jest.clearAllMocks());

  it("builds graph nodes and edges from tenant scoped history", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m-1",
        runId: "run-1",
        sourceTransactionId: "st-1",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.61,
        reviewed: true,
        reviewedBy: "user-1",
        reviewedAt: new Date("2026-03-28T11:00:00Z"),
        updatedAt: new Date("2026-03-28T11:00:00Z"),
        createdAt: new Date("2026-03-28T10:00:00Z"),
        sourceTransaction: {
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
      {
        id: "m-2",
        runId: "run-1",
        sourceTransactionId: "st-2",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.59,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T12:00:00Z"),
        createdAt: new Date("2026-03-28T12:00:00Z"),
        sourceTransaction: {
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
      {
        id: "m-3",
        runId: "run-1",
        sourceTransactionId: "st-3",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "ignored by reviewer",
        confidence: 0.57,
        reviewed: true,
        reviewedBy: "user-1",
        reviewedAt: new Date("2026-03-28T13:00:00Z"),
        updatedAt: new Date("2026-03-28T13:00:00Z"),
        createdAt: new Date("2026-03-28T12:30:00Z"),
        sourceTransaction: {
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          description: "Merchant A",
          source: { id: "src-1", name: "Stripe" },
        },
      },
    ]);

    prisma.policyEvolutionProposal.upsert.mockResolvedValue({
      id: "p-row",
      status: "pending_review",
    });
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([
      {
        id: "p-row",
        tenantId: "tenant-1",
        proposalKey: "proposal-1",
        signatureKey: "2f4f53bb31c8f2a2eb8c",
        status: "approved",
        why: "because",
        historicalSupport: { supportCount: 5 },
        impactSummary: {
          estimatedImpact: {
            expectedManualReviewReduction: 0.1,
            expectedOpenExceptionChange: -0.1,
          },
          learnedEffectiveness: { score: 0.8, confidence: "medium", evidenceCount: 5, basis: [] },
        },
        riskFlags: [],
        missingData: [],
        createdAt: new Date("2026-03-29T00:00:00Z"),
        updatedAt: new Date("2026-03-29T00:00:00Z"),
        reviews: [],
      },
    ]);
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([]);

    const graph = await service.getReconciliationMemoryGraph("tenant-1", 30);

    expect(graph.nodes.some((node) => node.type === "source")).toBe(true);
    expect(graph.nodes.some((node) => node.type === "entity")).toBe(true);
    expect(graph.edges.some((edge) => edge.relation === "resolves")).toBe(true);
    expect(graph.degradedReasons).not.toContain("no_policy_proposals_in_scope");
  });
});
