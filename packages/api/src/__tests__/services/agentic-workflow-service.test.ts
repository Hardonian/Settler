import { AgenticWorkflowService } from "../../services/agentic-workflow/agentic-workflow-service";

jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    tenantSettings: {
      findUnique: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reconciliationMatch: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    exceptionAdjudicationMemory: {
      findMany: jest.fn(),
    },
    reconciliationRun: {
      findFirst: jest.fn(),
    },
    reconAudit: {
      createMany: jest.fn(),
    },
  },
}));

const mockPrisma = require("../../infrastructure/db/prisma").prisma;

describe("AgenticWorkflowService", () => {
  let service: AgenticWorkflowService;
  const tenantId = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AgenticWorkflowService();
  });

  describe("getAutomationState", () => {
    it("returns default automation state when no tenant settings exist", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: {},
      });

      const state = await service.getAutomationState(tenantId);

      expect(state.tenantId).toBe(tenantId);
      expect(state.automationEnabled).toBe(true);
      expect(state.staleEscalationEnabled).toBe(true);
      expect(state.staleThresholdHours).toBe(72);
      expect(state.policyProposalEnabled).toBe(true);
    });

    it("returns custom settings when tenant has them", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        metadata: {
          agenticAutomationEnabled: false,
          staleEscalationEnabled: false,
          staleThresholdHours: 48,
          policyProposalEnabled: false,
        },
      });

      const state = await service.getAutomationState(tenantId);

      expect(state.automationEnabled).toBe(false);
      expect(state.staleEscalationEnabled).toBe(false);
      expect(state.staleThresholdHours).toBe(48);
      expect(state.policyProposalEnabled).toBe(false);
    });
  });

  describe("updateAutomationState", () => {
    it("updates automation settings", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        metadata: {},
      });
      mockPrisma.tenant.update.mockResolvedValue(true);

      const state = await service.updateAutomationState(tenantId, {
        staleEscalationEnabled: false,
        staleThresholdHours: 24,
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalled();
      expect(state.staleEscalationEnabled).toBe(false);
    });
  });

  describe("getTriageSuggestions", () => {
    it("returns degraded suggestions when no historical data exists", async () => {
      const exceptionId = "22222222-2222-4222-8222-222222222222";

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        {
          id: exceptionId,
          matchType: "unmatched",
          matchReason: "Amount mismatch",
          metadata: {},
          createdAt: new Date(),
          reviewed: false,
          assignedTo: null,
          sourceTransaction: { source: { id: "src1", name: "Test Source" } },
          archetypeClassifications: [],
        },
      ]);

      mockPrisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([]);

      const suggestions = await service.getTriageSuggestions(tenantId, [exceptionId]);

      expect(suggestions).toHaveLength(1);
      const first = suggestions[0]!;
      expect(first.degraded).toBe(true);
      expect(first.degradedReasons).toContain("insufficient_similar_case_history");
      expect(first.suggestedAction).toBe("manual_review");
    });

    it("returns confident suggestions when similar cases exist", async () => {
      const exceptionId = "22222222-2222-4222-8222-222222222222";
      const archetypeId = "archetype-123";

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        {
          id: exceptionId,
          matchType: "unmatched",
          matchReason: "Amount mismatch",
          metadata: {},
          createdAt: new Date(),
          reviewed: false,
          assignedTo: null,
          sourceTransaction: { source: { id: "src1", name: "Test Source" } },
          archetypeClassifications: [{ archetypeId, archetype: { code: "test" } }],
        },
      ]);

      mockPrisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([
        { exceptionId: "old-1", resolution: "matched", createdAt: new Date(), archetypeId },
        { exceptionId: "old-2", resolution: "matched", createdAt: new Date(), archetypeId },
        { exceptionId: "old-3", resolution: "manual", createdAt: new Date(), archetypeId },
      ]);

      const suggestions = await service.getTriageSuggestions(tenantId, [exceptionId]);

      expect(suggestions).toHaveLength(1);
      const first = suggestions[0]!;
      expect(first.degraded).toBe(false);
      expect(first.similarCases).toHaveLength(3);
      expect(first.confidence).toBeGreaterThan(0.5);
    });

    it("suggests escalation for unassigned exceptions with historical precedent", async () => {
      const exceptionId = "22222222-2222-4222-8222-222222222222";

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        {
          id: exceptionId,
          matchType: "unmatched",
          matchReason: "Amount mismatch",
          metadata: {},
          createdAt: new Date(),
          reviewed: false,
          assignedTo: null,
          sourceTransaction: { source: { id: "src1", name: "Test Source" } },
          archetypeClassifications: [],
        },
      ]);

      mockPrisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([
        { exceptionId: "old-1", resolution: "matched", createdAt: new Date(), archetypeId: null },
      ]);

      const suggestions = await service.getTriageSuggestions(tenantId, [exceptionId]);

      const first = suggestions[0]!;
      expect(first.suggestedAction).toBe("escalate");
    });
  });

  describe("calculateQueuePriorities", () => {
    it("returns priority scores sorted by descending priority", async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 100 * 60 * 60 * 1000);

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        {
          id: "low-priority",
          matchType: "unmatched",
          metadata: {},
          createdAt: now,
          severity: "low",
          assignedTo: "user-1",
          sourceTransaction: {},
          archetypeClassifications: [],
        },
        {
          id: "high-priority",
          matchType: "conflict",
          metadata: {},
          createdAt: oldDate,
          severity: "critical",
          assignedTo: null,
          sourceTransaction: {},
          archetypeClassifications: [],
        },
      ]);

      const priorities = await service.calculateQueuePriorities(tenantId);

      expect(priorities).toHaveLength(2);
      expect(priorities[0]!.exceptionId).toBe("high-priority");
      expect(priorities[0]!.priorityScore).toBeGreaterThan(priorities[1]!.priorityScore);
    });

    it("includes deterministic factors in rationale", async () => {
      const now = new Date();

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        {
          id: "test-ex",
          matchType: "unmatched",
          metadata: {},
          createdAt: now,
          severity: "high",
          assignedTo: null,
          sourceTransaction: {},
          archetypeClassifications: [],
        },
      ]);

      const priorities = await service.calculateQueuePriorities(tenantId);

      expect(priorities[0]!.factors.severity).toBeDefined();
      expect(priorities[0]!.factors.age).toBeDefined();
      expect(priorities[0]!.factors.unassigned).toBeDefined();
      expect(priorities[0]!.rationale).toContain("severity=high");
    });
  });

  describe("escalateStaleExceptions", () => {
    it("returns degraded when stale escalation is disabled", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: { staleEscalationEnabled: false },
      });

      const result = await service.escalateStaleExceptions(tenantId);

      expect(result.degraded).toBe(true);
      expect(result.degradedReasons).toContain("stale_escalation_disabled_in_settings");
      expect(result.escalatedCount).toBe(0);
    });

    it("escalates exceptions older than threshold", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: { staleEscalationEnabled: true, staleThresholdHours: 72 },
      });

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        { id: "stale-1" },
        { id: "stale-2" },
      ]);
      mockPrisma.reconciliationMatch.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.reconAudit.createMany.mockResolvedValue(true);
      mockPrisma.tenant.update.mockResolvedValue(true);

      const result = await service.escalateStaleExceptions(tenantId);

      expect(result.escalatedCount).toBe(2);
      expect(result.escalatedIds).toContain("stale-1");
      expect(result.escalatedIds).toContain("stale-2");
      expect(mockPrisma.reconciliationMatch.updateMany).toHaveBeenCalled();
      expect(mockPrisma.reconAudit.createMany).toHaveBeenCalled();
    });

    it("returns empty when no stale exceptions exist", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: { staleEscalationEnabled: true },
      });

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([]);

      const result = await service.escalateStaleExceptions(tenantId);

      expect(result.escalatedCount).toBe(0);
      expect(result.escalatedIds).toHaveLength(0);
      expect(result.degraded).toBe(false);
    });
  });

  describe("assembleEvidencePack", () => {
    it("returns degraded when exception not found", async () => {
      mockPrisma.reconciliationMatch.findFirst.mockResolvedValue(null);

      const pack = await service.assembleEvidencePack(tenantId, "non-existent");

      expect(pack.degraded).toBe(true);
      expect(pack.degradedReasons).toContain("exception_not_found");
      expect(pack.deterministicDigest).toBe("");
    });

    it("assembles evidence pack with provenance chain", async () => {
      const exceptionId = "33333333-3333-4333-8333-333333333333";
      const now = new Date();

      mockPrisma.reconciliationMatch.findFirst.mockResolvedValue({
        id: exceptionId,
        matchType: "unmatched",
        matchReason: "Amount mismatch",
        metadata: {},
        confidence: 0.6,
        createdAt: now,
        runId: "run-123",
        sourceTransaction: {
          source: { id: "src-1", name: "Test Source" },
          description: "Test transaction",
        },
        targetTransaction: { id: "target-1" },
        run: { id: "run-123", status: "completed", startedAt: now },
      });

      mockPrisma.reconciliationRun.findFirst.mockResolvedValue({
        id: "run-123",
        status: "completed",
        startedAt: now,
      });

      mockPrisma.exceptionAdjudicationMemory.findMany.mockResolvedValue([
        { exceptionId: "old-1", resolution: "matched", createdAt: now, archetypeId: null },
      ]);

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        { id: "similar-1", createdAt: now, reviewed: true },
        { id: "similar-2", createdAt: now, reviewed: false },
      ]);

      const pack = await service.assembleEvidencePack(tenantId, exceptionId);

      expect(pack.exceptionId).toBe(exceptionId);
      expect(pack.components.provenance).toHaveLength(2);
      expect(pack.components.provenance[0]!.step).toBe("exception_created");
      expect(pack.components.similarCases).toHaveLength(1);
      expect(pack.deterministicDigest).toBeTruthy();
    });
  });

  describe("generatePolicyRecommendations", () => {
    it("returns empty when policy proposal is disabled", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: { policyProposalEnabled: false },
      });

      const recommendations = await service.generatePolicyRecommendations(tenantId);

      expect(recommendations).toHaveLength(0);
    });

    it("generates recommendations based on signature patterns", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        settings: { policyProposalEnabled: true },
      });

      const now = new Date();
      const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      mockPrisma.reconciliationMatch.findMany.mockResolvedValue([
        { id: "1", matchType: "unmatched", metadata: {}, createdAt: now, reviewed: false },
        { id: "2", matchType: "unmatched", metadata: {}, createdAt: now, reviewed: false },
        { id: "3", matchType: "unmatched", metadata: {}, createdAt: now, reviewed: false },
        { id: "4", matchType: "unmatched", metadata: {}, createdAt: now, reviewed: true },
        { id: "5", matchType: "unmatched", metadata: {}, createdAt: oldDate, reviewed: true },
      ]);

      const recommendations = await service.generatePolicyRecommendations(tenantId, 30);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]!.requiresApproval).toBe(true);
      expect(recommendations[0]!.status).toBe("auto_generated");
      expect(recommendations[0]!.basis).toBeDefined();
    });
  });
});
