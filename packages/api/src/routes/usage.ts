/**
 * Usage Tracking Routes
 *
 * Provides endpoints for:
 * - Viewing usage statistics
 * - Cost tracking
 * - Usage limits and quotas
 * - Billing information
 */

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { getCurrentUsage } from "../middleware/usage-tracking";
import { logError } from "../utils/logger";

const router: Router = Router();

/**
 * Get usage summary
 * GET /api/v1/usage
 * Requires REPORTS_READ permission for tenant-scoped access
 */
router.get(
  "/",
  authMiddleware,
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const period = (req.query.period as "day" | "week" | "month") || "day";
      const usage = await getCurrentUsage(req as any, period);

      if (!usage) {
        return res.status(404).json({
          error: "Not Found",
          message: "Usage data not found",
        });
      }

      return res.json({
        period,
        ...usage,
        retrievedAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Failed to get usage", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve usage data",
      });
    }
  }
);

/**
 * Get usage by endpoint
 * GET /api/v1/usage/endpoints
 * Requires REPORTS_READ permission for tenant-scoped access
 */
router.get(
  "/endpoints",
  authMiddleware,
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const period = (req.query.period as "day" | "week" | "month") || "day";
      const usage = await getCurrentUsage(req as any, period);

      if (!usage) {
        return res.status(404).json({
          error: "Not Found",
          message: "Usage data not found",
        });
      }

      return res.json({
        period,
        byEndpoint: usage.byEndpoint,
        retrievedAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Failed to get usage by endpoint", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve endpoint usage",
      });
    }
  }
);

/**
 * Get cost summary
 * GET /api/v1/usage/cost
 * Requires REPORTS_READ permission for tenant-scoped access
 */
router.get(
  "/cost",
  authMiddleware,
  requirePermission(Permission.REPORTS_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const period = (req.query.period as "day" | "week" | "month") || "day";
      const usage = await getCurrentUsage(req as any, period);

      if (!usage) {
        return res.status(404).json({
          error: "Not Found",
          message: "Usage data not found",
        });
      }

      return res.json({
        period,
        totalCost: usage.totalCost,
        currency: "USD",
        breakdown: {
          requests: usage.totalRequests * 0.001, // $0.001 per request
          dataTransfer: usage.totalCost - usage.totalRequests * 0.001,
        },
        retrievedAt: new Date().toISOString(),
      });
    } catch (error) {
      logError("Failed to get cost summary", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve cost data",
      });
    }
  }
);

export { router as usageRouter };
