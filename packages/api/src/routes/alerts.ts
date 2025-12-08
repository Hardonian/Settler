/**
 * Alert Routes
 * E4-S3: Alert rules, channels, and runbook
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { handleRouteError } from "../utils/error-handler";

const router = Router();

const createAlertRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    metric: z.string(), // e.g., "reconciliation.accuracy", "reconciliation.error_rate"
    threshold: z.number(),
    operator: z.enum(["gt", "gte", "lt", "lte", "eq", "neq"]),
    channels: z.array(z.enum(["email", "slack", "pagerduty"])),
    enabled: z.boolean().default(true),
  }),
});

// List alert rules
router.get(
  "/alerts/rules",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const rules = await query<{
        id: string;
        name: string;
        metric: string;
        threshold: number;
        operator: string;
        channels: string[];
        enabled: boolean;
        created_at: Date;
      }>(
        `SELECT id, name, metric, threshold, operator, channels, enabled, created_at
         FROM alert_rules
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        data: rules.map(r => ({
          id: r.id,
          name: r.name,
          metric: r.metric,
          threshold: r.threshold,
          operator: r.operator,
          channels: r.channels,
          enabled: r.enabled,
          createdAt: r.created_at.toISOString(),
        })),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to list alert rules", 500, { userId: req.userId });
    }
  }
);

// Create alert rule
router.post(
  "/alerts/rules",
  requirePermission(Permission.ADMIN_WRITE),
  validateRequest(createAlertRuleSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { name, metric, threshold, operator, channels, enabled } = req.body;

      const result = await query<{ id: string }>(
        `INSERT INTO alert_rules (user_id, name, metric, threshold, operator, channels, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, name, metric, threshold, operator, channels, enabled]
      );

      if (!result[0]) {
        throw new Error('Failed to create alert rule');
      }
      res.status(201).json({
        data: {
          id: result[0].id,
        },
        message: "Alert rule created successfully",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to create alert rule", 500, { userId: req.userId });
    }
  }
);

// Get alert history
router.get(
  "/alerts/history",
  requirePermission(Permission.ADMIN_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { limit = 50, offset = 0 } = req.query as { limit?: number; offset?: number; };

      const alerts = await query<{
        id: string;
        rule_id: string;
        metric: string;
        value: number;
        threshold: number;
        triggered_at: Date;
        resolved_at: Date | null;
      }>(
        `SELECT a.id, a.rule_id, a.metric, a.value, a.threshold, a.triggered_at, a.resolved_at
         FROM alert_history a
         JOIN alert_rules r ON a.rule_id = r.id
         WHERE r.user_id = $1
         ORDER BY a.triggered_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.json({
        data: alerts.map(a => ({
          id: a.id,
          ruleId: a.rule_id,
          metric: a.metric,
          value: a.value,
          threshold: a.threshold,
          triggeredAt: a.triggered_at.toISOString(),
          resolvedAt: a.resolved_at?.toISOString() || null,
        })),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get alert history", 500, { userId: req.userId });
    }
  }
);

export { router as alertsRouter };
