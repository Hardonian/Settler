/**
 * Runs Route Tests
 *
 * Tests for operator-facing runs API:
 * - Tenant isolation
 * - List and detail endpoints
 * - Permission enforcement
 * - Empty states
 * - Error handling
 */

import request from "supertest";
import express from "express";
import { runsRouter } from "../runs";
import { query } from "../../db";
import { authMiddleware, AuthRequest } from "../../middleware/auth";

// Mock dependencies
jest.mock("../../db");
jest.mock("../../middleware/auth");

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("Runs Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware to set tenant and user
    app.use((req, res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      next();
    });

    app.use("/api", runsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/runs", () => {
    it("should return list of runs tenant-scoped", async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            id: "run-1",
            job_id: "job-1",
            job_name: "Daily Reconciliation",
            status: "completed",
            started_at: new Date("2026-03-17T10:00:00Z"),
            completed_at: new Date("2026-03-17T10:05:00Z"),
            summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
            error: null,
          },
        ])
        .mockResolvedValueOnce([{ count: "1" }]);

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: "run-1",
        name: "Daily Reconciliation",
        status: "completed",
        summary: {
          total: 100,
          matched: 95,
          unmatched: 5,
          conflicts: 0,
        },
      });

      // Verify tenant isolation
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("j.tenant_id = $1"),
        expect.arrayContaining(["tenant-123"])
      );
    });

    it("should filter by status", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

      const res = await request(app).get("/api/runs?status=running");

      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("e.status = $2"),
        expect.arrayContaining(["tenant-123", "running"])
      );
    });

    it("should filter by search term", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

      const res = await request(app).get("/api/runs?search=reconciliation");

      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("j.name ILIKE"),
        expect.arrayContaining(["tenant-123", "%reconciliation%"])
      );
    });

    it("should handle pagination", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "100" }]);

      const res = await request(app).get("/api/runs?page=2&limit=25");

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4,
      });

      // Verify offset calculation
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([25]) // offset = (page - 1) * limit = (2-1)*25 = 25
      );
    });

    it("should return empty array when no runs exist", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should handle database errors gracefully", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database connection failed"));

      const res = await request(app).get("/api/runs");

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        error: expect.any(String),
        errorCode: expect.any(String),
      });
    });
  });

  describe("GET /api/runs/:runId", () => {
    it("should return run detail with stages and progress", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: "run-1",
          job_id: "job-1",
          job_name: "Daily Reconciliation",
          status: "completed",
          started_at: new Date("2026-03-17T10:00:00Z"),
          completed_at: new Date("2026-03-17T10:05:00Z"),
          summary: { total: 100, matched: 95, unmatched: 5, conflicts: 0 },
          error: null,
        },
      ]);

      const res = await request(app).get("/api/runs/run-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: "run-1",
        name: "Daily Reconciliation",
        status: "completed",
        progress: 100,
        summary: {
          total: 100,
          matched: 95,
          unmatched: 5,
          conflicts: 0,
        },
      });
      expect(res.body.data.stages).toHaveLength(4);
      expect(res.body.data.stages[0]).toMatchObject({
        id: "1",
        name: "Initialize",
        status: "completed",
      });

      // Verify tenant isolation
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("j.tenant_id = $2"),
        expect.arrayContaining(["run-1", "tenant-123"])
      );
    });

    it("should calculate progress for running jobs", async () => {
      const now = new Date();
      const started = new Date(now.getTime() - 15000); // Started 15s ago

      mockQuery.mockResolvedValueOnce([
        {
          id: "run-2",
          job_id: "job-2",
          job_name: "Running Job",
          status: "running",
          started_at: started,
          completed_at: null,
          summary: null,
          error: null,
        },
      ]);

      const res = await request(app).get("/api/runs/run-2");

      expect(res.status).toBe(200);
      expect(res.body.data.progress).toBeGreaterThan(0);
      expect(res.body.data.progress).toBeLessThan(100);
    });

    it("should return 404 when run not found", async () => {
      mockQuery.mockResolvedValueOnce([]);

      const res = await request(app).get("/api/runs/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("should enforce tenant isolation - reject cross-tenant access", async () => {
      // Run belongs to different tenant
      mockQuery.mockResolvedValueOnce([]);

      const res = await request(app).get("/api/runs/other-tenant-run");

      expect(res.status).toBe(404);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["other-tenant-run", "tenant-123"])
      );
    });

    it("should handle invalid UUID format", async () => {
      const res = await request(app).get("/api/runs/invalid-uuid");

      expect(res.status).toBe(400);
    });
  });

  describe("Tenant Safety Verification", () => {
    it("should never query without tenant_id in WHERE clause", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

      await request(app).get("/api/runs");

      const sqlQuery = mockQuery.mock.calls[0]?.[0] as string;
      expect(sqlQuery).toContain("j.tenant_id = $1");
    });

    it("should use tenant_id from auth middleware, not user input", async () => {
      mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ count: "0" }]);

      // Attempt to inject different tenant via header
      await request(app).get("/api/runs").set("x-tenant-id", "malicious-tenant");

      // Should use tenant-123 from auth middleware, not malicious-tenant
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(["tenant-123"])
      );
    });
  });

  describe("Data Integrity", () => {
    it("should handle null/undefined summary gracefully", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: "run-3",
          job_id: "job-3",
          job_name: "Pending Run",
          status: "pending",
          started_at: new Date(),
          completed_at: null,
          summary: null,
          error: null,
        },
      ]);

      const res = await request(app).get("/api/runs/run-3");

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeUndefined();
    });

    it("should handle malformed summary data", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          id: "run-4",
          job_id: "job-4",
          job_name: "Bad Summary",
          status: "completed",
          started_at: new Date(),
          completed_at: new Date(),
          summary: { invalid: "data" }, // Missing expected fields
          error: null,
        },
      ]);

      const res = await request(app).get("/api/runs/run-4");

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toMatchObject({
        total: 0,
        matched: 0,
        unmatched: 0,
        conflicts: 0,
      });
    });
  });

  describe("POST /api/runs/:id/exceptions/:exceptionId/resolve", () => {
    it("should fail with 423 Locked during system freeze", async () => {
      // Mock governance freeze check to return frozen
      mockQuery.mockResolvedValueOnce([{ frozen: true }]);

      const res = await request(app)
        .post("/api/runs/run-1/exceptions/exc-1/resolve")
        .send({ status: "resolved", notes: "Test resolution" });

      expect(res.status).toBe(423);
      expect(res.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
    });

    it("should resolve exception and fully audit the change", async () => {
      // 1. Mock freeze check -> unfrozen
      mockQuery.mockResolvedValueOnce([{ frozen: false }]);
      // 2. Mock exception existence check
      mockQuery.mockResolvedValueOnce([{ id: "exc-1", status: "pending" }]);
      // 3. Mock UPDATE exceptions
      mockQuery.mockResolvedValueOnce([]);
      // 4. Mock INSERT audit_logs
      mockQuery.mockResolvedValueOnce([]);

      const res = await request(app)
        .post("/api/runs/run-1/exceptions/exc-1/resolve")
        .send({ status: "resolved", notes: "Matched manually" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("resolved");

      // Verify consequence/audit invariant: the mutation MUST leave an audit trail
      const auditCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("INSERT INTO audit_logs")
      );

      expect(auditCall).toBeDefined();
      expect(auditCall![1]).toEqual(
        expect.arrayContaining([
          "tenant-123",
          "user-456",
          "resolve_exception",
          "exception",
          "exc-1",
          expect.stringContaining('"new_status":"resolved"'),
        ])
      );
    });

    it("should return 404 if exception not found or unauthorized", async () => {
      mockQuery.mockResolvedValueOnce([{ frozen: false }]);
      mockQuery.mockResolvedValueOnce([]); // No exception found

      const res = await request(app)
        .post("/api/runs/run-1/exceptions/nonexistent/resolve")
        .send({ status: "resolved" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/runs/:id/retry", () => {
    it("should queue run for retry and log audit action", async () => {
      mockQuery.mockResolvedValueOnce([{ frozen: false }]);
      mockQuery.mockResolvedValueOnce([{ id: "run-1", status: "failed" }]);
      mockQuery.mockResolvedValueOnce([]); // UPDATE run
      mockQuery.mockResolvedValueOnce([]); // INSERT audit

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should block retry if run is already in progress", async () => {
      mockQuery.mockResolvedValueOnce([{ frozen: false }]);
      mockQuery.mockResolvedValueOnce([{ id: "run-1", status: "running" }]);

      const res = await request(app).post("/api/runs/run-1/retry");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_STATE");
    });
  });
});
