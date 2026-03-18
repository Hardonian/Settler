/**
 * Approval Workflows Freeze Protection Tests
 *
 * Tests for governance freeze enforcement on approval workflow endpoints:
 * - POST /api/v1/approvals/requests - Create approval request
 * - POST /api/v1/approvals/approvers - Add approver
 */

import request from "supertest";
import express from "express";
import { approvalsRouter } from "../v1/approvals";
import { query } from "../../db";
import { authMiddleware, AuthRequest } from "../../middleware/auth";

// Mock dependencies
jest.mock("../../db");
jest.mock("../../middleware/auth");

const mockQuery = query as jest.MockedFunction<typeof query>;

describe("Approvals Freeze Protection", () => {
  let app: express.Express;

  // Mock frozen governance state
  const frozenGovernanceState = {
    frozen: true,
    frozen_at: "2026-03-17T10:00:00Z",
    frozen_by: "admin@example.com",
    freeze_reason: "Pre-launch validation mode",
  };

  // Mock unfrozen governance state
  const unfrozenGovernanceState = {
    frozen: false,
    frozen_at: null,
    frozen_by: null,
    freeze_reason: null,
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware to set tenant and user
    app.use((req, res, next) => {
      (req as AuthRequest).tenantId = "tenant-123";
      (req as AuthRequest).userId = "user-456";
      (req as AuthRequest).traceId = "test-trace-123";
      next();
    });

    app.use("/api/v1/approvals", approvalsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/approvals/requests", () => {
    it("should return 423 when system is frozen", async () => {
      // Mock frozen governance state
      mockQuery
        .mockResolvedValueOnce([frozenGovernanceState])
        .mockResolvedValueOnce([{ count: "0" }]);

      const response = await request(app)
        .post("/api/v1/approvals/requests")
        .send({
          requestType: "reconciliation_approval",
          requestDetails: { reconciliationRunId: "run-123" },
        });

      expect(response.status).toBe(423);
      expect(response.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
      expect(response.body.frozen).toBe(true);
      expect(response.body.freeze_reason).toBe("Pre-launch validation mode");
    });

    it("should allow request when system is unfrozen", async () => {
      // Mock unfrozen governance state
      mockQuery.mockResolvedValueOnce([unfrozenGovernanceState]);

      const response = await request(app)
        .post("/api/v1/approvals/requests")
        .send({
          requestType: "reconciliation_approval",
          requestDetails: { reconciliationRunId: "run-123" },
        });

      // Should not return 423 (either succeeds or fails for other reasons)
      expect(response.status).not.toBe(423);
    });
  });

  describe("POST /api/v1/approvals/approvers", () => {
    it("should return 423 when system is frozen", async () => {
      // Mock frozen governance state
      mockQuery
        .mockResolvedValueOnce([frozenGovernanceState])
        .mockResolvedValueOnce([{ count: "0" }]);

      const response = await request(app).post("/api/v1/approvals/approvers").send({
        userId: "user-789",
        role: "approver",
      });

      expect(response.status).toBe(423);
      expect(response.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
      expect(response.body.frozen).toBe(true);
      expect(response.body.freeze_reason).toBe("Pre-launch validation mode");
    });

    it("should allow request when system is unfrozen", async () => {
      // Mock unfrozen governance state
      mockQuery.mockResolvedValueOnce([unfrozenGovernanceState]);

      const response = await request(app).post("/api/v1/approvals/approvers").send({
        userId: "user-789",
        role: "approver",
      });

      // Should not return 423 (either succeeds or fails for other reasons)
      expect(response.status).not.toBe(423);
    });
  });
});
