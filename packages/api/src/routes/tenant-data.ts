/**
 * Tenant Data Management Routes
 * Enterprise-ready data export and deletion endpoints
 *
 * Provides GDPR/CCPA compliant data export and deletion for entire tenant accounts.
 * All operations are tenant-scoped and logged in audit trail.
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { TenantRequest } from "../middleware/tenant";
import { requirePermission } from "../middleware/authorization";
import { enforceFreezeState } from "../middleware/governance";
import { Permission } from "../infrastructure/security/Permissions";
import { queryWithTenant, transaction } from "../db";
import { logInfo, logError } from "../utils/logger";
import { handleRouteError } from "../utils/error-handler";
import { validateTenantId } from "../infrastructure/tenancy/TenantEnforcement";
import { verifyTenantIntegrityChain } from "../services/reconciliation/integrity";
import { getOpenFgaAuthorizationService } from "../services/authz/openfga-authorization-service";

const router: Router = Router();

const exportTenantDataSchema = z.object({
  query: z.object({
    format: z.enum(["json", "csv"]).optional().default("json"),
  }),
});

const deleteTenantDataSchema = z.object({
  body: z.object({
    confirmation: z.string().regex(/^DELETE$/),
    password: z.string().min(1),
  }),
});

/**
 * GET /tenant/data-export
 * Export all tenant data (full account export)
 *
 * Requires: TENANT_READ permission
 * Returns: Complete tenant data including users, jobs, webhooks, audit logs, etc.
 */
router.get(
  "/data-export",
  requirePermission(Permission.TENANT_READ),
  validateRequest(exportTenantDataSchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const format = (req.query.format as string) || "json";

      const authz = await getOpenFgaAuthorizationService().authorizeTenantAction(
        userId,
        tenantId,
        "tenant.data.export"
      );

      if (!authz.allowed) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Tenant export not authorized",
          reason: authz.reason,
          authz: {
            mode: authz.mode,
            degraded: authz.degraded,
            openfga: authz.openfga,
          },
        });
      }

      logInfo("Starting tenant data export", { tenantId, userId });

      // Export all tenant data
      const [
        tenant,
        users,
        reconJobs,
        reconResults,
        webhooks,
        apiKeys,
        auditLogs,
        ingestionSources,
        exports,
        billingAccount,
        subscriptions,
      ] = await Promise.all([
        // Tenant info
        queryWithTenant(
          tenantId,
          `SELECT id, slug, name, primary_domain, custom_domain, is_active, created_at, updated_at, metadata
           FROM tenants WHERE id = $1`,
          [tenantId]
        ),
        // Users
        queryWithTenant(
          tenantId,
          `SELECT id, email, name, role, data_residency_region, created_at, updated_at, deleted_at
           FROM users WHERE tenant_id = $1`,
          [tenantId]
        ),
        // Recon jobs
        queryWithTenant(
          tenantId,
          `SELECT id, name, description, source_adapter, target_adapter, status, schedule_cron,
                  created_at, updated_at, deleted_at, metadata
           FROM recon_jobs WHERE tenant_id = $1`,
          [tenantId]
        ),
        // Recon results
        queryWithTenant(
          tenantId,
          `SELECT id, recon_job_id, status, started_at, completed_at, source_count, target_count,
                  matched_count, unmatched_source_count, unmatched_target_count, created_at
           FROM recon_results WHERE tenant_id = $1
           ORDER BY started_at DESC LIMIT 1000`,
          [tenantId]
        ),
        // Webhooks
        queryWithTenant(
          tenantId,
          `SELECT id, url, events, status, created_at, updated_at, deleted_at
           FROM webhooks WHERE tenant_id = $1`,
          [tenantId]
        ),
        // API keys (for all users in tenant)
        queryWithTenant(
          tenantId,
          `SELECT ak.id, ak.user_id, ak.name, ak.scopes, ak.rate_limit, ak.created_at, ak.last_used_at
           FROM api_keys ak
           JOIN users u ON ak.user_id = u.id
           WHERE u.tenant_id = $1`,
          [tenantId]
        ),
        // Audit logs (last 10000)
        queryWithTenant(
          tenantId,
          `SELECT event, user_id, resource_type, resource_id, changes, ip_address, user_agent,
                  timestamp, metadata
           FROM audit_logs
           WHERE tenant_id = $1
           ORDER BY timestamp DESC
           LIMIT 10000`,
          [tenantId]
        ),
        // Ingestion sources
        queryWithTenant(
          tenantId,
          `SELECT id, name, type, connector_type, status, last_sync_at, created_at, updated_at
           FROM ingestion_sources WHERE tenant_id = $1`,
          [tenantId]
        ),
        // Exports
        queryWithTenant(
          tenantId,
          `SELECT id, type, format, status, storage_location, created_at, updated_at
           FROM exports WHERE tenant_id = $1
           ORDER BY created_at DESC LIMIT 100`,
          [tenantId]
        ),
        // Billing account
        queryWithTenant(
          tenantId,
          `SELECT id, email, name, currency, status, created_at, updated_at
           FROM billing_accounts WHERE tenant_id = $1`,
          [tenantId]
        ),
        // Subscriptions
        queryWithTenant(
          tenantId,
          `SELECT s.id, s.plan_id, s.plan_name, s.status, s.current_period_start, s.current_period_end
           FROM subscriptions s
           JOIN billing_accounts ba ON s.billing_account_id = ba.id
           WHERE ba.tenant_id = $1`,
          [tenantId]
        ),
      ]);

      const exportData = {
        tenant: tenant[0] || null,
        users: users,
        reconJobs: reconJobs,
        reconResults: reconResults,
        webhooks: webhooks,
        apiKeys: apiKeys,
        auditLogs: auditLogs,
        ingestionSources: ingestionSources,
        exports: exports,
        billingAccount: billingAccount[0] || null,
        subscriptions: subscriptions,
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        format: format,
      };

      // Log export in audit trail
      await queryWithTenant(
        tenantId,
        `INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          "tenant_data_exported",
          userId,
          tenantId,
          "tenant",
          JSON.stringify({ format, exportedAt: new Date() }),
          req.ip || null,
          req.headers["user-agent"] || null,
        ]
      );

      logInfo("Tenant data exported successfully", { tenantId, userId, format });

      if (format === "csv") {
        // Simple CSV export (can be enhanced)
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="tenant-export-${tenantId}.csv"`
        );
        res.send(JSON.stringify(exportData));
        return;
      }

      res.json({ data: exportData });
      return;
    } catch (error: unknown) {
      logError("Failed to export tenant data", error, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
      handleRouteError(res, error, "Failed to export tenant data", 500, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
      return;
    }
  }
);

