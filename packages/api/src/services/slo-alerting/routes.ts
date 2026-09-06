/**
 * SLO Dashboard Routes
 *
 * API endpoints for SLO alerting dashboard visualization
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../../middleware/validation";
import { AuthRequest, authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { handleRouteError } from "../../utils/error-handler";
import { SLOMetricType, SLOConfig, DashboardMetricSummary } from "./types";
import * as config from "./config";
import * as metrics from "./metrics";
import * as alerts from "./alerts";
import { detectPercentileDrift, detectTrendChange } from "./drift";
import { DEFAULT_SLO_THRESHOLDS, DEFAULT_PERCENTILE_THRESHOLDS } from "./types";

const router: Router = Router();

// Validation schemas
const updateConfigSchema = z.object({
  body: z.object({
    metricType: z.enum([
      "usage.api.latency_ms",
      "usage.api.query_rows",
      "usage.export.duration_ms",
    ]),
    thresholdWarning: z.number().optional(),
    thresholdCritical: z.number().optional(),
    percentileThreshold: z
      .object({
        p50: z.number().optional(),
        p90: z.number().optional(),
        p95: z.number().optional(),
        p99: z.number().optional(),
      })
      .optional(),
    driftDetection: z
      .object({
        enabled: z.boolean().optional(),
        sensitivity: z.enum(["low", "medium", "high"]).optional(),
        windowSize: z.number().optional(),
        deviationThreshold: z.number().optional(),
      })
      .optional(),
    enabled: z.boolean().optional(),
    evaluationInterval: z.number().optional(),
  }),
});

const createAlertRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    metricType: z.enum([
      "usage.api.latency_ms",
      "usage.api.query_rows",
      "usage.export.duration_ms",
    ]),
    conditionType: z.enum(["threshold", "percentile", "drift"]),
    threshold: z.number().optional(),
    percentile: z.enum(["p50", "p90", "p95", "p99"]).optional(),
    driftEnabled: z.boolean().optional(),
    warningSeverity: z.enum(["info", "warning", "critical"]).optional(),
    criticalSeverity: z.enum(["info", "warning", "critical"]).optional(),
    channels: z
      .array(
        z.object({
          type: z.enum(["email", "slack", "pagerduty", "webhook"]),
          address: z.string().optional(),
          webhookUrl: z.string().optional(),
          channel: z.string().optional(),
          integrationKey: z.string().optional(),
          url: z.string().optional(),
          headers: z.record(z.string(), z.string()).optional(),
        })
      )
      .optional(),
  }),
});

/**
 * GET /api/v1/slo/configs
 * Get all SLO configurations for tenant
 */
