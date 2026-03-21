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

// Mock Prisma - use jest.fn() inside factory to avoid hoisting issues
jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    reconResult: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Access the mocked module after jest.mock is applied
const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconResult = mockedPrisma.reconResult;

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
    it("should return run detail with stages and progress", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-1",
        reconJobId: "job-1",
        reconJob: { name: "Daily Reconciliation" },
        status: "completed",
        startedAt: new Date("2026-03-17T10:00:00Z"),
        completedAt: new Date("2026-03-17T10:05:00Z"),
        summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
        errorMessage: null,
      });

      const res = await request(app).get("/api/runs/run-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: "run-1",
        name: "Daily Reconciliation",
        status: "completed",
        progress: 100,
        summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
      });
      expect(res.body.data.stages).toHaveLength(4);
      expect(res.body.data.stages[0]).toMatchObject({
        id: "1",
        name: "Initialize",
        status: "completed",
      });

      // Verify tenant isolation
      expect(mockReconResult.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
      );
    });

    it("should return null progress for running jobs", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-2",
        reconJobId: "job-2",
        reconJob: { name: "Running Job" },
        status: "running",
        startedAt: new Date(),
        completedAt: null,
        summary: null,
        errorMessage: null,
      });

      const res = await request(app).get("/api/runs/run-2");

      expect(res.status).toBe(200);
      // Route returns null for running status - no reliable estimate available
      expect(res.body.data.progress).toBeNull();
    });

    it("should return 404 when run not found", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/runs/nonexistent");

      expect(res.status).toBe(404);
    });

    it("should enforce tenant isolation - reject cross-tenant access", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/runs/other-tenant-run");

      expect(res.status).toBe(404);
      expect(mockReconResult.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
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
    it("should handle null summary gracefully", async () => {
      mockReconResult.findFirst.mockResolvedValueOnce({
        id: "run-3",
        reconJobId: "job-3",
        reconJob: { name: "Pending Run" },
        status: "pending",
        startedAt: new Date(),
        completedAt: null,
        summary: null,
        errorMessage: null,
      });

      const res = await request(app).get("/api/runs/run-3");

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeUndefined();
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
  });
});
