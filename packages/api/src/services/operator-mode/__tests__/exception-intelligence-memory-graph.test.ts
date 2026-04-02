import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
    reconAudit: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    policyEvolutionProposal: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    policyEvolutionProposalReview: { findMany: jest.fn() },
    policyMemoryArtifact: { upsert: jest.fn(), findMany: jest.fn() },
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService memory graph", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.policyEvolutionProposal.upsert.mockResolvedValue({
      id: "proposal-row-1",
      proposalKey: "proposal-1",
      signatureKey: "aaaaaaaaaaaaaaaaaaaa",
      status: "pending_review",
      createdAt: new Date("2026-03-29T00:00:00Z"),
    });
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([]);
    prisma.policyEvolutionProposalReview.findMany.mockResolvedValue([]);
    prisma.policyMemoryArtifact.upsert.mockResolvedValue({});
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([]);
  });

  it("builds a tenant-scoped memory graph with proposal review lineage", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m-1",
        runId: "run-1",
        sourceTransactionId: "st-1",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.6,
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
        confidence: 0.61,
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
        runId: "run-2",
        sourceTransactionId: "st-3",
        metadata: { rationale_codes: ["LOW_CONFIDENCE"] },
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.59,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T13:00:00Z"),
        createdAt: new Date("2026-03-28T13:00:00Z"),
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

    prisma.reconAudit.findFirst.mockResolvedValue(null);
    prisma.policyEvolutionProposal.upsert.mockResolvedValue({
      id: "proposal-row-1",
      proposalKey: "proposal-1",
      signatureKey: "aaaaaaaaaaaaaaaaaaaa",
      status: "pending_review",
      createdAt: new Date("2026-03-29T00:00:00Z"),
    });
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([
      {
        id: "proposal-row-1",
        proposalKey: "proposal-1",
        signatureKey: "aaaaaaaaaaaaaaaaaaaa",
        status: "pending_review",
        generatedAt: new Date("2026-03-29T00:00:00Z"),
        why: "test",
        historicalBasis: {
          supportCount: 3,
          lookbackDays: 30,
          openCount: 2,
          resolvedCount: 1,
          lowConfidenceCount: 2,
          adjudicationMix: {},
        },
        affectedScope: { sourceIds: ["src-1"], counterpartyKeys: ["cp-1"] },
        estimatedImpact: {
          expectedManualReviewReduction: null,
          expectedOpenExceptionChange: null,
        },
        unsupportedMetrics: ["false_positive_rate"],
        riskFlags: [],
        dataSufficiency: "limited",
        createdAt: new Date("2026-03-29T00:00:00Z"),
        reviews: [],
      },
    ]);
    prisma.policyEvolutionProposalReview.findMany.mockResolvedValue([]);
    prisma.policyMemoryArtifact.upsert.mockResolvedValue({});
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([]);
    prisma.reconAudit.findMany.mockResolvedValue([
      {
        tenantId: "tenant-1",
        entityId: "proposal-1",
        action: "proposal_generated",
        userId: null,
        changes: {},
        metadata: {},
        createdAt: new Date("2026-03-29T00:00:00Z"),
      },
      {
        tenantId: "tenant-1",
        entityId: "proposal-1",
        action: "proposal_reviewed",
        userId: "reviewer-1",
        changes: { decision: "approved", reason: "strong repeated support" },
        metadata: {},
        createdAt: new Date("2026-03-29T01:00:00Z"),
      },
    ]);

    const graph = await service.getReconciliationMemoryGraph("tenant-1", 30);

    expect(graph.tenantId).toBe("tenant-1");
    expect(graph.nodes.some((node) => node.type === "proposal_review")).toBe(true);
    expect(
      graph.edges.some((edge) => edge.relation === "reviews" && edge.to.startsWith("proposal:"))
    ).toBe(true);
    expect(graph.degraded).toBe(false);
  });

  it("marks proposal history as degraded when review is missing", async () => {
    prisma.reconAudit.findMany.mockResolvedValue([
      {
        tenantId: "tenant-1",
        entityId: "proposal-1",
        action: "proposal_generated",
        userId: null,
        changes: {},
        metadata: {},
        createdAt: new Date("2026-03-29T00:00:00Z"),
      },
    ]);

    const history = await service.getProposalHistory("tenant-1", "proposal-1");

    expect(history).not.toBeNull();
    expect(history?.degraded).toBe(true);
    expect(history?.degradedReasons).toContain("proposal_has_no_review_history");
    expect(history?.latestStatus).toBe("pending_review");
  });
});
