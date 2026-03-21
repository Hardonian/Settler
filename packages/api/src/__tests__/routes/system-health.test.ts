/**
 * System Health Route Tests
 */

import request from "supertest";
import express, { Express } from "express";
import { systemHealthRouter } from "../../routes/v1/system-health";
import { authMiddleware } from "../../middleware/auth";

// Mock the HealthCheckService
jest.mock("../../infrastructure/observability/health", () => ({
  HealthCheckService: jest.fn().mockImplementation(() => ({
    checkAll: jest.fn().mockResolvedValue({
      status: "healthy",
      checks: {
        database: { status: "healthy", latency: 5, timestamp: new Date().toISOString() },
        redis: {
          status: "degraded",
          error: "Redis not configured",
          timestamp: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    }),
  })),
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

describe("System Health Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use("/api/v1", systemHealthRouter);
  });

  describe("GET /api/v1/system-health", () => {
    it("should return system health status", async () => {
      const response = await request(app).get("/api/v1/system-health").expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("status");
      expect(response.body.data).toHaveProperty("checks");
      expect(response.body.data).toHaveProperty("timestamp");
    });

    it("should include database health check", async () => {
      const response = await request(app).get("/api/v1/system-health").expect(200);

      expect(response.body.data.checks).toHaveProperty("database");
      expect(response.body.data.checks.database.status).toBe("healthy");
    });
  });
});
