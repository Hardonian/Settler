/**
 * Usage Telemetry Routes
 * POST /api/telemetry/usage - Submit usage telemetry
 * GET  /api/telemetry/usage - Get usage analytics
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { queryWithTenant } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router: Router = Router();

const submitTelemetrySchema = z.object({
  body: z.object({
    eventType: z.enum([
      "page_view",
      "feature_used",
      "api_call",
      "reconciliation_run",
      "export_generated",
      "settings_changed",
    ]),
    feature: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    durationMs: z.number().optional(),
    success: z.boolean().optional(),
  }),
});

const getUsageSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    eventType: z.string().optional(),
    granularity: z.enum(["hour", "day", "week", "month"]).optional(),
  }),
});

router.post(
  "/usage",
  validateRequest(submitTelemetrySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const tenantId = req.tenantId!;
      const { eventType, feature, metadata, durationMs, success } = req.body;

      await queryWithTenant(
        tenantId,
        `INSERT INTO usage_events (
          user_id, tenant_id, event_type, feature, metadata, duration_ms, success, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          eventType,
          feature || null,
          metadata ? JSON.stringify(metadata) : "{}",
          durationMs || null,
          success ?? true,
        ]
      );

      res.status(201).json({ ok: true, status: "success" });
    } catch (error) {
      handleRouteError(res, error, "Failed to submit telemetry", 500, { userId: req.userId });
    }
  }
);

router.get(
  "/usage",
  requirePermission(Permission.USERS_READ),
  validateRequest(getUsageSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const queryParams = getUsageSchema.parse({ query: req.query });
      const { startDate, endDate, eventType, granularity = "day" } = queryParams.query;

      let dateFilter = "";
      const params: (string | Date)[] = [tenantId];
      let paramIndex = 2;

      if (startDate || endDate) {
        dateFilter = `AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(startDate || new Date("1970-01-01"), endDate || new Date());
        paramIndex += 2;
      }

      if (eventType) {
        dateFilter += ` AND event_type = $${paramIndex}`;
        params.push(eventType);
        paramIndex++;
      }

      // Get event counts by granularity
      const granularityMap: Record<string, string> = {
        hour: "DATE_TRUNC('hour', created_at)",
        day: "DATE_TRUNC('day', created_at)",
        week: "DATE_TRUNC('week', created_at)",
        month: "DATE_TRUNC('month', created_at)",
      };
      const timeFormat = granularityMap[granularity] || "DATE_TRUNC('day', created_at)";

      const usage = await queryWithTenant<{
        period: Date;
        eventType: string;
        count: number;
        uniqueUsers: number;
        avgDurationMs: number;
        successRate: number;
      }>(
        tenantId,
        `
        SELECT
          ${timeFormat} as period,
          event_type,
          COUNT(*) as count,
          COUNT(DISTINCT user_id) as "uniqueUsers",
          AVG(duration_ms) as "avgDurationMs",
          AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM usage_events
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY ${timeFormat}, event_type
        ORDER BY period DESC, count DESC
        LIMIT 1000
      `,
        params
      );

      // Get summary stats
      const summary = await queryWithTenant<{
        totalEvents: number;
        uniqueUsers: number;
        avgSessionDuration: number;
        successRate: number;
        topFeatures: Array<{ feature: string; count: number }>;
      }>(
        tenantId,
        `
        SELECT
          COUNT(*) as "totalEvents",
          COUNT(DISTINCT user_id) as "uniqueUsers",
          AVG(duration_ms) as "avgSessionDuration",
          AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as "successRate",
          (
            SELECT json_agg(json_build_object('feature', feature, 'count', cnt))
            FROM (
              SELECT feature, COUNT(*) as cnt
              FROM usage_events
              WHERE tenant_id = $1 AND feature IS NOT NULL ${dateFilter}
              GROUP BY feature
              ORDER BY cnt DESC
              LIMIT 10
            ) sub
          ) as "topFeatures"
        FROM usage_events
        WHERE tenant_id = $1 ${dateFilter}
      `,
        params
      );

      res.json({
        ok: true,
        status: "success",
        data: {
          summary: summary[0],
          usage: usage,
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to fetch usage analytics", 500, { userId: req.userId });
    }
  }
);

export { router as telemetryRouter };
