/**
 * Runs Route Tests
 *
 * Tests for operator-facing runs API:
 * - Tenant isolation
 * - List and detail endpoints
 * - Retry endpoint
 * - Empty states
 * - Error handling
 */

import request from "supertest";
import express from "express";
import { runsRouter } from "../runs";
import { AuthRequest } from "../../middleware/auth";

// Mock Prisma - jest.mock is hoisted, so define fns inside the factory
jest.mock("../../infrastructure/db/prisma", () => {
  const reconResult = {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  return {
    prisma: {
      reconResult,
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({ reconResult })),
    },
  };
});

jest.mock("@settler/reconciliation-core", () => ({
  scanMergedRunsForLegacyPage: jest.fn(),
  resolveOperatorRunDetailForTenants: jest.fn(),
  fetchMergedReconciliationRunsPage: jest.fn(),
  buildRunProofpackIndexByRunId: jest.fn(),
  resolveRunCompactProofSummary: jest.fn(),
}));

// Access mocked modules after jest.mock is applied
const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;
const {
  scanMergedRunsForLegacyPage: mockScanMergedRunsForLegacyPage,
  resolveOperatorRunDetailForTenants: mockResolveOperatorRunDetail,
  fetchMergedReconciliationRunsPage: mockFetchMergedReconciliationRunsPage,
  buildRunProofpackIndexByRunId: mockBuildRunProofpackIndexByRunId,
  resolveRunCompactProofSummary: mockResolveRunCompactProofSummary,
} = require("@settler/reconciliation-core");

// Mock governance middleware
jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: any, _res: any, next: any) => next(),
  bypassFreeze: (_req: any, _res: any, next: any) => next(),
}));

