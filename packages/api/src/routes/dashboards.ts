/**
 * Dashboard Routes
 * E4-S2: Dashboards for activation, usage, revenue, and support metrics
 * Part of Operator-in-a-Box blueprint
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { TenantRequest } from "../middleware/tenant";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { queryWithTenant } from "../db";
import { handleRouteError } from "../utils/error-handler";
import { logInfo, logWarn } from "../utils/logger";
import { withCache } from "../utils/cache";

const router: Router = Router();

const dashboardQuerySchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Activation Dashboard
// SECURITY: All dashboard queries MUST use tenantId for multi-tenant isolation
router.get(
  "/dashboards/activation",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(dashboardQuerySchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [signupFunnel, timeToFirstValue, activationByChannel] = await withCache(
        `dashboard:activation:${tenantId}:${start.toISOString()}:${end.toISOString()}`,
        300000,
        () =>
          Promise.all([
            // Signup funnel - filtered by tenant_id for multi-tenant isolation
            queryWithTenant<{
              signup_started: string;
              signup_completed: string;
              email_verified: string;
              api_key_created: string;
              job_created: string;
              reconciliation_success: string;
            }>(
              tenantId,
              `SELECT
             COUNT(*) FILTER (WHERE event_name = 'SignupStarted') as signup_started,
             COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') as signup_completed,
             COUNT(*) FILTER (WHERE event_name = 'EmailVerified') as email_verified,
             COUNT(*) FILTER (WHERE event_name = 'APIKeyCreated') as api_key_created,
             COUNT(*) FILTER (WHERE event_name = 'JobCreated') as job_created,
             COUNT(*) FILTER (WHERE event_name = 'ReconciliationSuccess') as reconciliation_success
           FROM events
           WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
              [tenantId, start, end]
            ),

            // Time to first value - filtered by tenant_id
            queryWithTenant<{
              median_hours: number;
              p25_hours: number;
              p75_hours: number;
              p95_hours: number;
            }>(
              tenantId,
              `WITH user_events AS (
             SELECT
               user_id,
               MIN(timestamp) FILTER (WHERE event_name = 'SignupCompleted') as signup_time,
               MIN(timestamp) FILTER (WHERE event_name = 'ReconciliationSuccess') as first_success_time
             FROM events
             WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3
             GROUP BY user_id
             HAVING MIN(timestamp) FILTER (WHERE event_name = 'ReconciliationSuccess') IS NOT NULL
           )
           SELECT
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as median_hours,
             PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p25_hours,
             PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p75_hours,
             PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_success_time - signup_time)) / 3600) as p95_hours
           FROM user_events`,
              [tenantId, start, end]
            ),

            // Activation rate by channel - filtered by tenant_id
            queryWithTenant<{
              channel: string;
              signups: string;
              activated: string;
              activation_rate: number;
            }>(
              tenantId,
              `SELECT
             COALESCE(properties->>'source', 'unknown') as channel,
             COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') as signups,
             COUNT(*) FILTER (WHERE event_name = 'JobCreated') as activated,
             CASE
               WHEN COUNT(*) FILTER (WHERE event_name = 'SignupCompleted') > 0
               THEN COUNT(*) FILTER (WHERE event_name = 'JobCreated')::float / COUNT(*) FILTER (WHERE event_name = 'SignupCompleted')
               ELSE 0
             END as activation_rate
           FROM events
           WHERE tenant_id = $1 AND timestamp >= $2 AND timestamp <= $3
           GROUP BY channel`,
              [tenantId, start, end]
            ),
          ])
      );

      res.json({
        data: {
          signupFunnel: signupFunnel[0] || {
            signup_started: 0,
            signup_completed: 0,
            email_verified: 0,
            api_key_created: 0,
            job_created: 0,
            reconciliation_success: 0,
          },
          timeToFirstValue: timeToFirstValue[0] || {
            median_hours: 0,
            p25_hours: 0,
            p75_hours: 0,
            p95_hours: 0,
          },
          activationByChannel: activationByChannel.map((c) => ({
            channel: c.channel,
            signups: parseInt(c.signups),
            activated: parseInt(c.activated),
            activationRate: c.activation_rate,
          })),
        },
      });

      logInfo("Activation dashboard fetched", {
        tenantId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        signupCount: parseInt(signupFunnel[0]?.signup_completed || "0"),
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get activation dashboard", 500, {
        tenantId: req.tenantId,
      });
    }
  }
);

// Usage Dashboard
// SECURITY: All dashboard queries MUST use tenantId for multi-tenant isolation
router.get(
  "/dashboards/usage",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(dashboardQuerySchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [reconciliationVolume, accuracyTrends, errorRate, exceptionRate] = await withCache(
        `dashboard:usage:${tenantId}:${start.toISOString()}:${end.toISOString()}`,
        300000,
        () =>
          Promise.all([
            // Reconciliation volume - filtered by tenant_id
            queryWithTenant<{
              date: Date;
              count: string;
              adapter_combination: string;
            }>(
              tenantId,
              `SELECT
             DATE(timestamp) as date,
             COUNT(*) as count,
             properties->>'sourceAdapter' || '-' || properties->>'targetAdapter' as adapter_combination
           FROM events
           WHERE tenant_id = $1
             AND event_name = 'ReconciliationSuccess'
             AND timestamp >= $2 AND timestamp <= $3
           GROUP BY date, adapter_combination
           ORDER BY date`,
              [tenantId, start, end]
            ),

            // Accuracy trends - filtered by tenant_id
            queryWithTenant<{
              date: Date;
              avg_accuracy: number;
              job_type: string;
            }>(
              tenantId,
              `SELECT
             DATE(timestamp) as date,
             AVG((properties->>'accuracy')::float) as avg_accuracy,
             properties->>'sourceAdapter' || '-' || properties->>'targetAdapter' as job_type
           FROM events
           WHERE tenant_id = $1
             AND event_name = 'ReconciliationSuccess'
             AND timestamp >= $2 AND timestamp <= $3
           GROUP BY date, job_type
           ORDER BY date`,
              [tenantId, start, end]
            ),

            // Error rate - filtered by tenant_id
            queryWithTenant<{
              error_type: string;
              count: string;
              percentage: number;
            }>(
              tenantId,
              `SELECT
             properties->>'errorType' as error_type,
             COUNT(*) as count,
             COUNT(*)::float / (SELECT COUNT(*) FROM events WHERE tenant_id = $1 AND event_name IN ('ReconciliationSuccess', 'ReconciliationError') AND timestamp >= $2 AND timestamp <= $3) * 100 as percentage
           FROM events
           WHERE tenant_id = $1
             AND event_name = 'ReconciliationError'
             AND timestamp >= $2 AND timestamp <= $3
           GROUP BY error_type`,
              [tenantId, start, end]
            ),

            // Exception rate - filtered by tenant_id
            queryWithTenant<{
              reason: string;
              count: string;
              percentage: number;
            }>(
              tenantId,
              `SELECT
             reason,
             COUNT(*) as count,
             COUNT(*)::float / (SELECT COUNT(*) FROM exceptions e JOIN jobs j ON e.job_id = j.id WHERE j.tenant_id = $1 AND e.created_at >= $2 AND e.created_at <= $3) * 100 as percentage
           FROM exceptions e
           JOIN jobs j ON e.job_id = j.id
           WHERE j.tenant_id = $1 AND e.created_at >= $2 AND e.created_at <= $3
           GROUP BY reason`,
              [tenantId, start, end]
            ),
          ])
      );

      res.json({
        data: {
          reconciliationVolume: reconciliationVolume.map((v) => ({
            date: v.date.toISOString().split("T")[0],
            count: parseInt(v.count),
            adapterCombination: v.adapter_combination,
          })),
          accuracyTrends: accuracyTrends.map((t) => ({
            date: t.date.toISOString().split("T")[0],
            avgAccuracy: t.avg_accuracy,
            jobType: t.job_type,
          })),
          errorRate: errorRate.map((e) => ({
            errorType: e.error_type,
            count: parseInt(e.count),
            percentage: e.percentage,
          })),
          exceptionRate: exceptionRate.map((e) => ({
            reason: e.reason,
            count: parseInt(e.count),
            percentage: e.percentage,
          })),
        },
      });

      logInfo("Usage dashboard fetched", {
        tenantId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        volumeCount: reconciliationVolume.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get usage dashboard", 500, {
        tenantId: req.tenantId,
      });
    }
  }
);

// Revenue Dashboard (placeholder - requires billing integration)
// SECURITY: Uses tenantId for multi-tenant isolation when billing is integrated
router.get(
  "/dashboards/revenue",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(dashboardQuerySchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      // Reserved for future billing/plan tracking: tenantId, startDate, endDate
      const _ = {
        tenantId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      void _;

      // TRUTHFUL STATE: Revenue data requires billing integration
      // Return clear unavailable state instead of misleading zeros
      logWarn("Revenue dashboard accessed but requires billing integration", { tenantId });

      res.json({
        data: null,
        available: false,
        message: "Revenue dashboard requires billing integration",
        _info: {
          required: ["stripe_customer_id", "subscription_status", "plan_tier"],
          documentation: "https://docs.settler.run/billing",
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get revenue dashboard", 500, {
        tenantId: req.tenantId,
      });
    }
  }
);

// Support Dashboard
// SECURITY: All dashboard queries MUST use tenantId for multi-tenant isolation
router.get(
  "/dashboards/support",
  requirePermission(Permission.REPORTS_READ),
  validateRequest(dashboardQuerySchema),
  async (req: TenantRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [ticketVolume, resolutionTime] = await withCache(
        `dashboard:support:${tenantId}:${start.toISOString()}:${end.toISOString()}`,
        300000,
        () =>
          Promise.all([
            // Support ticket volume - filtered by tenant_id
            queryWithTenant<{
              date: Date;
              category: string;
              count: string;
            }>(
              tenantId,
              `SELECT
             DATE(timestamp) as date,
             properties->>'category' as category,
             COUNT(*) as count
           FROM events
           WHERE tenant_id = $1
             AND event_name = 'SupportTicketCreated'
             AND timestamp >= $2 AND timestamp <= $3
           GROUP BY date, category
           ORDER BY date`,
              [tenantId, start, end]
            ),

            // Exception resolution time - filtered by tenant_id
            queryWithTenant<{
              median_hours: number;
              p95_hours: number;
            }>(
              tenantId,
              `SELECT
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as median_hours,
             PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as p95_hours
           FROM exceptions e
           JOIN jobs j ON e.job_id = j.id
           WHERE j.tenant_id = $1
             AND e.status = 'resolved'
             AND e.resolved_at >= $2 AND e.resolved_at <= $3`,
              [tenantId, start, end]
            ),
          ])
      );

      res.json({
        data: {
          ticketVolume: ticketVolume.map((t) => ({
            date: t.date.toISOString().split("T")[0],
            category: t.category,
            count: parseInt(t.count),
          })),
          resolutionTime: resolutionTime[0] || {
            median_hours: 0,
            p95_hours: 0,
          },
        },
      });

      logInfo("Support dashboard fetched", {
        tenantId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ticketCount: ticketVolume.length,
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get support dashboard", 500, {
        tenantId: req.tenantId,
      });
    }
  }
);

export { router as dashboardsRouter };
