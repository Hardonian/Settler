import { Response, NextFunction } from "express";
import { queryWithTenant } from "../db";
import { logWarn, logError } from "../utils/logger";
import { AuthRequest } from "./auth";

/**
 * Middleware to enforce tenant usage limits based on their billing tier
 */
export const enforceUsageLimits = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Check current usage vs limit
      const rows = await queryWithTenant<{
        tier: string;
        current_usage: number;
        usage_limit: number;
        status: string;
      }>(
        tenantId,
        `SELECT tier, current_usage, usage_limit, status 
         FROM tenant_billing 
         WHERE tenant_id = $1`,
        [tenantId]
      );

      const firstRow = rows[0];

      // Default free tier fallback if no record exists
      const currentUsage = firstRow ? Number(firstRow.current_usage) : 0;
      const limit = firstRow ? Number(firstRow.usage_limit) : 1000;
      const status = firstRow ? firstRow.status : "active";

      if (status !== "active") {
        logWarn("Blocked access for inactive subscription", { tenantId });
        res.status(403).json({
          error: "Subscription is inactive. Please update your billing details.",
        });
        return;
      }

      if (limit !== -1 && currentUsage >= limit) {
        logWarn("Tenant exceeded usage limits", { tenantId, currentUsage, limit });
        res.status(402).json({
          error: "Usage limit exceeded",
          message: "You have exceeded your monthly reconciliation limit. Please upgrade your plan.",
          currentUsage,
          limit,
        });
        return;
      }

      // If under limit, proceed
      next();
    } catch (error) {
      logError("Failed to check tenant usage", error);
      // Fail open to avoid blocking core operations due to a billing service glitch
      next();
    }
  };
};
