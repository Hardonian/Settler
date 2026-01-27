"use strict";
/**
 * Export Limitations Middleware
 *
 * Limits export frequency and requires approval for large exports.
 * This creates switching friction by making exports less convenient.
 *
 * PHASE: Workflow Lock-In Reinforcement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLimitationsMiddleware = exportLimitationsMiddleware;
exports.getExportLimits = getExportLimits;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const DEFAULT_LIMITS = {
    starter: {
        dailyLimit: 5,
        monthlyLimit: 50,
        sizeLimit: 10000,
        approvalRequired: false,
    },
    professional: {
        dailyLimit: 20,
        monthlyLimit: 200,
        sizeLimit: 100000,
        approvalRequired: false,
    },
    enterprise: {
        dailyLimit: 100,
        monthlyLimit: 1000,
        sizeLimit: 1000000,
        approvalRequired: false,
    },
};
/**
 * Export Limitations Middleware
 */
async function exportLimitationsMiddleware(req, res, next) {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        if (!tenantId || !userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Get tenant's plan
        const planResult = await (0, db_1.query)(`SELECT plan_id
      FROM subscriptions s
      JOIN billing_accounts ba ON ba.id = s.billing_account_id
      WHERE ba.tenant_id = $1
      AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1`, [tenantId]);
        const planId = planResult.length > 0
            ? planResult[0].plan_id
            : "starter";
        const limits = getLimitsForPlan(planId);
        // Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyExports = await (0, db_1.query)(`SELECT COUNT(*) as count
      FROM exports
      WHERE tenant_id = $1
      AND created_at >= $2`, [tenantId, today]);
        const dailyCount = dailyExports[0]?.count || 0;
        if (dailyCount >= limits.dailyLimit) {
            res.status(429).json({
                error: "Daily export limit exceeded",
                limit: limits.dailyLimit,
                current: dailyCount,
                retryAfter: "24 hours",
            });
            return;
        }
        // Check monthly limit
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyExports = await (0, db_1.query)(`SELECT COUNT(*) as count
      FROM exports
      WHERE tenant_id = $1
      AND created_at >= $2`, [tenantId, monthStart]);
        const monthlyCount = monthlyExports[0]?.count || 0;
        if (monthlyCount >= limits.monthlyLimit) {
            res.status(429).json({
                error: "Monthly export limit exceeded",
                limit: limits.monthlyLimit,
                current: monthlyCount,
                retryAfter: "next month",
            });
            return;
        }
        // Check size limit (if export size is known)
        const estimatedRows = (req.body).estimatedRows || 0;
        if (estimatedRows > limits.sizeLimit) {
            res.status(400).json({
                error: "Export size exceeds limit",
                limit: limits.sizeLimit,
                estimated: estimatedRows,
                message: "Large exports require approval. Please contact support or upgrade your plan.",
            });
            return;
        }
        // Store limits in request for later use
        req.exportLimits = limits;
        (0, logger_1.logInfo)("Export limitations checked", {
            tenantId,
            planId,
            dailyCount,
            monthlyCount,
            estimatedRows,
        });
        next();
    }
    catch (error) {
        (0, logger_1.logError)("Export limitations check failed", error);
        // Fail open - allow export if check fails
        next();
    }
}
/**
 * Get export limits for a plan ID
 */
function getLimitsForPlan(planId) {
    const limits = DEFAULT_LIMITS[planId];
    if (limits) {
        return limits;
    }
    // Fallback to starter if plan not found
    // starter is guaranteed to exist in DEFAULT_LIMITS
    return DEFAULT_LIMITS.starter;
}
/**
 * Get export limits for tenant
 */
async function getExportLimits(tenantId) {
    try {
        const planResult = await (0, db_1.query)(`SELECT plan_id
      FROM subscriptions s
      JOIN billing_accounts ba ON ba.id = s.billing_account_id
      WHERE ba.tenant_id = $1
      AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1`, [tenantId]);
        const planId = planResult.length > 0
            ? planResult[0].plan_id
            : "starter";
        return getLimitsForPlan(planId);
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get export limits", error, { tenantId });
        // starter is guaranteed to exist in DEFAULT_LIMITS
        return DEFAULT_LIMITS.starter;
    }
}
//# sourceMappingURL=export-limitations.js.map