router.get(
  "/configs",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const configs = await config.getSLOConfigs(tenantId);

      // Return with defaults for missing configs
      const allMetricTypes: SLOMetricType[] = [
        "usage.api.latency_ms",
        "usage.api.query_rows",
        "usage.export.duration_ms",
      ];

      const configsWithDefaults = allMetricTypes.map((metricType) => {
        const existing = configs.find((c) => c.metricType === metricType);
        if (existing) return existing;

        return {
          id: "",
          tenantId,
          metricType,
          thresholdWarning: DEFAULT_SLO_THRESHOLDS[metricType].warning,
          thresholdCritical: DEFAULT_SLO_THRESHOLDS[metricType].critical,
          percentileThreshold: DEFAULT_PERCENTILE_THRESHOLDS[metricType],
          driftDetection: {
            enabled: true,
            sensitivity: "medium",
            windowSize: 10,
            deviationThreshold: 25,
          },
          enabled: true,
          evaluationInterval: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as SLOConfig;
      });

      res.json({ data: configsWithDefaults });
    } catch (error) {
      handleRouteError(res, error, "Failed to get SLO configs", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * PUT /api/v1/slo/configs
 * Update SLO configuration
 */
router.put(
  "/configs",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(updateConfigSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const {
        metricType,
        thresholdWarning,
        thresholdCritical,
        percentileThreshold,
        driftDetection,
        enabled,
        evaluationInterval,
      } = req.body;

      const configId = await config.upsertSLOConfig(tenantId, metricType, {
        thresholdWarning,
        thresholdCritical,
        percentileThreshold,
        driftDetection,
        enabled,
        evaluationInterval,
      });

      res.json({ data: { id: configId }, message: "SLO config updated" });
    } catch (error) {
      handleRouteError(res, error, "Failed to update SLO config", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * GET /api/v1/slo/dashboard
 * Get dashboard summary with current metric status
 */
router.get(
  "/dashboard",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { hours = "24" } = req.query;
      const hoursNum = parseInt(hours as string, 10) || 24;

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - hoursNum * 60 * 60 * 1000);

      // Get alert summary
      const alertSummary = await alerts.getAlertSummary(tenantId);

      // Get metric summaries
      const metricTypes: SLOMetricType[] = [
        "usage.api.latency_ms",
        "usage.api.query_rows",
        "usage.export.duration_ms",
      ];

      const metricSummaries: DashboardMetricSummary[] = [];

      for (const metricType of metricTypes) {
        const sloConfig = await config.getSLOConfig(tenantId, metricType);
        const thresholdWarning =
          sloConfig?.thresholdWarning ?? DEFAULT_SLO_THRESHOLDS[metricType].warning;
        const thresholdCritical =
          sloConfig?.thresholdCritical ?? DEFAULT_SLO_THRESHOLDS[metricType].critical;

        const summary = await metrics.calculateMetricSummary(
          tenantId,
          metricType,
          startDate,
          endDate,
          thresholdWarning,
          thresholdCritical
        );

        const activeAlerts = await alerts.getActiveAlerts(tenantId, metricType);

        // Determine status
        let status: "healthy" | "warning" | "critical" = "healthy";
        if (summary) {
          if (summary.percentiles.p99 >= thresholdCritical) {
            status = "critical";
          } else if (summary.percentiles.p99 >= thresholdWarning) {
            status = "warning";
          }
        }

        // Get trend
        const historical = await metrics.getHistoricalMetrics(
          tenantId,
          metricType,
          startDate,
          endDate,
          60
        );
        const trendValues = historical.map((h) => ({
          timestamp: h.timestamp,
          value: h.percentiles.p99,
        }));
        const trendResult = detectTrendChange(trendValues);

        metricSummaries.push({
          tenantId,
          metricType,
          currentPercentiles: summary?.percentiles ?? {
            p50: 0,
            p90: 0,
            p95: 0,
            p99: 0,
            min: 0,
            max: 0,
            count: 0,
            sum: 0,
            avg: 0,
          },
          thresholds: {
            warning: thresholdWarning,
            critical: thresholdCritical,
          },
          status,
          trend: trendResult.trend,
          lastUpdated: summary?.windowEnd ?? new Date(),
          alertCount: activeAlerts.length,
        });
      }

      res.json({
        data: {
          alerts: alertSummary,
          metrics: metricSummaries,
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to get dashboard", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * GET /api/v1/slo/metrics/:metricType
 * Get detailed metrics for a specific type
 */
router.get(
  "/metrics/:metricType",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { metricType } = req.params as { metricType: SLOMetricType };
      const { startDate, endDate, interval = "60" } = req.query;

      if (
        !["usage.api.latency_ms", "usage.api.query_rows", "usage.export.duration_ms"].includes(
          metricType
        )
      ) {
        res.status(400).json({ error: "Invalid metric type" });
        return;
      }

      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      const intervalNum = parseInt(interval as string, 10) || 60;

      const historical = await metrics.getHistoricalMetrics(
        tenantId,
        metricType,
        start,
        end,
        intervalNum
      );

      res.json({
        data: {
          metricType,
          historical: historical.map((h) => ({
            timestamp: h.timestamp.toISOString(),
            percentiles: h.percentiles,
            sampleCount: h.sampleCount,
          })),
          period: { start: start.toISOString(), end: end.toISOString() },
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to get metrics", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * GET /api/v1/slo/alerts
 * Get active alerts
 */
router.get(
  "/alerts",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { metricType, status, limit = "50", offset = "0" } = req.query;

      let activeAlerts;
      if (status === "history") {
        activeAlerts = await alerts.getAlertHistory(tenantId, {
          metricType: metricType as SLOMetricType | undefined,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        });
      } else {
        activeAlerts = await alerts.getActiveAlerts(
          tenantId,
          metricType as SLOMetricType | undefined
        );
      }

      res.json({ data: activeAlerts });
    } catch (error) {
      handleRouteError(res, error, "Failed to get alerts", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * POST /api/v1/slo/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post(
  "/alerts/:alertId/acknowledge",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const alertIdParam = req.params["alertId"];
      const alertId = Array.isArray(alertIdParam) ? (alertIdParam[0] ?? "") : (alertIdParam ?? "");
      const userId = req.userId!;

      await alerts.acknowledgeAlert(tenantId, alertId, userId);

      res.json({ message: "Alert acknowledged" });
    } catch (error) {
      handleRouteError(res, error, "Failed to acknowledge alert", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * POST /api/v1/slo/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post(
  "/alerts/:alertId/resolve",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const alertIdParam2 = req.params["alertId"];
      const alertId2 = Array.isArray(alertIdParam2)
        ? (alertIdParam2[0] ?? "")
        : (alertIdParam2 ?? "");
      const userId = req.userId;

      await alerts.resolveAlert(tenantId, alertId2, userId);

      res.json({ message: "Alert resolved" });
    } catch (error) {
      handleRouteError(res, error, "Failed to resolve alert", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * GET /api/v1/slo/alert-rules
 * Get alert rules
 */
router.get(
  "/alert-rules",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const rules = await config.getAlertRules(tenantId);

      res.json({ data: rules });
    } catch (error) {
      handleRouteError(res, error, "Failed to get alert rules", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * POST /api/v1/slo/alert-rules
 * Create alert rule
 */
router.post(
  "/alert-rules",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(createAlertRuleSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const {
        name,
        metricType,
        conditionType,
        threshold,
        percentile,
        driftEnabled,
        warningSeverity,
        criticalSeverity,
        channels,
      } = req.body;

      const ruleId = await config.createAlertRule(tenantId, {
        name,
        metricType,
        conditionType,
        threshold,
        percentile,
        driftEnabled,
        warningSeverity: warningSeverity || "warning",
        criticalSeverity: criticalSeverity || "critical",
        channels: channels || [],
      });

      res.status(201).json({ data: { id: ruleId }, message: "Alert rule created" });
    } catch (error) {
      handleRouteError(res, error, "Failed to create alert rule", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * DELETE /api/v1/slo/alert-rules/:ruleId
 * Delete alert rule
 */
router.delete(
  "/alert-rules/:ruleId",
  authMiddleware,
  requirePermission(Permission.ADMIN_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const ruleIdParam = req.params["ruleId"];
      const ruleId = Array.isArray(ruleIdParam) ? (ruleIdParam[0] ?? "") : (ruleIdParam ?? "");

      await config.deleteAlertRule(tenantId, ruleId);

      res.json({ message: "Alert rule deleted" });
    } catch (error) {
      handleRouteError(res, error, "Failed to delete alert rule", 500, { tenantId: req.tenantId });
    }
  }
);

/**
 * GET /api/v1/slo/drift/:metricType
 * Get drift analysis for a metric
 */
router.get(
  "/drift/:metricType",
  authMiddleware,
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { metricType } = req.params as { metricType: SLOMetricType };
      const { windowMinutes = "60", compareWindowMinutes = "60" } = req.query;

      if (
        !["usage.api.latency_ms", "usage.api.query_rows", "usage.export.duration_ms"].includes(
          metricType
        )
      ) {
        res.status(400).json({ error: "Invalid metric type" });
        return;
      }

      const windowMinutesNum = parseInt(windowMinutes as string, 10) || 60;
      const compareWindowMinutesNum = parseInt(compareWindowMinutes as string, 10) || 60;

      const now = new Date();
      const currentWindowStart = new Date(now.getTime() - windowMinutesNum * 60 * 1000);
      const previousWindowStart = new Date(
        now.getTime() - (windowMinutesNum + compareWindowMinutesNum) * 60 * 1000
      );

      const sloConfig = await config.getSLOConfig(tenantId, metricType);
      const driftConfig = sloConfig?.driftDetection ?? {
        enabled: true,
        sensitivity: "medium",
        windowSize: 10,
        deviationThreshold: 25,
      };

      const driftResult = await detectPercentileDrift(
        tenantId,
        metricType,
        currentWindowStart,
        now,
        previousWindowStart,
        currentWindowStart,
        driftConfig
      );

      res.json({ data: driftResult });
    } catch (error) {
      handleRouteError(res, error, "Failed to get drift analysis", 500, { tenantId: req.tenantId });
    }
  }
);

export { router as sloRouter };
