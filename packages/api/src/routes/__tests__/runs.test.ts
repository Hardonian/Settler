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

jest.mock(
  "@settler/reconciliation-core",
  () => ({
    decodeMergedRunsCursor: jest.fn(),
    encodeMergedRunsCursor: jest.fn((cursor: unknown) => JSON.stringify(cursor)),
    fetchMergedReconciliationRunsPage: jest.fn(),
    mapCanonicalListItemToApiRunsLegacyRow: jest.fn((row: any) => ({
      runKind: row.runKind,
      sourceModel: row.provenance.sourceModel,
      id: row.id,
      detailHref: `/console/runs/${row.id}`,
      name: row.name,
      status: row.lifecycle.status,
      statusLabel: row.lifecycle.statusLabel,
      startedAt: row.timestamps.startedAt ?? row.timestamps.createdAt,
      completedAt: row.timestamps.completedAt,
      summary: {
        total: row.summary.total,
        sourceCount: row.summary.sourceCount,
        targetCount: row.summary.targetCount,
        matched: row.summary.matched,
        unmatched: row.summary.unmatched,
        unmatchedSourceCount: row.summary.unmatchedSourceCount,
        unmatchedTargetCount: row.summary.unmatchedTargetCount,
        conflicts: row.summary.conflicts,
      },
      summarySemantics: {
        processed: row.summary.processed,
        matchedWithTolerance: row.summary.matchedWithTolerance,
        exceptioned: row.summary.exceptioned,
        unresolved: row.summary.unresolved,
        ignored: row.summary.ignored,
        resolved: row.summary.resolved,
      },
      summaryState: row.summaryState,
      progress: row.lifecycle.progressPercent,
      progressState: row.lifecycle.progressState,
      isTerminal: row.lifecycle.isTerminal,
      provenance: row.provenance,
      configDrift: {
        status: row.configDrift.status,
        adapter: "none",
      },
      ingestionId: row.provenance.ingestionId,
      sourceAdapter: row.adapters.sourceAdapter,
      targetAdapter: row.adapters.targetAdapter,
    })),
    MergedRunsCursorError: class MergedRunsCursorError extends Error {},
    resolveOperatorRunDetailForTenants: jest.fn(),
  }),
  { virtual: true }
);

