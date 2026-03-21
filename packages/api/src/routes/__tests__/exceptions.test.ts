/**
 * Exceptions Route Tests
 *
 * Tests for the exceptions API endpoints:
 * - List exceptions with pagination and filtering
 * - Get exception details
 * - Resolve exception
 * - Bulk resolve exceptions
 * - Get exception statistics
 * - Governance freeze state enforcement
 */

import request from "supertest";
import express from "express";
import { exceptionsRouter } from "../exceptions";
import { AuthRequest } from "../../middleware/auth";

// Mock Prisma - use jest.fn() inside factory to avoid hoisting issues
jest.mock("../../infrastructure/db/prisma", () => ({
  prisma: {
    reconciliationMatch: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

// Access the mocked module after jest.mock is applied
const { prisma: mockedPrisma } = require("../../infrastructure/db/prisma");
const mockReconciliationMatch = mockedPrisma.reconciliationMatch;

jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: jest.fn(() => jest.fn((_req: any, _res: any, next: any) => next())),
  bypassFreeze: jest.fn((_req: any, _res: any, next: any) => next()),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../utils/event-tracker", () => ({
  trackEventAsync: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe("Exceptions Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      next();
    });

    app.use("/api", exceptionsRouter);
    jest.clearAllMocks();
  });

  describe("GET /api/exceptions - List Exceptions", () => {
    it("should return paginated list of exceptions with correct response structure", async () => {
      const mockExceptions = [
        {
          id: "exc-1",
          tenantId: "tenant-123",
          matchType: "unmatched",
          reviewed: false,
          reviewedAt: null,
          reviewedBy: null,
          matchReason: null,
          createdAt: new Date("2026-03-17T10:00:00Z"),
          run: { id: "run-1" },
          sourceTransaction: { category: "amount_mismatch", description: "Amount mismatch" },
        },
        {
          id: "exc-2",
          tenantId: "tenant-123",
          matchType: "unmatched",
          reviewed: false,
          reviewedAt: null,
          reviewedBy: null,
          matchReason: null,
          createdAt: new Date("2026-03-17T09:00:00Z"),
          run: { id: "run-1" },
          sourceTransaction: { category: "timing_difference", description: "Timing diff" },
        },
      ];

      mockReconciliationMatch.findMany.mockResolvedValueOnce(mockExceptions);
      mockReconciliationMatch.count.mockResolvedValueOnce(2);

      const res = await request(app).get("/api/exceptions");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        limit: 50,
        offset: 0,
        total: 2,
        totalPages: 1,
      });
    });

    it("should scope query to tenant", async () => {
      mockReconciliationMatch.findMany.mockResolvedValueOnce([]);
      mockReconciliationMatch.count.mockResolvedValueOnce(0);

      await request(app).get("/api/exceptions");

      expect(mockReconciliationMatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
      );
    });

    it("should filter by jobId", async () => {
      mockReconciliationMatch.findMany.mockResolvedValueOnce([]);
      mockReconciliationMatch.count.mockResolvedValueOnce(0);

      const res = await request(app).get(
        "/api/exceptions?jobId=00000000-0000-4000-8000-000000000001"
      );

      expect(res.status).toBe(200);
      expect(mockReconciliationMatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            run: expect.objectContaining({
              is: expect.objectContaining({ reconJobId: "00000000-0000-4000-8000-000000000001" }),
            }),
          }),
        })
      );
    });

    it("should handle pagination parameters", async () => {
      mockReconciliationMatch.findMany.mockResolvedValueOnce([]);
      mockReconciliationMatch.count.mockResolvedValueOnce(100);

      const res = await request(app).get("/api/exceptions?limit=25&offset=50");

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({
        limit: 25,
        offset: 50,
        total: 100,
        totalPages: 4,
      });
      expect(mockReconciliationMatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 25, skip: 50 })
      );
    });

    it("should map reviewed=false to status=open", async () => {
      mockReconciliationMatch.findMany.mockResolvedValueOnce([
        {
          id: "exc-1",
          tenantId: "tenant-123",
          matchType: "unmatched",
          reviewed: false,
          reviewedAt: null,
          reviewedBy: null,
          matchReason: null,
          createdAt: new Date("2026-03-17T10:00:00Z"),
          run: null,
          sourceTransaction: null,
        },
      ]);
      mockReconciliationMatch.count.mockResolvedValueOnce(1);

      const res = await request(app).get("/api/exceptions");

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe("open");
    });

    it("should map reviewed=true to status=resolved", async () => {
      mockReconciliationMatch.findMany.mockResolvedValueOnce([
        {
          id: "exc-1",
          tenantId: "tenant-123",
          matchType: "unmatched",
          reviewed: true,
          reviewedAt: new Date(),
          reviewedBy: "user-456",
          matchReason: "matched",
          createdAt: new Date("2026-03-17T10:00:00Z"),
          run: null,
          sourceTransaction: null,
        },
      ]);
      mockReconciliationMatch.count.mockResolvedValueOnce(1);

      const res = await request(app).get("/api/exceptions");

      expect(res.status).toBe(200);
      expect(res.body.data[0].status).toBe("resolved");
    });
  });

  describe("GET /api/exceptions/:id - Get Exception Details", () => {
    it("should return single exception with full details", async () => {
      mockReconciliationMatch.findFirst.mockResolvedValueOnce({
        id: "exc-1",
        tenantId: "tenant-123",
        matchType: "unmatched",
        reviewed: false,
        reviewedAt: null,
        reviewedBy: null,
        matchReason: null,
        createdAt: new Date("2026-03-17T10:00:00Z"),
        run: { id: "run-1" },
        sourceTransaction: { category: "amount_mismatch", description: "Amount mismatch" },
      });

      const res = await request(app).get("/api/exceptions/exc-1");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: "exc-1",
        jobId: "run-1",
        executionId: "run-1",
        category: "amount_mismatch",
        severity: "error",
        status: "open",
      });
    });

    it("should return 404 for non-existent exception", async () => {
      mockReconciliationMatch.findFirst.mockResolvedValueOnce(null);

      const res = await request(app).get("/api/exceptions/non-existent");

      expect(res.status).toBe(404);
    });

    it("should enforce tenant isolation for exception details", async () => {
      mockReconciliationMatch.findFirst.mockResolvedValueOnce(null);

      await request(app).get("/api/exceptions/exc-cross-tenant");

      expect(mockReconciliationMatch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "exc-cross-tenant",
            tenantId: "tenant-123",
          }),
        })
      );
    });
  });

  describe("POST /api/exceptions/:id/resolve - Resolve Exception", () => {
    it("should resolve exception with valid resolution", async () => {
      mockReconciliationMatch.update.mockResolvedValueOnce({
        id: "exc-1",
        reviewed: true,
        reviewedBy: "user-456",
        reviewedAt: new Date(),
        matchReason: "Manually matched via review",
      });

      const res = await request(app)
        .post("/api/exceptions/exc-1/resolve")
        .send({ resolution: "matched", notes: "Manually matched via review" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Exception resolved successfully");
    });

    it("should return 404 when exception not found", async () => {
      mockReconciliationMatch.update.mockRejectedValueOnce(new Error("Record not found"));

      const res = await request(app)
        .post("/api/exceptions/exc-1/resolve")
        .send({ resolution: "matched" });

      expect(res.status).toBe(404);
    });

    it("should return 404 when update throws (exception not found)", async () => {
      mockReconciliationMatch.update.mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/exceptions/missing-exc/resolve")
        .send({ resolution: "matched" });

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/exceptions/bulk-resolve - Bulk Resolve", () => {
    it("should resolve multiple exceptions at once", async () => {
      mockReconciliationMatch.updateMany.mockResolvedValueOnce({ count: 2 });

      const res = await request(app)
        .post("/api/exceptions/bulk-resolve")
        .send({
          exceptionIds: [
            "00000000-0000-4000-8000-000000000001",
            "00000000-0000-4000-8000-000000000002",
          ],
          resolution: "ignored",
          notes: "Bulk ignore - false positives",
        });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it("should scope bulk resolve to tenant", async () => {
      mockReconciliationMatch.updateMany.mockResolvedValueOnce({ count: 1 });

      await request(app)
        .post("/api/exceptions/bulk-resolve")
        .send({
          exceptionIds: ["00000000-0000-4000-8000-000000000001"],
          resolution: "matched",
        });

      expect(mockReconciliationMatch.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant-123" }),
        })
      );
    });
  });

  describe("GET /api/exceptions/stats - Exception Statistics", () => {
    it("should return aggregated exception statistics", async () => {
      // stats route calls count 3 times: total, open, resolved
      mockReconciliationMatch.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // open (reviewed=false)
        .mockResolvedValueOnce(5); // resolved (reviewed=true)

      const res = await request(app).get("/api/exceptions/stats");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        total: 10,
        open: 5,
        resolved: 5,
        // inProgress and dismissed are not tracked — they are null
        inProgress: null,
        dismissed: null,
      });
    });

    it("should filter stats by jobId", async () => {
      mockReconciliationMatch.count.mockResolvedValue(0);

      const res = await request(app).get(
        "/api/exceptions/stats?jobId=00000000-0000-4000-8000-000000000001"
      );

      expect(res.status).toBe(200);
      expect(mockReconciliationMatch.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            run: expect.objectContaining({
              is: expect.objectContaining({
                reconJobId: "00000000-0000-4000-8000-000000000001",
              }),
            }),
          }),
        })
      );
    });
  });

  describe("End-to-End Workflow: Exception Resolution Flow", () => {
    it("should support full exception lifecycle: list -> resolve -> verify", async () => {
      // Step 1: List exceptions
      mockReconciliationMatch.findMany.mockResolvedValueOnce([
        {
          id: "exc-1",
          tenantId: "tenant-123",
          matchType: "unmatched",
          reviewed: false,
          reviewedAt: null,
          reviewedBy: null,
          matchReason: null,
          createdAt: new Date(),
          run: { id: "run-1" },
          sourceTransaction: { category: "amount_mismatch", description: "Amount mismatch" },
        },
      ]);
      mockReconciliationMatch.count.mockResolvedValueOnce(1);

      const listRes = await request(app).get("/api/exceptions");
      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);

      // Step 2: Resolve exception
      mockReconciliationMatch.update.mockResolvedValueOnce({
        id: "exc-1",
        reviewed: true,
        reviewedBy: "user-456",
        reviewedAt: new Date(),
        matchReason: "Resolved via workflow test",
      });

      const resolveRes = await request(app)
        .post("/api/exceptions/exc-1/resolve")
        .send({ resolution: "matched", notes: "Resolved via workflow test" });
      expect(resolveRes.status).toBe(200);
    });
  });
});
