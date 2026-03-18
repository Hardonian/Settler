/**
 * Governance API Route
 * Tenant-level governance controls including system freeze
 */

import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { bypassFreeze } from "../../middleware/governance";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import { validateRequest } from "../../middleware/validation";
import { query } from "../../db";
import { invalidateTenantFreezeCache } from "../../utils/governance-cache";

const router: Router = Router();

const setFreezeSchema = z.object({
  body: z.object({
    frozen: z.boolean(),
    reason: z.string().min(1).max(500).optional(),
  }),
});

/**
 * GET /api/v1/governance/freeze
 * Returns current freeze state for the tenant
 */
router.get(
  "/governance/freeze",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
        return;
      }

      // Query freeze state from governance table
      const result = await query<{
        tenant_id: string;
        frozen: boolean;
        frozen_at: string | null;
        frozen_by: string | null;
        freeze_reason: string | null;
        updated_at: string;
      }>(
        `SELECT tenant_id, frozen, frozen_at, frozen_by, freeze_reason, updated_at
         FROM tenant_governance
         WHERE tenant_id = $1`,
        [tenantId]
      );

      if (result.length === 0) {
        // No governance record exists yet - return default unfrozen state
        res.json({
          data: {
            frozen: false,
            frozen_at: null,
            frozen_by: null,
            freeze_reason: null,
            updated_at: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const state = result[0];
      if (!state) {
        res.status(500).json({
          error: "INTERNAL_ERROR",
          message: "Failed to retrieve governance state",
        });
        return;
      }

      res.json({
        data: {
          frozen: state.frozen,
          frozen_at: state.frozen_at,
          frozen_by: state.frozen_by,
          freeze_reason: state.freeze_reason,
          updated_at: state.updated_at,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to retrieve freeze state", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

/**
 * POST /api/v1/governance/freeze
 * Sets freeze state for the tenant
 * Bypasses freeze check to allow unfreezing
 */
router.post(
  "/governance/freeze",
  requirePermission(Permission.ADMIN_WRITE),
  bypassFreeze,
  validateRequest(setFreezeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(400).json({
          error: "TENANT_CONTEXT_REQUIRED",
          message: "Tenant context is required",
        });
        return;
      }

      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          error: "UNAUTHORIZED",
          message: "User ID not found",
        });
        return;
      }

      const { frozen, reason } = req.body;

      // Upsert governance state
      const result = await query<{
        tenant_id: string;
        frozen: boolean;
        frozen_at: string | null;
        frozen_by: string | null;
        freeze_reason: string | null;
        updated_at: string;
      }>(
        `INSERT INTO tenant_governance (tenant_id, frozen, frozen_at, frozen_by, freeze_reason, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (tenant_id)
         DO UPDATE SET
           frozen = $2,
           frozen_at = CASE WHEN $2 = true THEN NOW() ELSE NULL END,
           frozen_by = CASE WHEN $2 = true THEN $4 ELSE NULL END,
           freeze_reason = CASE WHEN $2 = true THEN $5 ELSE NULL END,
           updated_at = NOW()
         RETURNING tenant_id, frozen, frozen_at, frozen_by, freeze_reason, updated_at`,
        [
          tenantId,
          frozen,
          frozen ? new Date().toISOString() : null,
          frozen ? userId : null,
          frozen ? reason : null,
        ]
      );

      if (result.length === 0 || !result[0]) {
        res.status(500).json({
          error: "INTERNAL_ERROR",
          message: "Failed to update freeze state",
        });
        return;
      }

      const state = result[0];

      // Invalidate cache immediately after state change
      invalidateTenantFreezeCache(tenantId);

      // Log the governance action in audit trail
      await query(
        `INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          frozen ? "governance_freeze_enabled" : "governance_freeze_disabled",
          userId,
          tenantId,
          req.ip || null,
          req.headers["user-agent"] || null,
          req.path,
          JSON.stringify({ reason: reason || null }),
        ]
      );

      res.json({
        data: {
          frozen: state.frozen,
          frozen_at: state.frozen_at,
          frozen_by: state.frozen_by,
          freeze_reason: state.freeze_reason,
          updated_at: state.updated_at,
        },
        message: frozen ? "System frozen successfully" : "System unfrozen successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to update freeze state", 500, {
        userId: req.userId,
        tenantId: req.tenantId,
      });
    }
  }
);

/**
 * Helper function to check if tenant is frozen (exported for use in other routes)
 */
export async function isTenantFrozen(tenantId: string): Promise<boolean> {
  try {
    const result = await query<{ frozen: boolean }>(
      `SELECT frozen FROM tenant_governance WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.length > 0 && result[0] ? result[0].frozen : false;
  } catch {
    // Default to unfrozen on error to avoid breaking legitimate operations
    return false;
  }
}

export { router as governanceRouter };
