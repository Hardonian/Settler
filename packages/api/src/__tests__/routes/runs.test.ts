/**
 * Runs Route Tests
 */

import request from "supertest";
import express, { Express } from "express";
import { runsRouter } from "../../routes/v1/runs";
import { authMiddleware } from "../../middleware/auth";

// Mock database
const mockQuery = jest.fn();
jest.mock("../../db", () => ({
  query: (...args: any[]) => mockQuery(...args),
  queryWithTenant: (tenantId: string, ...args: any[]) => mockQuery(...args),
}));

// Mock auth middleware
jest.mock("../../middleware/auth", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = "test-user-id";
    req.tenantId = "test-tenant-id";
    next();
  },
}));

// Mock authorization
jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock validation
jest.mock("../../middleware/validation", () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock governance
jest.mock("../../middleware/governance", () => ({
  enforceFreezeState: () => (_req: any, _res: any, next: any) => next(),
  bypassFreeze: (_req: any, _res: any, next: any) => next(),
}));

describe("Runs Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use("/api/v1", runsRouter);
    jest.clearAllMocks();
  });

  describe("GET /api/v1/runs", () => {
    it("should return paginated runs for tenant", async () => {
      const mockRuns = [
        {
          id: "run-1",
          tenant_id: "test-tenant-id",
          created_at: "2026-03-17T20:00:00Z",
          updated_at: "2026-03-17T20:00:00Z",
          status: "completed",
          policy_name: "test-policy",
          total_records: 100,
          matched_count: 95,
          unmatched_count: 5,
        },
      ];

      mockQuery
        .mockResolvedValueOnce(mockRuns) // Runs query
        .mockResolvedValueOnce([{ count: "1" }]); // Count query

      const response = await request(app).get("/api/v1/runs?limit=20").expect(200);

      expect(response.body.rows).toHaveLength(1);
      expect(response.body.rows[0].run_id).toBe("run-1");
      expect(response.body.rows[0].status).toBe("completed");
      expect(response.body.pagination).toHaveProperty("total", 1);
    });

    it("should return empty array when no runs exist", async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Runs query
        .mockResolvedValueOnce([{ count: "0" }]); // Count query

      const response = await request(app).get("/api/v1/runs").expect(200);

      expect(response.body.rows).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });

  describe("GET /api/v1/runs/:id", () => {
    it("should return run by ID", async () => {
      const mockRun = {
        id: "run-1",
        tenant_id: "test-tenant-id",
        created_at: "2026-03-17T20:00:00Z",
        status: "completed",
      };

      mockQuery.mockResolvedValueOnce([mockRun]);

      const response = await request(app).get("/api/v1/runs/run-1").expect(200);

      expect(response.body.data.run_id).toBe("run-1");
    });

    it("should return 404 when run not found", async () => {
      mockQuery.mockResolvedValueOnce([]);

      await request(app).get("/api/v1/runs/missing").expect(404);
    });
  });
});
