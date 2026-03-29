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

  it("supports pack runtime degraded truth when no versions exist", async () => {
    prisma.policyMemoryArtifact.findMany.mockResolvedValue([]);

    const runtime = await service.getPackRuntimeSummary("tenant-1");

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
});