// Mock authorization
jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock validation
jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock utils
jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));
jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe("Runs Routes", () => {
  let app: express.Express;

  const buildCanonicalListItem = (overrides: Record<string, any> = {}) => ({
    runKind: "recon_job",
    id: "run-1",
    tenantId: "tenant-123",
    name: "Daily Reconciliation",
    reconResultId: null,
    configDrift: {
      status: "none",
      strategyChanged: false,
      templateChanged: false,
      validationRulesChanged: false,
      adapter: {
        status: "none",
        comparisonMode: "unavailable",
        sourceChanged: null,
        targetChanged: null,
        sourceHashPresent: false,
        targetHashPresent: false,
      },
      notes: [],
    },
    lifecycle: {
      status: "completed",
      statusLabel: "Completed",
      isTerminal: true,
      progressPercent: 100,
      progressState: "completed",
    },
    summaryState: "success",
    summary: {
      total: 100,
      sourceCount: 50,
      targetCount: 50,
      processed: 100,
      matched: 95,
      matchedWithTolerance: 0,
      unmatched: 5,
      unmatchedSourceCount: 2,
      unmatchedTargetCount: 3,
      conflicts: 0,
      exceptioned: 0,
      unresolved: 0,
      ignored: 0,
      resolved: 0,
    },
    provenance: {
      sourceModel: "recon_jobs",
      runKind: "recon_job",
      ingestionId: null,
      reconJobId: "job-1",
    },
    adapters: {
      sourceAdapter: "source-a",
      targetAdapter: "target-b",
    },
    timestamps: {
      createdAt: "2026-03-17T09:59:00.000Z",
      startedAt: "2026-03-17T10:00:00.000Z",
      completedAt: "2026-03-17T10:05:00.000Z",
      updatedAt: "2026-03-17T10:05:00.000Z",
    },
    ...overrides,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      next();
    });

    app.use("/api/runs", runsRouter);
    jest.clearAllMocks();
    mockScanMergedRunsForLegacyPage.mockReset();
    mockResolveOperatorRunDetail.mockReset();
    mockFetchMergedReconciliationRunsPage.mockReset();
    mockBuildRunProofpackIndexByRunId.mockReset();
    mockBuildRunProofpackIndexByRunId.mockImplementation(() => Promise.resolve(new Map()));
    mockResolveRunCompactProofSummary.mockReset();
    mockResolveRunCompactProofSummary.mockImplementation(({ proofpackIndex }: any) => ({
      compactProofSummary: proofpackIndex
        ? { delta: { state: proofpackIndex.comparison?.state ?? "unavailable" } }
        : { delta: { state: "unavailable" } },
      source: proofpackIndex ? "proofpack_index" : "fallback_unavailable",
      fallbackReasonCode: proofpackIndex ? null : "run_proofpack_missing",
    }));
  });

  describe("GET /api/runs", () => {
    it("should return merged canonical runs adapted into the Express envelope", async () => {
      mockBuildRunProofpackIndexByRunId.mockResolvedValueOnce(
        new Map([
          [
            "run-1",
            {
              proofPackages: {
                total: 1,
                finalized: 1,
                bestCompletenessScore: 1,
                missingEvidenceCount: 0,
                latestCreatedAt: "2026-03-17T10:10:00.000Z",
                state: "ready",
                degradedEvidenceReasons: [],
              },
              recurrence: {
                exceptionsWithMemories: 1,
                repeatedResolutionReasons: ["bank_window"],
                state: "ready",
                topRecurringFamilies: [],
              },
              comparison: {
                state: "available",
                changedSincePriorRun: "changed",
                certainty: "high",
                reasonCodes: ["history_window_evaluated"],
                summary:
                  "Deterministic run-over-run differences detected versus the most recent comparable baseline.",
                baseline: {
                  priorResultId: "prior-1",
                  priorResultStartedAt: "2026-03-16T10:00:00.000Z",
                },
                history: {
                  lookbackWindow: 2,
                  comparableWindowCount: 2,
                  certainty: "high",
                  trend: "improving",
                  reasonCodes: ["history_window_evaluated"],
                  summary: "Recent comparable history shows improving reconciliation posture.",
                },
                deltas: {
                  matched: 2,
                  unmatched: -2,
                  conflicts: -1,
                  proofCompleteness: "improved",
                  recurringFamilyConcentration: "stronger",
                },
              },
            },
          ],
        ])
      );
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [
          {
            runKind: "recon_job",
            sourceModel: "recon_jobs",
            id: "run-1",
            detailHref: "/console/runs/run-1",
            name: "Daily Reconciliation",
            status: "completed",
            statusLabel: "Completed",
            startedAt: "2026-03-17T10:00:00.000Z",
            completedAt: "2026-03-17T10:05:00.000Z",
            summary: {
              total: 100,
              sourceCount: 50,
              targetCount: 50,
              matched: 95,
              unmatched: 5,
              unmatchedSourceCount: 2,
              unmatchedTargetCount: 3,
              conflicts: 0,
            },
            summarySemantics: {
              processed: 100,
              matchedWithTolerance: 0,
              exceptioned: 0,
              unresolved: 0,
              ignored: 0,
              resolved: 0,
            },
            summaryState: "success",
            progress: 100,
            progressState: "completed",
            isTerminal: true,
            provenance: buildCanonicalListItem().provenance,
            configDrift: { status: "none", adapter: "none" },
            ingestionId: null,
            sourceAdapter: "source-a",
            targetAdapter: "target-b",
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
        filters: {},
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: "run-1",
        name: "Daily Reconciliation",
        status: "completed",
        runKind: "recon_job",
        sourceModel: "recon_jobs",
        summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
      });
      expect(res.body.data[0].compactProofSummary).toBeDefined();
      expect(res.body.data[0].compactProofSummaryContext).toEqual({
        source: "proofpack_index",
        fallbackReasonCode: null,
      });

      expect(mockScanMergedRunsForLegacyPage).toHaveBeenCalledWith(
        expect.objectContaining({
          prisma: expect.anything(),
          tenantId: "tenant-123",
          page: 1,
          limit: 50,
          batchSize: 100,
          filters: { status: undefined, search: undefined },
        })
      );
      expect(mockBuildRunProofpackIndexByRunId).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          runs: [{ id: "run-1", runKind: "recon_job" }],
        })
      );
    });

    it("should filter merged rows by status after canonical adaptation", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [{ id: "run-2" }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        filters: { status: "running" },
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs?status=running");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("run-2");
    });

    it("should filter merged rows by search across canonical id/name fields", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [{ id: "special-run" }],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        filters: { search: "special" },
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs?search=special");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("special-run");
    });

    it("should handle pagination", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: Array.from({ length: 25 }, (_, index) => ({ id: `run-${index + 26}` })),
        pagination: {
          page: 2,
          limit: 25,
          total: 60,
          totalPages: 3,
        },
        filters: {},
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs?page=2&limit=25");

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 25,
        total: 60,
        totalPages: 3,
      });
      expect(res.body.data[0].id).toBe("run-26");
      expect(res.body.data).toHaveLength(25);
    });

    it("should return empty array when no runs exist", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        filters: {},
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      mockScanMergedRunsForLegacyPage.mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(500);
    });

    it("should continue scanning merged pages to satisfy legacy page offsets", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: Array.from({ length: 40 }, (_, index) => ({ id: `run-${index + 101}` })),
        pagination: {
          page: 3,
          limit: 50,
          total: 140,
          totalPages: 3,
        },
        filters: {},
        pagesScanned: 2,
      });

      const res = await request(app).get("/api/runs?page=3&limit=50");

      expect(res.status).toBe(200);
      expect(mockScanMergedRunsForLegacyPage).toHaveBeenCalledTimes(1);
      expect(res.body.pagination.total).toBe(140);
      expect(res.body.data[0].id).toBe("run-101");
      expect(res.body.data).toHaveLength(40);
    });
  });

  describe("GET /api/runs/:runId", () => {
    const canonicalDetailSample = {
      runKind: "recon_job" as const,
      id: "run-1",
      name: "Daily Reconciliation",
      status: "completed",
      progress: 100,
      stages: [{ id: "audit-1", name: "Stage 1" }],
    };

    it("should return canonical operator detail from reconciliation-core", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({
        kind: "ok",
        detail: canonicalDetailSample,
      });

      const res = await request(app).get("/api/runs/run-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(canonicalDetailSample);
      expect(mockResolveOperatorRunDetail).toHaveBeenCalledWith(
        expect.anything(),
        ["tenant-123"],
        "run-1"
      );
    });

    it("should surface in-progress runs via canonical detail.progress", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({
        kind: "ok",
        detail: {
          ...canonicalDetailSample,
          id: "run-2",
          status: "running",
          progress: 0,
        },
      });

      const res = await request(app).get("/api/runs/run-2");

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("running");
      expect(res.body.data.progress).toBe(0);
    });

    it("should return 404 when run not found", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({ kind: "not_found" });

      const res = await request(app).get("/api/runs/nonexistent");

      expect(res.status).toBe(404);
    });

    it("should return 409 when UUID collision occurs", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({
        kind: "ambiguous_uuid_collision",
        jobId: "job-x",
        ingestionRunId: "ing-x",
      });

      const res = await request(app).get("/api/runs/collision-id");

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("CONFLICT");
    });

    it("should enforce tenant isolation via single-tenant resolver scope", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({ kind: "not_found" });

      const res = await request(app).get("/api/runs/other-tenant-run");

      expect(res.status).toBe(404);
      expect(mockResolveOperatorRunDetail).toHaveBeenCalledWith(
        expect.anything(),
        ["tenant-123"],
        "other-tenant-run"
      );
    });
  });

  describe("Tenant Safety Verification", () => {
    it("should always scope merged queries to tenantId from auth middleware", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        filters: {},
        pagesScanned: 1,
      });

      await request(app).get("/api/runs");

      expect(mockScanMergedRunsForLegacyPage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
        })
      );
    });

    it("should use tenantId from auth middleware, not user input", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        filters: {},
        pagesScanned: 1,
      });

      // Attempt to inject different tenant via header
      await request(app).get("/api/runs").set("x-tenant-id", "malicious-tenant");

      // Should use tenant-123 from auth middleware, not malicious-tenant
      expect(mockScanMergedRunsForLegacyPage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
        })
      );
    });
  });

  describe("Data Integrity", () => {
    it("should return 500 when enrichment fails", async () => {
      mockResolveOperatorRunDetail.mockResolvedValueOnce({
        kind: "recon_enrichment_failed",
        message: "snapshot read failed",
      });

      const res = await request(app).get("/api/runs/run-3");

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/runs/:runId/retry", () => {
    it("should queue run for retry and return new execution", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-1",
        reconJobId: "job-1",
        reconJob: { id: "job-1", name: "Daily Reconciliation" },
        status: "failed",
        tenantId: "tenant-123",
        startedAt: new Date(),
        completedAt: new Date(),
        summary: null,
        errorMessage: "Previous failure",
      });
      mockReconResult.findFirst.mockResolvedValueOnce(null);
      mockReconResult.create.mockResolvedValueOnce({
        id: "run-new",
        reconJobId: "job-1",
        status: "running",
        startedAt: new Date(),
      });

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("running");
    });

    it("should return 404 if run not found", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(404);
    });

    it("should return 409 if retry is already in progress", async () => {
      mockReconResult.findFirst
        .mockResolvedValueOnce({
          id: "run-1",
          reconJobId: "job-1",
          reconJob: { id: "job-1", name: "Daily Reconciliation" },
          status: "failed",
          tenantId: "tenant-123",
          startedAt: new Date(),
          completedAt: new Date(),
          summary: null,
          errorMessage: "Previous failure",
        })
        .mockResolvedValueOnce({ id: "run-retry-existing" });

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(409);
      expect(mockReconResult.create).not.toHaveBeenCalled();
    });

    it("should block retry if run is not failed", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-1",
        reconJobId: "job-1",
        reconJob: { id: "job-1", name: "Running Job" },
        status: "running",
        tenantId: "tenant-123",
        startedAt: new Date(),
      });

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(400);
    });

    it("should use $transaction for retry to prevent TOCTOU race", async () => {
      const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-1",
        reconJobId: "job-1",
        reconJob: { id: "job-1", name: "Daily Reconciliation" },
        status: "failed",
        tenantId: "tenant-123",
        startedAt: new Date(),
        completedAt: new Date(),
        summary: null,
        errorMessage: "Previous failure",
      });
      // Inside transaction: no existing retry, then create
      mockReconResult.findFirst.mockResolvedValueOnce(null);
      mockReconResult.create.mockResolvedValueOnce({
        id: "run-new",
        reconJobId: "job-1",
        status: "running",
        startedAt: new Date(),
      });

      await request(app).post("/api/runs/run-1/retry");

      // Verify $transaction was called with Serializable isolation
      expect(mockedPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: "Serializable",
      });
    });
  });

  describe("List status normalization", () => {
    it("should return canonical lifecycle status values from the merged list adapter", async () => {
      mockScanMergedRunsForLegacyPage.mockResolvedValueOnce({
        data: [{ status: "completed" }, { status: "unknown" }],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
        filters: {},
        pagesScanned: 1,
      });

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe("completed");
      expect(res.body.data[1].status).toBe("unknown");
    });
  });
});
