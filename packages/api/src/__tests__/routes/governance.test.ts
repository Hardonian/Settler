/**
 * Governance Route Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import { governanceRouter } from "../../routes/v1/governance";
import { authMiddleware } from "../../middleware/auth";

// Mock database
const mockQuery = vi.fn();
vi.mock("../../db", () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

// Mock auth middleware
vi.mock("../../middleware/auth", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = "test-user-id";
    req.tenantId = "test-tenant-id";
    next();
  },
}));

// Mock authorization
vi.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
}));

describe("Governance Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authMiddleware);
    app.use("/api/v1", governanceRouter);
    vi.clearAllMocks();
  });

  describe("GET /api/v1/governance/freeze", () => {
    it("should return freeze state when record exists", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          tenant_id: "test-tenant-id",
          frozen: true,
          frozen_at: "2026-03-17T20:00:00Z",
          frozen_by: "admin-user-id",
          freeze_reason: "Emergency maintenance",
          updated_at: "2026-03-17T20:00:00Z",
        },
      ]);

      const response = await request(app).get("/api/v1/governance/freeze").expect(200);

      expect(response.body.data.frozen).toBe(true);
      expect(response.body.data.freeze_reason).toBe("Emergency maintenance");
    });

    it("should return default unfrozen state when no record exists", async () => {
      mockQuery.mockResolvedValueOnce([]);

      const response = await request(app).get("/api/v1/governance/freeze").expect(200);

      expect(response.body.data.frozen).toBe(false);
      expect(response.body.data.frozen_at).toBeNull();
    });
  });

  describe("POST /api/v1/governance/freeze", () => {
    it("should freeze system with reason", async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            tenant_id: "test-tenant-id",
            frozen: true,
            frozen_at: "2026-03-17T20:00:00Z",
            frozen_by: "test-user-id",
            freeze_reason: "Emergency",
            updated_at: "2026-03-17T20:00:00Z",
          },
        ])
        .mockResolvedValueOnce([]); // Audit log insert

      const response = await request(app)
        .post("/api/v1/governance/freeze")
        .send({ frozen: true, reason: "Emergency" })
        .expect(200);

      expect(response.body.data.frozen).toBe(true);
      expect(response.body.message).toContain("frozen successfully");
    });

    it("should unfreeze system", async () => {
      mockQuery
        .mockResolvedValueOnce([
          {
            tenant_id: "test-tenant-id",
            frozen: false,
            frozen_at: null,
            frozen_by: null,
            freeze_reason: null,
            updated_at: "2026-03-17T20:00:00Z",
          },
        ])
        .mockResolvedValueOnce([]); // Audit log insert

      const response = await request(app)
        .post("/api/v1/governance/freeze")
        .send({ frozen: false })
        .expect(200);

      expect(response.body.data.frozen).toBe(false);
      expect(response.body.message).toContain("unfrozen successfully");
    });
  });
});
