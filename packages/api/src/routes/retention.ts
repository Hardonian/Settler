/**
 * Retention Routes
 *
 * API endpoints for retention automation dashboard and configuration.
 * Provides metrics display, policy management, and worker control.
 */

import { Router, Response } from "express";
import { z } from "zod";
import {
  retentionPolicyService,
  retentionPeriodToDays,
} from "../services/retention/retention-policy";
import { retentionMetricsService } from "../services/retention/retention-metrics";
import { getTTLWorker } from "../services/retention/ttl-worker";
import { logInfo, logError } from "../utils/logger";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { enforceFreezeState } from "../middleware/governance";

const router: Router = Router();

// Authentication is applied by the versioned protected router (`configureProtectedRouter`).
// Authorization: all retention routes are admin-only — they expose cross-tenant data
// and control the TTL worker that deletes data irreversibly.

// Validation schemas
const retentionPolicySchema = z.object({
  csv: z
    .object({
      value: z.number().positive(),
      unit: z.enum(["days", "weeks", "months", "forever"]),
    })
    .optional(),
  json: z
    .object({
      value: z.number().positive(),
      unit: z.enum(["days", "weeks", "months", "forever"]),
    })
    .optional(),
  excel: z
    .object({
      value: z.number().positive(),
      unit: z.enum(["days", "weeks", "months", "forever"]),
    })
    .optional(),
  pdf: z
    .object({
      value: z.number().positive(),
      unit: z.enum(["days", "weeks", "months", "forever"]),
    })
    .optional(),
});

const workerConfigSchema = z.object({
  pollIntervalMs: z.number().positive().optional(),
  batchSize: z.number().positive().optional(),
  maxConcurrentDeletes: z.number().positive().optional(),
  dryRun: z.boolean().optional(),
});

/**
 * GET /retention/metrics
 *
 * Get overall retention metrics summary
 */