// Access mocked modules after jest.mock is applied
const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;
const {
  decodeMergedRunsCursor: mockDecodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage: mockFetchMergedReconciliationRunsPage,
  mapCanonicalListItemToApiRunsLegacyRow: mockMapCanonicalListItemToApiRunsLegacyRow,
  resolveOperatorRunDetailForTenants: mockResolveOperatorRunDetail,
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
    mockFetchMergedReconciliationRunsPage.mockReset();
    mockDecodeMergedRunsCursor.mockReset();
    mockMapCanonicalListItemToApiRunsLegacyRow.mockClear();
    mockResolveOperatorRunDetail.mockReset();
  });

  describe("GET /api/runs", () => {
    it("should return merged canonical runs adapted into the Express envelope", async () => {
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [buildCanonicalListItem()],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 1,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
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

      expect(mockFetchMergedReconciliationRunsPage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          runKind: "all",
          limit: 100,
          cursorState: null,
        })
      );
    });

    it("should filter merged rows by status after canonical adaptation", async () => {
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [
          buildCanonicalListItem(),
          buildCanonicalListItem({
            id: "run-2",
            name: "Nightly",
            lifecycle: {
              status: "running",
              statusLabel: "Running",
              isTerminal: false,
              progressPercent: 45,
              progressState: "in_progress",
            },
            summaryState: "in_progress",
            timestamps: {
              createdAt: "2026-03-18T09:59:00.000Z",
              startedAt: "2026-03-18T10:00:00.000Z",
              completedAt: null,
              updatedAt: "2026-03-18T10:01:00.000Z",
            },
          }),
        ],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 2,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      const res = await request(app).get("/api/runs?status=running");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("run-2");
    });

    it("should filter merged rows by search across canonical id/name fields", async () => {
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [
          buildCanonicalListItem({ id: "run-a", name: "Daily Reconciliation" }),
          buildCanonicalListItem({ id: "special-run", name: "Monthly Close" }),
        ],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 2,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      const res = await request(app).get("/api/runs?search=special");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("special-run");
    });

    it("should handle pagination", async () => {
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: Array.from({ length: 60 }, (_, index) =>
          buildCanonicalListItem({
            id: `run-${index + 1}`,
            name: `Run ${index + 1}`,
          })
        ),
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 60,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
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
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 0,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      mockFetchMergedReconciliationRunsPage.mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(500);
    });

    it("should continue scanning merged pages to satisfy legacy page offsets", async () => {
      mockFetchMergedReconciliationRunsPage
        .mockResolvedValueOnce({
          runs: Array.from({ length: 100 }, (_, index) =>
            buildCanonicalListItem({
              id: `run-${index + 1}`,
              name: `Run ${index + 1}`,
            })
          ),
          next_cursor: "cursor-1",
          pagination: {
            limit: 100,
            returned: 100,
            has_more: true,
            job_stream_has_more: true,
            ingestion_stream_has_more: false,
            job_stream_exhausted: false,
            ingestion_stream_exhausted: true,
          },
          response_meta: {
            contract_version: 1,
            included_run_kinds: ["recon_job", "ingestion_run"],
            ordering: "test-ordering",
            consistency: "read_committed",
          },
        })
        .mockResolvedValueOnce({
          runs: Array.from({ length: 40 }, (_, index) =>
            buildCanonicalListItem({
              id: `run-${index + 101}`,
              name: `Run ${index + 101}`,
            })
          ),
          next_cursor: null,
          pagination: {
            limit: 100,
            returned: 40,
            has_more: false,
            job_stream_has_more: false,
            ingestion_stream_has_more: false,
            job_stream_exhausted: true,
            ingestion_stream_exhausted: true,
          },
          response_meta: {
            contract_version: 1,
            included_run_kinds: ["recon_job", "ingestion_run"],
            ordering: "test-ordering",
            consistency: "read_committed",
          },
        });
      mockDecodeMergedRunsCursor.mockReturnValueOnce({
        v: 1,
        ij: { t: "2026-03-17T10:05:00.000Z", id: "run-100" },
        ir: null,
      });

      const res = await request(app).get("/api/runs?page=3&limit=50");

      expect(res.status).toBe(200);
      expect(mockFetchMergedReconciliationRunsPage).toHaveBeenCalledTimes(2);
      expect(mockDecodeMergedRunsCursor).toHaveBeenCalledWith("cursor-1");
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
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 0,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      await request(app).get("/api/runs");

      expect(mockFetchMergedReconciliationRunsPage).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
        })
      );
    });

    it("should use tenantId from auth middleware, not user input", async () => {
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 0,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      // Attempt to inject different tenant via header
      await request(app).get("/api/runs").set("x-tenant-id", "malicious-tenant");

      // Should use tenant-123 from auth middleware, not malicious-tenant
      expect(mockFetchMergedReconciliationRunsPage).toHaveBeenCalledWith(
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
      mockFetchMergedReconciliationRunsPage.mockResolvedValueOnce({
        runs: [
          buildCanonicalListItem(),
          buildCanonicalListItem({
            id: "run-2",
            name: "Job B",
            lifecycle: {
              status: "unknown",
              statusLabel: "Unknown",
              isTerminal: false,
              progressPercent: 0,
              progressState: "unknown",
            },
            summaryState: "unknown",
            timestamps: {
              createdAt: "2026-03-17T11:00:00.000Z",
              startedAt: "2026-03-17T11:00:00.000Z",
              completedAt: null,
              updatedAt: "2026-03-17T11:00:00.000Z",
            },
          }),
        ],
        next_cursor: null,
        pagination: {
          limit: 100,
          returned: 2,
          has_more: false,
          job_stream_has_more: false,
          ingestion_stream_has_more: false,
          job_stream_exhausted: true,
          ingestion_stream_exhausted: true,
        },
        response_meta: {
          contract_version: 1,
          included_run_kinds: ["recon_job", "ingestion_run"],
          ordering: "test-ordering",
          consistency: "read_committed",
        },
      });

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe("completed");
      expect(res.body.data[1].status).toBe("unknown");
    });
  });
});
