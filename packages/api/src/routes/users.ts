import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query, transaction } from "../db";
import { verifyPassword } from "../utils/hash";
import { logInfo } from "../utils/logger";
import { handleRouteError } from "../utils/error-handler";
import {
  authorizeTenantActionOr403,
  requireTenantContext,
  requireUserContext,
} from "./authz-helpers";

const router: Router = Router();

const deleteUserDataSchema = z.object({
  body: z.object({
    password: z.string().min(1),
  }),
});

const exportUserDataSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// GDPR: Delete user data
router.delete(
  "/:id/data",
  requirePermission(Permission.USERS_DELETE),
  validateRequest(deleteUserDataSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;
      const { password } = req.body;

      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.user.data.delete",
          "User data deletion is not authorized"
        ))
      ) {
        return;
      }

      if (!id || !userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Verify password
      const targetUsers = await query<{ password_hash: string }>(
        "SELECT password_hash FROM users WHERE id = $1 AND tenant_id = $2",
        [id, tenantId]
      );

      if (targetUsers.length === 0 || !targetUsers[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      const isValid = await verifyPassword(password, targetUsers[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Soft delete with 30-day grace period
      await transaction(async (client) => {
        // Mark for deletion
        await client.query(
          `UPDATE users
           SET deleted_at = NOW(),
               deletion_scheduled_at = NOW() + INTERVAL '30 days',
               email = $1,
               name = 'Deleted User'
           WHERE id = $2 AND tenant_id = $3`,
          [`deleted-${id}@settler.io`, id, tenantId]
        );

        // Schedule hard deletion
        await client.query(
          `INSERT INTO audit_logs (event, user_id, metadata)
           VALUES ($1, $2, $3)`,
          [
            "user_deletion_scheduled",
            id,
            JSON.stringify({ scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
          ]
        );
      });

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        ["user_data_deletion_requested", userId, JSON.stringify({ targetUserId: id })]
      );

      logInfo("User data deletion scheduled", { userId: id, requestedBy: userId });

      res.json({
        message: "Deletion scheduled. Data will be permanently deleted in 30 days.",
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to delete user data", 500, { userId: req.userId });
      return;
    }
  }
);

// GDPR: Export user data
router.get(
  "/:id/data-export",
  requirePermission(Permission.USERS_READ),
  validateRequest(exportUserDataSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = requireUserContext(req, res);
      const tenantId = requireTenantContext(req, res);
      if (!userId || !tenantId) return;

      // Users can only export their own data
      if (id !== userId) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "User export is only allowed for the authenticated user",
          reason: "cross_user_export_forbidden",
          traceId: req.traceId,
        });
      }

      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.user.data.export",
          "User data export is not authorized"
        ))
      ) {
        return;
      }

      // Fetch all user data — scoped by tenant_id
      const [users, jobs, reports, webhooks, apiKeys, auditLogs] = await Promise.all([
        query(
          `SELECT id, email, name, role, data_residency_region, created_at, updated_at
           FROM users WHERE id = $1 AND tenant_id = $2`,
          [userId, tenantId]
        ),
        query(
          `SELECT id, name, source_adapter, target_adapter, rules, schedule, status, created_at, updated_at
           FROM jobs WHERE user_id = $1 AND tenant_id = $2`,
          [userId, tenantId]
        ),
        query(
          `SELECT r.id, r.job_id, r.summary, r.generated_at
           FROM reports r
           JOIN jobs j ON r.job_id = j.id
           WHERE j.user_id = $1 AND j.tenant_id = $2`,
          [userId, tenantId]
        ),
        query(
          `SELECT id, url, events, status, created_at, updated_at
           FROM webhooks WHERE user_id = $1 AND tenant_id = $2`,
          [userId, tenantId]
        ),
        query(
          `SELECT id, name, scopes, rate_limit, created_at, last_used_at
           FROM api_keys WHERE user_id = $1 AND tenant_id = $2`,
          [userId, tenantId]
        ),
        query(
          `SELECT event, metadata, timestamp
           FROM audit_logs
           WHERE user_id = $1 AND tenant_id = $2
           ORDER BY timestamp DESC
           LIMIT 1000`,
          [userId, tenantId]
        ),
      ]);

      const exportData = {
        user: users[0],
        jobs: jobs,
        reports: reports,
        webhooks: webhooks,
        apiKeys: apiKeys.map((k) => ({
          id: k.id,
          name: k.name,
          scopes: k.scopes,
          rateLimit: k.rate_limit,
          createdAt: k.created_at,
          lastUsedAt: k.last_used_at,
        })),
        auditLogs: auditLogs,
        exportedAt: new Date().toISOString(),
      };

      // Log export
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        ["user_data_exported", userId, JSON.stringify({ exportedAt: new Date() })]
      );

      logInfo("User data exported", { userId });

      res.json({ data: exportData });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to export user data", 500, { userId: req.userId });
      return;
    }
  }
);

export { router as usersRouter };