router.get(
  "/metrics",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const metrics = await retentionMetricsService.getMetricsSummary();

      res.json({
        success: true,
        data: {
          prunedArtifactCount: metrics.prunedArtifactCount,
          storageReclaimed: formatBytes(metrics.storageReclaimedBytes),
          storageReclaimedBytes: metrics.storageReclaimedBytes,
          retentionPolicyViolations: metrics.retentionPolicyViolations,
          workerProcessingLatencyMs: metrics.workerProcessingLatencyMs,
          lastUpdated: metrics.lastUpdated,
        },
      });
    } catch (error: unknown) {
      logError("Failed to get retention metrics", error);
      res.status(500).json({
        success: false,
        error: "Failed to get retention metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/metrics/daily
 *
 * Get daily retention metrics
 */
router.get(
  "/metrics/daily",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const metrics = await retentionMetricsService.getDailyMetrics(days);

      res.json({
        success: true,
        data: metrics.map((m) => ({
          date: m.date,
          prunedArtifactCount: m.prunedArtifactCount,
          storageReclaimed: formatBytes(m.storageReclaimedBytes),
          storageReclaimedBytes: m.storageReclaimedBytes,
          violationsCount: m.violationsCount,
          avgLatencyMs: m.avgLatencyMs,
        })),
      });
    } catch (error: unknown) {
      logError("Failed to get daily retention metrics", error);
      res.status(500).json({
        success: false,
        error: "Failed to get daily retention metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/metrics/tenants
 *
 * Get retention metrics by tenant
 */
router.get(
  "/metrics/tenants",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const metrics = await retentionMetricsService.getAllTenantMetrics();

      res.json({
        success: true,
        data: metrics.map((m) => ({
          tenantId: m.tenantId,
          tenantName: m.tenantName,
          prunedArtifactCount: m.prunedArtifactCount,
          storageReclaimed: formatBytes(m.storageReclaimedBytes),
          storageReclaimedBytes: m.storageReclaimedBytes,
          retentionPolicyViolations: m.retentionPolicyViolations,
          workerProcessingLatencyMs: m.workerProcessingLatencyMs,
        })),
      });
    } catch (error: unknown) {
      logError("Failed to get tenant retention metrics", error);
      res.status(500).json({
        success: false,
        error: "Failed to get tenant retention metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/metrics/tenants/:tenantId
 *
 * Get retention metrics for specific tenant
 */
router.get(
  "/metrics/tenants/:tenantId",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantIdParam = req.params["tenantId"];
      const tenantId = Array.isArray(tenantIdParam)
        ? (tenantIdParam[0] ?? "")
        : (tenantIdParam ?? "");
      const metrics = await retentionMetricsService.getMetricsByTenant(tenantId);

      res.json({
        success: true,
        data: {
          tenantId: metrics.tenantId,
          tenantName: metrics.tenantName,
          prunedArtifactCount: metrics.prunedArtifactCount,
          storageReclaimed: formatBytes(metrics.storageReclaimedBytes),
          storageReclaimedBytes: metrics.storageReclaimedBytes,
          retentionPolicyViolations: metrics.retentionPolicyViolations,
          workerProcessingLatencyMs: metrics.workerProcessingLatencyMs,
          lastUpdated: metrics.lastUpdated,
        },
      });
    } catch (error: unknown) {
      logError("Failed to get tenant retention metrics", error);
      res.status(500).json({
        success: false,
        error: "Failed to get tenant retention metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/policies
 *
 * Get all tenant retention policies
 */
router.get(
  "/policies",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const policies = await retentionPolicyService.getAllTenantRetentionPolicies();

      res.json({
        success: true,
        data: policies.map((p) => ({
          tenantId: p.tenantId,
          artifactRetention: {
            csv: {
              ...p.artifactRetention.csv,
              days: retentionPeriodToDays(p.artifactRetention.csv),
            },
            json: {
              ...p.artifactRetention.json,
              days: retentionPeriodToDays(p.artifactRetention.json),
            },
            excel: {
              ...p.artifactRetention.excel,
              days: retentionPeriodToDays(p.artifactRetention.excel),
            },
            pdf: {
              ...p.artifactRetention.pdf,
              days: retentionPeriodToDays(p.artifactRetention.pdf),
            },
          },
          isCustomPolicy: p.isCustomPolicy,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      });
    } catch (error: unknown) {
      logError("Failed to get retention policies", error);
      res.status(500).json({
        success: false,
        error: "Failed to get retention policies",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/policies/:tenantId
 *
 * Get retention policy for a specific tenant
 */
router.get(
  "/policies/:tenantId",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantIdParam2 = req.params["tenantId"];
      const tenantId = Array.isArray(tenantIdParam2)
        ? (tenantIdParam2[0] ?? "")
        : (tenantIdParam2 ?? "");
      const policy = await retentionPolicyService.getTenantRetentionPolicy(tenantId);

      res.json({
        success: true,
        data: {
          tenantId: policy.tenantId,
          artifactRetention: {
            csv: {
              ...policy.artifactRetention.csv,
              days: retentionPeriodToDays(policy.artifactRetention.csv),
            },
            json: {
              ...policy.artifactRetention.json,
              days: retentionPeriodToDays(policy.artifactRetention.json),
            },
            excel: {
              ...policy.artifactRetention.excel,
              days: retentionPeriodToDays(policy.artifactRetention.excel),
            },
            pdf: {
              ...policy.artifactRetention.pdf,
              days: retentionPeriodToDays(policy.artifactRetention.pdf),
            },
          },
          isCustomPolicy: policy.isCustomPolicy,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        },
      });
    } catch (error: unknown) {
      logError("Failed to get retention policy", error);
      res.status(500).json({
        success: false,
        error: "Failed to get retention policy",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PUT /retention/policies/:tenantId
 *
 * Set custom retention policy for a tenant
 */
router.put(
  "/policies/:tenantId",
  requirePermission(Permission.ADMIN_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantIdParam3 = req.params["tenantId"];
      const tenantId = Array.isArray(tenantIdParam3)
        ? (tenantIdParam3[0] ?? "")
        : (tenantIdParam3 ?? "");
      const body = retentionPolicySchema.parse(req.body);

      const policy = await retentionPolicyService.setTenantRetentionPolicy(tenantId, body);

      logInfo("Set retention policy", { tenantId, policy: body });

      res.json({
        success: true,
        data: {
          tenantId: policy.tenantId,
          artifactRetention: {
            csv: {
              ...policy.artifactRetention.csv,
              days: retentionPeriodToDays(policy.artifactRetention.csv),
            },
            json: {
              ...policy.artifactRetention.json,
              days: retentionPeriodToDays(policy.artifactRetention.json),
            },
            excel: {
              ...policy.artifactRetention.excel,
              days: retentionPeriodToDays(policy.artifactRetention.excel),
            },
            pdf: {
              ...policy.artifactRetention.pdf,
              days: retentionPeriodToDays(policy.artifactRetention.pdf),
            },
          },
          isCustomPolicy: policy.isCustomPolicy,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        },
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: error.issues,
        });
        return;
      }

      logError("Failed to set retention policy", error);
      res.status(500).json({
        success: false,
        error: "Failed to set retention policy",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * DELETE /retention/policies/:tenantId
 *
 * Reset tenant retention policy to default
 */
router.delete(
  "/policies/:tenantId",
  requirePermission(Permission.ADMIN_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantIdParam4 = req.params["tenantId"];
      const tenantId = Array.isArray(tenantIdParam4)
        ? (tenantIdParam4[0] ?? "")
        : (tenantIdParam4 ?? "");
      const policy = await retentionPolicyService.resetTenantRetentionPolicy(tenantId);

      logInfo("Reset retention policy to default", { tenantId });

      res.json({
        success: true,
        data: {
          tenantId: policy.tenantId,
          artifactRetention: {
            csv: {
              ...policy.artifactRetention.csv,
              days: retentionPeriodToDays(policy.artifactRetention.csv),
            },
            json: {
              ...policy.artifactRetention.json,
              days: retentionPeriodToDays(policy.artifactRetention.json),
            },
            excel: {
              ...policy.artifactRetention.excel,
              days: retentionPeriodToDays(policy.artifactRetention.excel),
            },
            pdf: {
              ...policy.artifactRetention.pdf,
              days: retentionPeriodToDays(policy.artifactRetention.pdf),
            },
          },
          isCustomPolicy: policy.isCustomPolicy,
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt,
        },
      });
    } catch (error: unknown) {
      logError("Failed to reset retention policy", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset retention policy",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /retention/worker
 *
 * Get TTL worker status and stats
 */
router.get(
  "/worker",
  requirePermission(Permission.ADMIN_READ),
  async (_req: AuthRequest, res: Response) => {
    try {
      const worker = getTTLWorker();
      const stats = worker.getStats();

      res.json({
        success: true,
        data: {
          workerId: stats.workerId,
          isRunning: stats.isRunning,
          startedAt: stats.startedAt,
          runsCompleted: stats.runsCompleted,
          artifactsScanned: stats.artifactsScanned,
          artifactsPruned: stats.artifactsPruned,
          storageReclaimed: formatBytes(stats.storageReclaimedBytes),
          storageReclaimedBytes: stats.storageReclaimedBytes,
          violations: stats.violations,
          errors: stats.errors,
          lastRunAt: stats.lastRunAt,
        },
      });
    } catch (error: unknown) {
      logError("Failed to get worker stats", error);
      res.status(500).json({
        success: false,
        error: "Failed to get worker stats",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /retention/worker/run
 *
 * Manually trigger a TTL worker run
 */
router.post(
  "/worker/run",
  requirePermission(Permission.ADMIN_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const dryRun = req.query.dryRun === "true";
      const worker = getTTLWorker();

      if (dryRun) {
        worker.setDryRun(true);
      }

      await worker.triggerRun();

      const stats = worker.getStats();

      logInfo("Manually triggered TTL worker run", { dryRun });

      res.json({
        success: true,
        data: {
          message: dryRun ? "Dry run completed" : "TTL worker run completed",
          artifactsPruned: stats.artifactsPruned,
          storageReclaimed: formatBytes(stats.storageReclaimedBytes),
          violations: stats.violations,
          errors: stats.errors,
          lastRunAt: stats.lastRunAt,
        },
      });
    } catch (error: unknown) {
      logError("Failed to trigger worker run", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger worker run",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * PUT /retention/worker/config
 *
 * Update TTL worker configuration
 */
router.put(
  "/worker/config",
  requirePermission(Permission.ADMIN_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const config = workerConfigSchema.parse(req.body);
      const worker = getTTLWorker();

      worker.updateConfig(config);

      logInfo("Updated TTL worker config", config);

      res.json({
        success: true,
        data: {
          message: "Worker configuration updated",
          config: worker.getStats(),
        },
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: error.issues,
        });
        return;
      }

      logError("Failed to update worker config", error);
      res.status(500).json({
        success: false,
        error: "Failed to update worker config",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /retention/worker/dry-run
 *
 * Toggle dry-run mode
 */
router.post(
  "/worker/dry-run",
  requirePermission(Permission.ADMIN_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { enabled } = req.body;
      const worker = getTTLWorker();

      worker.setDryRun(enabled);

      res.json({
        success: true,
        data: {
          dryRun: enabled,
          message: enabled ? "Dry-run mode enabled" : "Dry-run mode disabled",
        },
      });
    } catch (error: unknown) {
      logError("Failed to toggle dry-run mode", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle dry-run mode",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Helper function to format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export { router as retentionRouter };
