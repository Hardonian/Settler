import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
    reconAudit: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    policyEvolutionProposal: { findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    policyEvolutionProposalReview: { create: jest.fn(), findMany: jest.fn() },
    policyMemoryArtifact: { upsert: jest.fn(), findMany: jest.fn() },
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => jest.clearAllMocks());

  it("stores deterministic policy proposals in canonical policy-memory entities", async () => {
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
        reviewedBy: i === 0 ? "user-1" : null,
        reviewedAt: i === 0 ? new Date("2026-03-28T11:10:00Z") : null,
        updatedAt: new Date("2026-03-28T11:10:00Z"),
        createdAt: new Date(`2026-03-28T1${i}:00:00Z`),
        sourceTransaction: {
          category: "payments",
          currency: "USD",
          externalId: "cp-1",
          source: { id: "src-1" },
        },
      })),
    ]);
    prisma.reconAudit.findFirst.mockResolvedValue(null);

    const proposals = await service.generatePolicyEvolutionProposals("tenant-1", 30);

    expect(proposals[0]?.learnedEffectiveness).toBeDefined();
    expect(prisma.policyEvolutionProposal.upsert).toHaveBeenCalled();
    expect(prisma.policyMemoryArtifact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId_artifactKey: expect.objectContaining({
            artifactKey: expect.stringContaining("proposal:"),
          }),
        }),
      })
    );
  });

  it("stores proposal review transitions", async () => {
    prisma.reconAudit.findFirst.mockResolvedValue({ entityId: "proposal-1" });

    const result = await service.reviewPolicyEvolutionProposal("tenant-1", {
      proposalId: "proposal-1",
      decision: "approved",
      reviewerId: "user-1",
      reason: "evidence stable",
    });

    expect(result).toMatchObject({ accepted: true, status: "approved" });
    expect(prisma.reconAudit.create).toHaveBeenCalled();
  });

    const reviewed = await service.reviewPolicyEvolutionProposal("tenant-1", {
      proposalId: "proposal-1",
      decision: "approved",
      reviewerId: "user-1",
      reason: "Evidence quality is strong and risk is low",
    });

    expect(reviewed.accepted).toBe(true);
    expect(prisma.policyEvolutionProposalReview.create).toHaveBeenCalled();
    expect(prisma.reconAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "proposal_reviewed",
          changes: expect.objectContaining({
            reasonCodes: expect.arrayContaining(["evidence_quality", "risk_concern"]),
          }),
        }),
      })
    );
  });

  it("returns proposal history with linked artifacts and explicit degraded semantics", async () => {
    prisma.policyEvolutionProposal.findFirst.mockResolvedValue({ id: "proposal-row-1" });
    prisma.policyEvolutionProposalReview.findMany.mockResolvedValue([]);
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([
      {
        artifactKey: "proposal:proposal-1",
        artifactType: "policy_proposal",
        createdAt: new Date("2026-03-29T00:00:00Z"),
      },
    ]);

    const history = await service.getProposalHistory("tenant-1", "proposal-1");

    expect(history?.degraded).toBe(true);
    expect(history?.degradedReasons).toContain("no_review_history_for_proposal");
    expect(history?.linkedArtifacts[0]?.artifactKey).toBe("proposal:proposal-1");
  });

  it("builds deterministic evidence pack digest inputs", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue({
      id: "run-1",
      tenantId: "tenant-1",
      status: "completed",
      startedAt: new Date("2026-03-29T00:00:00Z"),
      completedAt: new Date("2026-03-29T00:10:00Z"),
      matches: [],
      provenance: [],
    });

    const packA = await service.buildEvidencePack("tenant-1", "run-1");
    const packB = await service.buildEvidencePack("tenant-1", "run-1");

    expect(packA.deterministicDigest).toBe(packB.deterministicDigest);
    expect(packA.completenessByCategory.policyReferences?.degraded).toBe(true);
  });
});
