/**
 * Usage Quota Middleware
 * Enforces plan limits and tracks usage
 */

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { query } from "../db";
import { getPlanLimits, getPlanFeatures } from "../config/commercial-quota";
import { sendError } from "../utils/api-response";
import { logInfo } from "../utils/logger";
import { checkQuotaExceeded, trackReconciliationExecution } from "../services/usage/tracker";
import { trackEvent } from "../services/analytics/events";

/**
 * Check usage quota before allowing operation
 */
export async function checkUsageQuota(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;
  const tenantId = authReq.tenantId;

  if (!userId || !tenantId) {
    return next();
  }

  try {
    // Get user plan
    const users = await query<{ plan_type: string }>(`SELECT plan_type FROM users WHERE id = $1`, [
      userId,
    ]);

    if (users.length === 0) {
      return next();
    }

    const planType = (users[0]?.plan_type || "free") as
      | "free"
      | "trial"
      | "commercial"
      | "enterprise";
    const limits = getPlanLimits(planType);
    const planFeatures = getPlanFeatures(planType);

    // Check reconciliation limit (for job execution endpoints)
    if (req.path.includes("/jobs") && req.method === "POST") {
      if (limits.reconciliationsPerMonth !== "unlimited") {
        const quota = await checkQuotaExceeded(
          userId,
          "reconciliations",
          limits.reconciliationsPerMonth
        );

        if (quota.exceeded) {
          // Track quota exceeded event
          await trackEvent(userId, "usage.quota_exceeded", {
            metric_type: "reconciliations",
            current: quota.current,
            limit: quota.limit,
          });

          return sendError(
            res,
            429,
            "QUOTA_EXCEEDED",
            `You've reached your monthly limit of ${limits.reconciliationsPerMonth} reconciliations. Upgrade to unlock unlimited.`,
            {
              currentUsage: quota.current,
              limit: quota.limit,
              upgradeUrl: "/pricing",
            }
          );
        }

        // Track usage warning at 80%
        if (quota.percentage >= 80 && quota.percentage < 100) {
          await trackEvent(userId, "usage.quota_warning", {
            metric_type: "reconciliations",
            current: quota.current,
            limit: quota.limit,
            percentage: quota.percentage,
          });
        }
      }
    }

    // Check playground runs limit
    if (req.path.includes("/playground") && req.method === "POST") {
      const playgroundLimit =
        planFeatures.playground?.runsPerDay === "unlimited"
          ? Infinity
          : planFeatures.playground?.runsPerDay || 3;
      if (playgroundLimit !== Infinity) {
        const quota = await checkQuotaExceeded(userId, "playground_runs", playgroundLimit);

        if (quota.exceeded) {
          await trackEvent(userId, "usage.quota_exceeded", {
            metric_type: "playground_runs",
            current: quota.current,
            limit: quota.limit,
          });

          return sendError(
            res,
            429,
            "QUOTA_EXCEEDED",
            "You've reached your daily limit of 3 playground runs. Upgrade to Commercial for unlimited runs.",
            {
              currentUsage: quota.current,
              limit: quota.limit,
              upgradeUrl: "/pricing",
            }
          );
        }
      }
    }

    next();
  } catch (error) {
    // Don't block request if quota check fails
    logInfo("Usage quota check failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    next();
  }
}

/**
 * Track usage after successful operation
 */
export async function trackUsageAfterOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;
  const tenantId = authReq.tenantId;

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end to track usage
  res.end = function (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) {
    // Only track if request was successful
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (userId && tenantId) {
        // Track reconciliation execution
        if (req.path.includes("/jobs") && req.method === "POST") {
          trackReconciliationExecution(userId, tenantId).catch(() => {
            // Silent fail - tracking is non-critical
          });
        }

        // Track export creation (fire and forget)
        if (req.path.includes("/exports") && req.method === "POST") {
          import("../services/usage/tracker")
            .then(({ trackExportCreation }) => {
              trackExportCreation(userId, tenantId).catch(() => {
                // Silent fail
              });
            })
            .catch(() => {
              // Silent fail on import
            });
        }
      }
    }

    // Call original end
    if (encoding !== undefined && typeof encoding === "string") {
      originalEnd(chunk, encoding, cb);
    } else if (cb !== undefined) {
      originalEnd(chunk, cb);
    } else {
      originalEnd(chunk);
    }
  } as typeof originalEnd;

  next();
}
