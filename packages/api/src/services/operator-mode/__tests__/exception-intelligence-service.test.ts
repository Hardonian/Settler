import { ExceptionIntelligenceService } from "../exception-intelligence-service";

jest.mock("../../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: { findMany: jest.fn() },
    reconciliationRun: { findFirst: jest.fn() },
    reconAudit: { create: jest.fn() },
    policyEvolutionProposal: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    policyEvolutionProposalReview: { create: jest.fn(), findMany: jest.fn() },
    policyMemoryArtifact: { upsert: jest.fn(), findMany: jest.fn() },
  },
}));

const { prisma } = require("../../../infrastructure/db/prisma");

describe("ExceptionIntelligenceService", () => {
  const service = new ExceptionIntelligenceService();

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([]);
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([]);
  });

  it("enforces tenant-scoped retrieval when loading decision history", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([]);

    await service.getDecisionHistory("tenant-abc", { limit: 10 });

    expect(prisma.reconciliationMatch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-abc" }) })
    );
  });

  it("returns explicit degraded signature lifecycle when evidence is sparse", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([]);

    const lifecycle = await service.getSignatureLifecycle("tenant-1", "12345678901234567890", 30);

    expect(lifecycle.degraded).toBe(true);
    expect(lifecycle.degradedReasons).toContain("signature_not_observed_in_scope");
  });

  it("returns truthful degraded source friction and entity fingerprints for small samples", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m-1",
        runId: "run-1",
        sourceTransactionId: "st-1",
        metadata: {},
        matchType: "unmatched",
        matchReason: "amount variance",
        confidence: 0.4,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T10:00:00Z"),
        createdAt: new Date("2026-03-28T10:00:00Z"),
        sourceTransaction: {
          source: { id: "src-1", name: "Stripe" },
          sourceId: "src-1",
          externalId: "cp-1",
          description: "Merchant A",
          category: "payments",
          currency: "USD",
        },
      },
    ]);

    const friction = await service.getSourceFrictionSummary("tenant-1", 30);
    const fingerprints = await service.getEntityFingerprints("tenant-1", 30);

    expect(friction.sources[0]?.degraded).toBe(true);
    expect(friction.sources[0]?.degradedReasons).toContain("insufficient_source_history");
    expect(fingerprints.entities[0]?.degraded).toBe(true);
    expect(fingerprints.entities[0]?.degradedReasons).toContain("insufficient_entity_history");
  });

  it("keeps effectiveness summary explicit when evidence is insufficient", async () => {
    prisma.policyEvolutionProposal.findMany.mockResolvedValue([
      {
        id: "p-row-1",
        proposalKey: "proposal-1",
        signatureKey: "aaaaaaaaaaaaaaaaaaaa",
        status: "approved",
        createdAt: new Date("2026-03-28T10:00:00Z"),
      },
    ]);
    prisma.reconciliationMatch.findMany.mockResolvedValue([]);

    const effectiveness = await service.getProposalEffectivenessSummary("tenant-1", 30);

    expect(effectiveness.proposals[0]?.degraded).toBe(true);
    expect(effectiveness.proposals[0]?.unsupportedMetrics).toContain(
      "insufficient_pre_post_samples"
    );
  });

  it("marks proof completeness flags and avoids 500-style fallback semantics", async () => {
    prisma.reconciliationRun.findFirst.mockResolvedValue({
      id: "run-1",
      tenantId: "tenant-1",
      status: "completed",
      startedAt: new Date("2026-03-29T00:00:00Z"),
      completedAt: new Date("2026-03-29T00:10:00Z"),
      matches: [],
      provenance: [],
    });

    const pack = await service.buildEvidencePack("tenant-1", "run-1");

    expect(pack.completenessByCategory.proposalPackLineage?.complete).toBe(false);
    expect(pack.completenessByCategory.provenanceRecords?.degraded).toBe(true);
    expect(pack.deterministicDigest).toHaveLength(64);
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

    expect(runtime.degraded).toBe(true);
    expect(runtime.degradedReasons).toContain("no_pack_runtime_history");
  });

  it("builds ontology taxonomy summary with explicit degraded semantics for unknowns", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValue([
      {
        id: "m-1",
        runId: "run-1",
        sourceTransactionId: "st-1",
        metadata: {},
        matchType: "unmatched",
        matchReason: "amount variance with missing evidence",
        confidence: 0.4,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T10:00:00Z"),
        createdAt: new Date("2026-03-28T10:00:00Z"),
        sourceTransaction: null,
      },
      {
        id: "m-2",
        runId: "run-1",
        sourceTransactionId: "st-2",
        metadata: {},
        matchType: "unmatched",
        matchReason: null,
        confidence: 0.4,
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: new Date("2026-03-28T11:00:00Z"),
        createdAt: new Date("2026-03-28T11:00:00Z"),
        sourceTransaction: null,
      },
    ]);

    const summary = await service.getExceptionTaxonomySummary("tenant-1", 30);

    expect(summary.totals.exceptionCount).toBe(2);
    expect(summary.dimensions.mismatchType.amount_mismatch).toBe(1);
    expect(summary.dimensions.mismatchType.unknown).toBe(1);
    expect(summary.dimensions.unresolvedBecause.missing_evidence).toBe(1);
    expect(summary.degraded).toBe(true);
    expect(summary.degradedReasons).toContain("partial_ontology_coverage");
  });

  it("generates deterministic policy proposals and avoids duplicate persistence", async () => {
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
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          source: { id: "src-1" },
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
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          source: { id: "src-1" },
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
          sourceId: "src-1",
          externalId: "cp-1",
          category: "payments",
          currency: "USD",
          source: { id: "src-1" },
        },
      },
    ]);
    prisma.reconAudit.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      entityId: "existing",
    });

    const first = await service.generatePolicyEvolutionProposals("tenant-1", 30);
    const second = await service.generatePolicyEvolutionProposals("tenant-1", 30);

    expect(first[0]?.proposalId).toBe(second[0]?.proposalId);
    expect(prisma.reconAudit.create).toHaveBeenCalledTimes(1);
    expect(first[0]?.unsupportedMetrics).toContain("false_positive_rate");
  });

  it("persists proposal review history and blocks missing proposal review", async () => {
    prisma.reconAudit.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      entityId: "proposal-1",
    });

    const missing = await service.reviewPolicyEvolutionProposal("tenant-1", {
      proposalId: "missing",
      decision: "approved",
      reviewerId: "user-1",
      reason: "ok",
    });
    const accepted = await service.reviewPolicyEvolutionProposal("tenant-1", {
      proposalId: "proposal-1",
      decision: "deferred",
      reviewerId: "user-2",
      reason: "need more support",
    });

    expect(missing.accepted).toBe(false);
    expect(missing.degradedReasons).toContain("proposal_not_found_or_not_scoped");
    expect(accepted.accepted).toBe(true);
    expect(prisma.reconAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: "policy_proposal",
          action: "proposal_reviewed",
        }),
      })
    );
  });

  it("retrieves tenant-scoped decision history with explicit degraded state when sparse", async () => {
    prisma.reconciliationMatch.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: "m4",
        runId: "run-2",
        sourceTransactionId: "s-tx-10",
        metadata: { rationale_codes: ["AMBIGUOUS_REFERENCE"] },
        matchType: "unmatched",
        matchReason: "ignored by operator",
        confidence: 0.41,
        reviewed: true,
        reviewedBy: "user-3",
        reviewedAt: new Date("2026-03-29T12:00:00Z"),
        updatedAt: new Date("2026-03-29T12:00:00Z"),
        createdAt: new Date("2026-03-29T11:00:00Z"),
        sourceTransaction: {
          sourceId: "src-2",
          externalId: "cp-9",
          category: "fees",
          currency: "USD",
          source: { id: "src-2" },
        },
      },
    ]);

    const degraded = await service.getDecisionHistory("tenant-1", { runId: "run-2", limit: 10 });
    const populated = await service.getDecisionHistory("tenant-1", { runId: "run-2", limit: 10 });

    expect(degraded.degraded).toBe(true);
    expect(degraded.degradedReasons).toContain("no_reviewed_decisions_in_scope");
    expect(populated.decisions[0]).toMatchObject({
      runId: "run-2",
      resultingState: "reviewed",
      decision: "ignored",
    });
  });
});
