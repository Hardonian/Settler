/**
 * Governance Middleware Tests
 */

import { Request, Response } from "express";
import { enforceFreezeState, checkTenantFrozen } from "../../middleware/governance";
import { clearGovernanceCache } from "../../utils/governance-cache";

// Mock database
const mockQuery = jest.fn();
jest.mock("../../db", () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

describe("Governance Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;

  beforeEach(() => {
    clearGovernanceCache();
    mockReq = {
      tenantId: "test-tenant-id",
      userId: "test-user-id",
      traceId: "test-trace-id",
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFn = jest.fn();
    jest.clearAllMocks();
  });

  describe("checkTenantFrozen", () => {
    it("should return frozen state when tenant is frozen", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          frozen: true,
          frozen_at: "2026-03-17T20:00:00Z",
          frozen_by: "admin-user-id",
          freeze_reason: "Emergency maintenance",
        },
      ]);

      const result = await checkTenantFrozen("test-tenant-id");

      expect(result.frozen).toBe(true);
      expect(result.freeze_reason).toBe("Emergency maintenance");
    });

    it("should return unfrozen when no governance record exists", async () => {
      mockQuery.mockResolvedValueOnce([]);

      const result = await checkTenantFrozen("test-tenant-id");

      expect(result.frozen).toBe(false);
    });

    it("should default to frozen on database error (fail-closed security posture)", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      const result = await checkTenantFrozen("test-tenant-id");

      expect(result.frozen).toBe(true);
    });
  });

  describe("enforceFreezeState middleware", () => {
    it("should allow operation when tenant is not frozen", async () => {
      mockQuery.mockResolvedValueOnce([]);

      const middleware = enforceFreezeState();
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should block operation when tenant is frozen", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          frozen: true,
          frozen_at: "2026-03-17T20:00:00Z",
          frozen_by: "admin-user-id",
          freeze_reason: "Emergency",
        },
      ]);

      const middleware = enforceFreezeState();
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(423);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "GOVERNANCE_FREEZE_ACTIVE",
          frozen: true,
          freeze_reason: "Emergency",
        })
      );
    });

    it("should allow bypass when allowWhenFrozen is true", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          frozen: true,
          frozen_at: "2026-03-17T20:00:00Z",
          frozen_by: "admin-user-id",
          freeze_reason: "Emergency",
        },
      ]);

      const middleware = enforceFreezeState({ allowWhenFrozen: true });
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 400 when tenant context is missing", async () => {
      mockReq.tenantId = undefined;

      const middleware = enforceFreezeState();
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "TENANT_CONTEXT_REQUIRED",
        })
      );
    });

    it("should use custom error message when provided", async () => {
      mockQuery.mockResolvedValueOnce([
        {
          frozen: true,
          frozen_at: "2026-03-17T20:00:00Z",
          frozen_by: "admin-user-id",
          freeze_reason: "Scheduled maintenance",
        },
      ]);

      const customMessage = "Custom freeze message";
      const middleware = enforceFreezeState({ errorMessage: customMessage });
      await middleware(mockReq, mockRes, nextFn);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage,
        })
      );
    });
  });
});