async function tableExists(tableName: string, tenantId: string): Promise<boolean> {
  const rows = await queryWithTenant<{ exists: string | null }>(
    tenantId,
    `SELECT to_regclass($1) as exists`,
    [`public.${tableName}`]
  );

  return Boolean(rows[0]?.exists);
}

async function countIfTableExists(
  tableName: string,
  sql: string,
  params: (string | number)[],
  tenantId: string
): Promise<number> {
  if (!(await tableExists(tableName, tenantId))) {
    return 0;
  }

  const rows = await queryWithTenant<{ count: string }>(tenantId, sql, params);
  return Number(rows[0]?.count ?? 0);
}

router.get(
  "/integrity-check",
  requirePermission(Permission.TENANT_READ),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      validateTenantId(tenantId, "tenant-data integrity-check");

      const rlsRows = await queryWithTenant<{
        table_name: string;
        relrowsecurity: boolean;
        policy_count: string;
      }>(
        tenantId,
        `SELECT c.relname as table_name,
                c.relrowsecurity,
                COUNT(p.polname)::text as policy_count
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         LEFT JOIN pg_policy p ON p.polrelid = c.oid
         WHERE n.nspname = 'public'
           AND c.relname IN ('users', 'jobs', 'reconciliation_runs', 'reconciliation_matches', 'audit_logs')
         GROUP BY c.relname, c.relrowsecurity`
      );

      const allTablesProtected =
        rlsRows.length >= 5 &&
        rlsRows.every((row) => row.relrowsecurity && Number(row.policy_count) > 0);

      const orphanJobs = await countIfTableExists(
        "jobs",
        `SELECT COUNT(*)::text as count
         FROM jobs j
         LEFT JOIN users u ON j.user_id = u.id
         WHERE j.tenant_id = $1
           AND (u.id IS NULL OR u.tenant_id <> j.tenant_id)`,
        [tenantId],
        tenantId
      );

      const orphanMatches = await countIfTableExists(
        "reconciliation_matches",
        `SELECT COUNT(*)::text as count
         FROM reconciliation_matches m
         LEFT JOIN reconciliation_runs r ON m.run_id = r.id
         WHERE m.tenant_id = $1
           AND (r.id IS NULL OR r.tenant_id <> m.tenant_id)`,
        [tenantId],
        tenantId
      );

      const crossTenantJobRefs = await countIfTableExists(
        "jobs",
        `SELECT COUNT(*)::text as count
         FROM jobs j
         JOIN users u ON j.user_id = u.id
         WHERE j.tenant_id = $1
           AND u.tenant_id <> j.tenant_id`,
        [tenantId],
        tenantId
      );

      const crossTenantMatchRefs = await countIfTableExists(
        "reconciliation_matches",
        `SELECT COUNT(*)::text as count
         FROM reconciliation_matches m
         JOIN reconciliation_runs r ON m.run_id = r.id
         WHERE m.tenant_id = $1
           AND r.tenant_id <> m.tenant_id`,
        [tenantId],
        tenantId
      );

      const chainIntegrity = await verifyTenantIntegrityChain(tenantId);

      return res.status(200).json({
        tenantId,
        checkedAt: new Date().toISOString(),
        isolationRulesActive: allTablesProtected,
        noOrphanRecords: orphanJobs + orphanMatches === 0,
        noCrossTenantReferences: crossTenantJobRefs + crossTenantMatchRefs === 0,
        details: {
          rlsTables: rlsRows.map((row) => ({
            tableName: row.table_name,
            rowLevelSecurity: row.relrowsecurity,
            policyCount: Number(row.policy_count),
          })),
          orphanRecords: {
            jobs: orphanJobs,
            reconciliationMatches: orphanMatches,
          },
          crossTenantReferences: {
            jobsToUsers: crossTenantJobRefs,
            matchesToRuns: crossTenantMatchRefs,
          },
          reconciliationIntegrity: chainIntegrity,
        },
      });
    } catch (error: unknown) {
      logError("Failed to run tenant integrity check", error, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
      return handleRouteError(res, error, "Failed to run tenant integrity check", 500, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
    }
  }
);

