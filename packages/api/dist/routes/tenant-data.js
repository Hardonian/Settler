"use strict";
/**
 * Tenant Data Management Routes
 * Enterprise-ready data export and deletion endpoints
 *
 * Provides GDPR/CCPA compliant data export and deletion for entire tenant accounts.
 * All operations are tenant-scoped and logged in audit trail.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantDataRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const User_1 = require("../domain/entities/User");
const router = (0, express_1.Router)();
exports.tenantDataRouter = router;
const exportTenantDataSchema = zod_1.z.object({
    query: zod_1.z.object({
        format: zod_1.z.enum(["json", "csv"]).optional().default("json"),
    }),
});
const deleteTenantDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        confirmation: zod_1.z.string().regex(/^DELETE$/),
        password: zod_1.z.string().min(1),
    }),
});
/**
 * GET /tenant/data-export
 * Export all tenant data (full account export)
 *
 * Requires: TENANT_READ permission
 * Returns: Complete tenant data including users, jobs, webhooks, audit logs, etc.
 */
router.get("/data-export", (0, authorization_1.requirePermission)(Permissions_1.Permission.TENANT_READ), (0, validation_1.validateRequest)(exportTenantDataSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const format = req.query.format || "json";
        // Verify user has permission to export tenant data
        const userCheck = await (0, db_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [userId, tenantId]);
        if (userCheck.length === 0 || !userCheck[0]) {
            return res.status(403).json({ error: 'Forbidden', message: 'User not found in tenant' });
        }
        const userRole = userCheck[0].role;
        if (userRole !== User_1.UserRole.OWNER && userRole !== User_1.UserRole.ADMIN) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tenant owners and admins can export tenant data'
            });
        }
        (0, logger_1.logInfo)('Starting tenant data export', { tenantId, userId });
        // Export all tenant data
        const [tenant, users, reconJobs, reconResults, webhooks, apiKeys, auditLogs, ingestionSources, exports, billingAccount, subscriptions,] = await Promise.all([
            // Tenant info
            (0, db_1.query)(`SELECT id, slug, name, primary_domain, custom_domain, is_active, created_at, updated_at, metadata
           FROM tenants WHERE id = $1`, [tenantId]),
            // Users
            (0, db_1.query)(`SELECT id, email, name, role, data_residency_region, created_at, updated_at, deleted_at
           FROM users WHERE tenant_id = $1`, [tenantId]),
            // Recon jobs
            (0, db_1.query)(`SELECT id, name, description, source_adapter, target_adapter, status, schedule_cron, 
                  created_at, updated_at, deleted_at, metadata
           FROM recon_jobs WHERE tenant_id = $1`, [tenantId]),
            // Recon results
            (0, db_1.query)(`SELECT id, recon_job_id, status, started_at, completed_at, source_count, target_count,
                  matched_count, unmatched_source_count, unmatched_target_count, created_at
           FROM recon_results WHERE tenant_id = $1
           ORDER BY started_at DESC LIMIT 1000`, [tenantId]),
            // Webhooks
            (0, db_1.query)(`SELECT id, url, events, status, created_at, updated_at, deleted_at
           FROM webhooks WHERE tenant_id = $1`, [tenantId]),
            // API keys (for all users in tenant)
            (0, db_1.query)(`SELECT ak.id, ak.user_id, ak.name, ak.scopes, ak.rate_limit, ak.created_at, ak.last_used_at
           FROM api_keys ak
           JOIN users u ON ak.user_id = u.id
           WHERE u.tenant_id = $1`, [tenantId]),
            // Audit logs (last 10000)
            (0, db_1.query)(`SELECT event, user_id, resource_type, resource_id, changes, ip_address, user_agent, 
                  timestamp, metadata
           FROM audit_logs
           WHERE tenant_id = $1
           ORDER BY timestamp DESC
           LIMIT 10000`, [tenantId]),
            // Ingestion sources
            (0, db_1.query)(`SELECT id, name, type, connector_type, status, last_sync_at, created_at, updated_at
           FROM ingestion_sources WHERE tenant_id = $1`, [tenantId]),
            // Exports
            (0, db_1.query)(`SELECT id, type, format, status, storage_location, created_at, updated_at
           FROM exports WHERE tenant_id = $1
           ORDER BY created_at DESC LIMIT 100`, [tenantId]),
            // Billing account
            (0, db_1.query)(`SELECT id, email, name, currency, status, created_at, updated_at
           FROM billing_accounts WHERE tenant_id = $1`, [tenantId]),
            // Subscriptions
            (0, db_1.query)(`SELECT s.id, s.plan_id, s.plan_name, s.status, s.current_period_start, s.current_period_end
           FROM subscriptions s
           JOIN billing_accounts ba ON s.billing_account_id = ba.id
           WHERE ba.tenant_id = $1`, [tenantId]),
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
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            'tenant_data_exported',
            userId,
            tenantId,
            'tenant',
            JSON.stringify({ format, exportedAt: new Date() }),
            req.ip || null,
            req.headers['user-agent'] || null,
        ]);
        (0, logger_1.logInfo)('Tenant data exported successfully', { tenantId, userId, format });
        if (format === "csv") {
            // Simple CSV export (can be enhanced)
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="tenant-export-${tenantId}.csv"`);
            res.send(JSON.stringify(exportData));
            return;
        }
        res.json({ data: exportData });
        return;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to export tenant data', error, { tenantId: req.tenantId, userId: req.userId });
        (0, error_handler_1.handleRouteError)(res, error, "Failed to export tenant data", 500, {
            tenantId: req.tenantId,
            userId: req.userId
        });
        return;
    }
});
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
router.delete("/data", (0, authorization_1.requirePermission)(Permissions_1.Permission.TENANT_DELETE), (0, validation_1.validateRequest)(deleteTenantDataSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { confirmation, password } = req.body;
        if (confirmation !== "DELETE") {
            return res.status(400).json({
                error: 'Invalid confirmation',
                message: 'Must include confirmation: "DELETE"'
            });
        }
        // Verify user is tenant owner
        const userCheck = await (0, db_1.query)(`SELECT role, password_hash FROM users WHERE id = $1 AND tenant_id = $2`, [userId, tenantId]);
        if (userCheck.length === 0 || !userCheck[0]) {
            return res.status(403).json({ error: 'Forbidden', message: 'User not found in tenant' });
        }
        const userRecord = userCheck[0];
        if (userRecord.role !== User_1.UserRole.OWNER) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tenant owners can delete tenant data'
            });
        }
        // Verify password
        const { verifyPassword } = await Promise.resolve().then(() => __importStar(require("../utils/hash")));
        const isValid = await verifyPassword(password, userRecord.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        (0, logger_1.logInfo)('Starting tenant data deletion', { tenantId, userId, deletionDate });
        // Soft delete tenant and all related data
        await (0, db_1.transaction)(async (client) => {
            // Mark tenant as deleted
            await client.query(`UPDATE tenants 
           SET is_active = false, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{deleted_at}', to_jsonb(NOW()::text))
           WHERE id = $1`, [tenantId]);
            // Soft delete all users
            await client.query(`UPDATE users 
           SET deleted_at = NOW(), 
               email = 'deleted-' || id || '@settler.io',
               name = 'Deleted User'
           WHERE tenant_id = $1`, [tenantId]);
            // Soft delete recon jobs
            await client.query(`UPDATE recon_jobs SET deleted_at = NOW() WHERE tenant_id = $1`, [tenantId]);
            // Soft delete webhooks
            await client.query(`UPDATE webhooks SET deleted_at = NOW() WHERE tenant_id = $1`, [tenantId]);
            // Soft delete ingestion sources
            await client.query(`UPDATE ingestion_sources SET deleted_at = NOW() WHERE tenant_id = $1`, [tenantId]);
            // Schedule hard deletion
            await client.query(`INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata)
           VALUES ($1, $2, $3, $4, $5)`, [
                'tenant_deletion_scheduled',
                userId,
                tenantId,
                'tenant',
                JSON.stringify({
                    scheduledAt: deletionDate.toISOString(),
                    hardDeleteScheduled: true,
                }),
            ]);
        });
        // Log deletion request
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, resource_type, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            'tenant_data_deletion_requested',
            userId,
            tenantId,
            'tenant',
            JSON.stringify({ requestedAt: new Date(), deletionDate: deletionDate.toISOString() }),
            req.ip || null,
            req.headers['user-agent'] || null,
        ]);
        (0, logger_1.logInfo)('Tenant data deletion scheduled', { tenantId, userId, deletionDate });
        res.json({
            message: 'Tenant deletion scheduled. All data will be permanently deleted in 30 days.',
            deletionDate: deletionDate.toISOString(),
            tenantId: tenantId,
        });
        return;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to delete tenant data', error, { tenantId: req.tenantId, userId: req.userId });
        (0, error_handler_1.handleRouteError)(res, error, "Failed to delete tenant data", 500, {
            tenantId: req.tenantId,
            userId: req.userId
        });
        return;
    }
});
//# sourceMappingURL=tenant-data.js.map