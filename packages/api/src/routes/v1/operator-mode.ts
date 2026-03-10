/**
 * Operator Mode API Routes
 * Endpoints for daily intelligence, alerts, cost controls, kill switches, and backups
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../../middleware/validation";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import {
  generateDailyIntelligence,
  getErrorRateSummary,
  getSlowEndpoints,
  getFailedIngestions,
  getBillingAnomalies,
} from "../../services/operator-mode/daily-intelligence";
import {
  checkAlertThresholds,
  getNotifierCapabilities,
  upsertAlertThreshold,
  AlertThreshold,
} from "../../services/operator-mode/alerting";
import {
  setTenantUsageCeiling,
  getAllUsageCeilings,
  checkUsageCeiling,
  setBackgroundJobLimit,
} from "../../services/operator-mode/cost-controls";
import {
  getAlertRoutingProvider,
  getUsageMeteringProvider,
} from "../../services/capabilities/registry";
import { observeCapabilityStatus } from "../../services/capabilities/telemetry";
import {
  setKillSwitch,
  getAllKillSwitches,
  disableConnector,
  enableConnector,
  pauseBackgroundJob,
  resumeBackgroundJob,
} from "../../services/operator-mode/kill-switches";
import { createBackup, verifyBackup, listBackups } from "../../services/operator-mode/backups";

const router: Router = Router();

function requireTenantContext(req: AuthRequest, res: Response): string | undefined {
  if (req.tenantId) {
    return req.tenantId;
  }

  res.status(400).json({
    error: "TENANT_CONTEXT_REQUIRED",
    message: "Tenant context is required for this operator endpoint",
  });
  return undefined;
}

function shouldUseGlobalScope(req: AuthRequest): boolean {
  return req.query.scope === "global";
}

// ============================================================================
// DAILY INTELLIGENCE
// ============================================================================

router.get(
  "/operator/daily-intelligence",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const intelligence = await generateDailyIntelligence(date);

      res.json({ data: intelligence });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get daily intelligence", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/error-rate",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const errorRate = await getErrorRateSummary(date);

      res.json({ data: errorRate });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get error rate", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/slow-endpoints",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const slowEndpoints = await getSlowEndpoints(date);

      res.json({ data: slowEndpoints });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get slow endpoints", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/failed-ingestions",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const failedIngestions = await getFailedIngestions(date);

      res.json({ data: failedIngestions });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get failed ingestions", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/billing-anomalies",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      const anomalies = await getBillingAnomalies(date);

      res.json({ data: anomalies });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get billing anomalies", 500, {
        userId: req.userId,
      });
    }
  }
);

// ============================================================================
// ALERTING
// ============================================================================

router.post(
  "/operator/alerts/check",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const provider = getAlertRoutingProvider();
      const useGlobalScope = shouldUseGlobalScope(req);
      const tenantId = useGlobalScope ? undefined : requireTenantContext(req, res);
      if (!useGlobalScope && !tenantId) {
        return;
      }

      const alerts = await provider.checkThresholds(tenantId);
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/alerts/check");

      res.json({
        data: alerts,
        capability,
        scope: useGlobalScope ? "global" : "tenant",
        tenantId: tenantId ?? null,
        message: `Checked thresholds, triggered ${alerts.length} alerts`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to check alert thresholds", 500, {
        userId: req.userId,
      });
    }
  }
);

const createAlertThresholdSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    metric: z.enum([
      "error_rate",
      "slow_endpoint",
      "failed_ingestion",
      "billing_anomaly",
      "usage_limit",
    ]),
    threshold: z.number(),
    operator: z.enum(["gt", "gte", "lt", "lte", "eq", "neq"]),
    severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    channels: z.array(z.enum(["email", "slack", "teams", "telegram", "webhook"])).default([]),
    enabled: z.boolean().default(true),
  }),
});

router.post(
  "/operator/alerts/thresholds",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(createAlertThresholdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const threshold: AlertThreshold = req.body;
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) {
        return;
      }

      const provider = getAlertRoutingProvider();
      const thresholdId = await provider.upsertThreshold(userId, threshold, tenantId);
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/alerts/thresholds");

      res.status(201).json({
        data: { id: thresholdId },
        capability,
        tenantId,
        message: "Alert threshold created",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create alert threshold", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/alerts/capabilities",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      res.json({ data: getNotifierCapabilities() });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get notifier capabilities", 500, {
        userId: req.userId,
      });
    }
  }
);

// ============================================================================
// COST CONTROLS
// ============================================================================

const setUsageCeilingSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid(),
    billingAccountId: z.string().uuid(),
    usageType: z.enum(["ingestions", "reconciliations", "api_requests", "storage"]),
    monthlyLimit: z.number().positive(),
  }),
});

router.post(
  "/operator/cost-controls/usage-ceilings",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(setUsageCeilingSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, billingAccountId, usageType, monthlyLimit } = req.body;

      const provider = getUsageMeteringProvider();
      await provider.setUsageCeiling(tenantId, billingAccountId, usageType, monthlyLimit);
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/cost-controls/usage-ceilings");

      res.status(201).json({
        capability,
        message: "Usage ceiling set",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to set usage ceiling", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/cost-controls/usage-ceilings",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const provider = getUsageMeteringProvider();
      const ceilings = await provider.getUsageCeilings();
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/cost-controls/usage-ceilings");

      res.json({ data: ceilings, capability });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get usage ceilings", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/cost-controls/usage-ceilings/:tenantId/:usageType",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, usageType } = req.params;

      if (!tenantId || !usageType) {
        res.status(400).json({
          error: "Bad Request",
          message: "tenantId and usageType are required",
        });
        return;
      }

      const provider = getUsageMeteringProvider();
      const check = await provider.checkUsageCeiling(tenantId, usageType as any);
      const capability = provider.status();
      observeCapabilityStatus(
        capability,
        "/api/v1/operator/cost-controls/usage-ceilings/:tenantId/:usageType"
      );

      res.json({ data: check, capability });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to check usage ceiling", 500, {
        userId: req.userId,
      });
    }
  }
);

const setJobLimitSchema = z.object({
  body: z.object({
    jobType: z.enum(["ingestion", "reconciliation", "webhook", "export"]),
    maxConcurrent: z.number().positive(),
    maxPerTenant: z.number().positive(),
  }),
});

router.post(
  "/operator/cost-controls/job-limits",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(setJobLimitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobType, maxConcurrent, maxPerTenant } = req.body;

      const provider = getUsageMeteringProvider();
      await provider.setJobLimit(jobType, maxConcurrent, maxPerTenant);
      const capability = provider.status();
      observeCapabilityStatus(capability, "/api/v1/operator/cost-controls/job-limits");

      res.status(201).json({
        capability,
        message: "Background job limit set",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to set job limit", 500, {
        userId: req.userId,
      });
    }
  }
);

// ============================================================================
// KILL SWITCHES
// ============================================================================

router.get(
  "/operator/kill-switches",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const switches = await getAllKillSwitches();

      res.json({ data: switches });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get kill switches", 500, {
        userId: req.userId,
      });
    }
  }
);

const setKillSwitchSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(["connector", "background_job", "feature", "endpoint"]),
    target: z.string().min(1),
    enabled: z.boolean(),
    reason: z.string().optional(),
  }),
});

router.post(
  "/operator/kill-switches",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(setKillSwitchSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, type, target, enabled, reason } = req.body;
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User ID not found",
        });
        return;
      }

      const switchId = await setKillSwitch(name, type, target, enabled, reason, userId);

      res.status(201).json({
        data: { id: switchId },
        message: `Kill switch ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to set kill switch", 500, {
        userId: req.userId,
      });
    }
  }
);

router.post(
  "/operator/kill-switches/connectors/:connectorType/disable",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { connectorType } = req.params;
      if (!connectorType) {
        res.status(400).json({
          error: "Bad Request",
          message: "connectorType is required",
        });
        return;
      }
      const reason = (req.body.reason as string) || "Manually disabled";
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User ID not found",
        });
        return;
      }

      await disableConnector(connectorType, reason, userId);

      res.json({
        message: `Connector ${connectorType} disabled`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to disable connector", 500, {
        userId: req.userId,
      });
    }
  }
);

router.post(
  "/operator/kill-switches/connectors/:connectorType/enable",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { connectorType } = req.params;
      if (!connectorType) {
        res.status(400).json({
          error: "Bad Request",
          message: "connectorType is required",
        });
        return;
      }

      await enableConnector(connectorType);

      res.json({
        message: `Connector ${connectorType} enabled`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to enable connector", 500, {
        userId: req.userId,
      });
    }
  }
);

router.post(
  "/operator/kill-switches/jobs/:jobType/pause",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobType } = req.params;
      if (!jobType) {
        res.status(400).json({
          error: "Bad Request",
          message: "jobType is required",
        });
        return;
      }
      const reason = (req.body.reason as string) || "Manually paused";
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          error: "Unauthorized",
          message: "User ID not found",
        });
        return;
      }

      await pauseBackgroundJob(jobType, reason, userId);

      res.json({
        message: `Background job ${jobType} paused`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to pause background job", 500, {
        userId: req.userId,
      });
    }
  }
);

router.post(
  "/operator/kill-switches/jobs/:jobType/resume",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobType } = req.params;
      if (!jobType) {
        res.status(400).json({
          error: "Bad Request",
          message: "jobType is required",
        });
        return;
      }

      await resumeBackgroundJob(jobType);

      res.json({
        message: `Background job ${jobType} resumed`,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to resume background job", 500, {
        userId: req.userId,
      });
    }
  }
);

// ============================================================================
// BACKUPS
// ============================================================================

router.post(
  "/operator/backups/create",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const backup = await createBackup();

      res.status(201).json({
        data: backup,
        message: "Backup created",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create backup", 500, {
        userId: req.userId,
      });
    }
  }
);

router.post(
  "/operator/backups/:backupId/verify",
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const { backupId } = req.params;
      if (!backupId) {
        res.status(400).json({
          error: "Bad Request",
          message: "backupId is required",
        });
        return;
      }

      const verified = await verifyBackup(backupId);

      res.json({
        data: { verified },
        message: verified ? "Backup verified" : "Backup verification failed",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to verify backup", 500, {
        userId: req.userId,
      });
    }
  }
);

router.get(
  "/operator/backups",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || "10", 10);
      const backups = await listBackups(limit);

      res.json({ data: backups });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list backups", 500, {
        userId: req.userId,
      });
    }
  }
);

export { router as operatorModeRouter };