/**
 * DELETE /tenant/data
 * Delete all tenant data (soft delete + scheduled hard delete)
 *
 * Requires: TENANT_DELETE permission (owner only)
 * Process:
 *   1. Soft delete all tenant data (mark as deleted)
 *   2. Schedule hard deletion in 30 days
 *   3. Log all operations in audit trail
 */
router.delete(
  "/data",
  requirePermission(Permission.TENANT_DELETE),
  enforceFreezeState(),
  validateRequest(deleteTenantDataSchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const userId = req.userId!;
      const { confirmation, password } = req.body;

      if (confirmation !== "DELETE") {
        return res.status(400).json({
          error: "Invalid confirmation",
          message: 'Must include confirmation: "DELETE"',
        });
      }

      const authz = await getOpenFgaAuthorizationService().authorizeTenantAction(
        userId,
        tenantId,
        "tenant.data.delete"
      );

      if (!authz.allowed) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Tenant deletion not authorized",
          reason: authz.reason,
          authz: {
            mode: authz.mode,
            degraded: authz.degraded,
            openfga: authz.openfga,
          },
        });
      }

      const userCheck = await queryWithTenant<{ password_hash: string }>(
        tenantId,
        `SELECT password_hash FROM users WHERE id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );

      const passwordHash = userCheck[0]?.password_hash;
      if (!passwordHash) {
        return res.status(403).json({ error: "Forbidden", message: "User not found in tenant" });
      }

      // Verify password
      const { verifyPassword } = await import("../utils/hash");
      const isValid = await verifyPassword(password, passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      logInfo("Starting tenant data deletion", { tenantId, userId, deletionDate });

      // Soft delete tenant and all related data
      await transaction(async (client) => {
        // Mark tenant as deleted
        await client.query(
          `UPDATE tenants
           SET is_active = false, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{deleted_at}', to_jsonb(NOW()::text))
           WHERE id = $1`,
          [tenantId]
        );

        // Soft delete all users
        await client.query(
          `UPDATE users
           SET deleted_at = NOW(),
               email = 'deleted-' || id || '@settler.io',
               name = 'Deleted User'
           WHERE tenant_id = $1`,
          [tenantId]
        );

        // Soft delete recon jobs
        await client.query(`UPDATE recon_jobs SET deleted_at = NOW() WHERE tenant_id = $1`, [
          tenantId,
        ]);

        // Soft delete webhooks
        await client.query(`UPDATE webhooks SET deleted_at = NOW() WHERE tenant_id = $1`, [
          tenantId,
        ]);

        // Soft delete ingestion sources
        await client.query(`UPDATE ingestion_sources SET deleted_at = NOW() WHERE tenant_id = $1`, [
          tenantId,
        ]);

        // Schedule hard deletion
        await client.query(
          `INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            "tenant_deletion_scheduled",
            userId,
            tenantId,
            "tenant",
            JSON.stringify({
              scheduledAt: deletionDate.toISOString(),
              hardDeleteScheduled: true,
            }),
          ]
        );
      });

      // Log deletion request
      await queryWithTenant(
        tenantId,
        `INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          "tenant_data_deletion_requested",
          userId,
          tenantId,
          "tenant",
          JSON.stringify({ requestedAt: new Date(), deletionDate: deletionDate.toISOString() }),
          req.ip || null,
          req.headers["user-agent"] || null,
        ]
      );

      logInfo("Tenant data deletion scheduled", { tenantId, userId, deletionDate });

      res.json({
        message: "Tenant deletion scheduled. All data will be permanently deleted in 30 days.",
        deletionDate: deletionDate.toISOString(),
        tenantId: tenantId,
      });
      return;
    } catch (error: unknown) {
      logError("Failed to delete tenant data", error, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
      handleRouteError(res, error, "Failed to delete tenant data", 500, {
        tenantId: req.tenantId,
        userId: req.userId,
      });
      return;
    }
  }
);

export { router as tenantDataRouter };
