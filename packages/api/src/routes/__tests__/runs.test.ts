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
    resolveOperatorRunDetailForTenants: jest.fn(),
    normalizeRunStatus: (raw: string | null | undefined) => {
      if (!raw) return "unknown";
      const s = raw.trim().toLowerCase();
      if (["pending", "running", "completed", "failed"].includes(s)) return s;
      return "unknown";
    },
  }),
  { virtual: true }
);

// Access mocked modules after jest.mock is applied
const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;
const {
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
    mockResolveOperatorRunDetail.mockReset();
  });

  describe("GET /api/runs", () => {
    it("should return list of runs tenant-scoped", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([
        {
          id: "run-1",
          reconJobId: "job-1",
          reconJob: { name: "Daily Reconciliation" },
          status: "completed",
          startedAt: new Date("2026-03-17T10:00:00Z"),
          completedAt: new Date("2026-03-17T10:05:00Z"),
          summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
          errorMessage: null,
        },
      ]);
      mockReconResult.count.mockResolvedValueOnce(1);

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: "run-1",
        name: "Daily Reconciliation",
        status: "completed",
        summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
      });

      // Verify tenant isolation via Prisma where clause
      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
      );
    });

    it("should filter by status", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(0);

      const res = await request(app).get("/api/runs?status=running");

      expect(res.status).toBe(200);
      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "running" }),
        })
      );
    });

    it("should filter by search term", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(0);

      const res = await request(app).get("/api/runs?search=reconciliation");

      expect(res.status).toBe(200);
      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reconJob: {
              name: expect.objectContaining({ contains: "reconciliation" }),
            },
          }),
        })
      );
    });

    it("should handle pagination", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(100);

      const res = await request(app).get("/api/runs?page=2&limit=25");

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4,
      });

      // Verify offset calculation: (page-1)*limit = 25
      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 25, take: 25 })
      );
    });

    it("should return empty array when no runs exist", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(0);

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      mockReconResult.findMany.mockRejectedValueOnce(new Error("Database connection failed"));

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(500);
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
    it("should always scope queries to tenantId from auth middleware", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(0);

      await request(app).get("/api/runs");

      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
      );
    });

    it("should use tenantId from auth middleware, not user input", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([]);
      mockReconResult.count.mockResolvedValueOnce(0);

      // Attempt to inject different tenant via header
      await request(app).get("/api/runs").set("x-tenant-id", "malicious-tenant");

      // Should use tenant-123 from auth middleware, not malicious-tenant
      expect(mockReconResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
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
    it("should normalize unknown status values to 'unknown' via canonical normalizeRunStatus", async () => {
      mockReconResult.findMany.mockResolvedValueOnce([
        {
          id: "run-1",
          reconJobId: "job-1",
          reconJob: { name: "Job A" },
          status: "completed",
          startedAt: new Date("2026-03-17T10:00:00Z"),
          completedAt: new Date("2026-03-17T10:05:00Z"),
          summary: null,
        },
        {
          id: "run-2",
          reconJobId: "job-2",
          reconJob: { name: "Job B" },
          status: "some_unexpected_value",
          startedAt: new Date("2026-03-17T11:00:00Z"),
          completedAt: null,
          summary: null,
        },
      ]);
      mockReconResult.count.mockResolvedValueOnce(2);

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe("completed");
      expect(res.body.data[1].status).toBe("unknown");
    });
  });
});
