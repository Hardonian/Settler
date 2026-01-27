"use strict";
/**
 * Usage Quota Middleware
 * Enforces plan limits and tracks usage
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsageQuota = checkUsageQuota;
exports.trackUsageAfterOperation = trackUsageAfterOperation;
const db_1 = require("../db");
const plans_1 = require("../config/plans");
const api_response_1 = require("../utils/api-response");
const logger_1 = require("../utils/logger");
const tracker_1 = require("../services/usage/tracker");
const events_1 = require("../services/analytics/events");
/**
 * Check usage quota before allowing operation
 */
async function checkUsageQuota(req, res, next) {
    const authReq = req;
    const userId = authReq.userId;
    const tenantId = authReq.tenantId;
    if (!userId || !tenantId) {
        return next();
    }
    try {
        // Get user plan
        const users = await (0, db_1.query)(`SELECT plan_type FROM users WHERE id = $1`, [
            userId,
        ]);
        if (users.length === 0) {
            return next();
        }
        const planType = (users[0]?.plan_type || "free");
        const limits = (0, plans_1.getPlanLimits)(planType);
        const planFeatures = (0, plans_1.getPlanFeatures)(planType);
        // Check reconciliation limit (for job execution endpoints)
        if (req.path.includes("/jobs") && req.method === "POST") {
            if (limits.reconciliationsPerMonth !== "unlimited") {
                const quota = await (0, tracker_1.checkQuotaExceeded)(userId, "reconciliations", limits.reconciliationsPerMonth);
                if (quota.exceeded) {
                    // Track quota exceeded event
                    await (0, events_1.trackEvent)(userId, "usage.quota_exceeded", {
                        metric_type: "reconciliations",
                        current: quota.current,
                        limit: quota.limit,
                    });
                    return (0, api_response_1.sendError)(res, 429, "QUOTA_EXCEEDED", `You've reached your monthly limit of ${limits.reconciliationsPerMonth} reconciliations. Upgrade to unlock unlimited.`, {
                        currentUsage: quota.current,
                        limit: quota.limit,
                        upgradeUrl: "/pricing",
                    });
                }
                // Track usage warning at 80%
                if (quota.percentage >= 80 && quota.percentage < 100) {
                    await (0, events_1.trackEvent)(userId, "usage.quota_warning", {
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
            const playgroundLimit = planFeatures.playground?.runsPerDay === "unlimited"
                ? Infinity
                : planFeatures.playground?.runsPerDay || 3;
            if (playgroundLimit !== Infinity) {
                const quota = await (0, tracker_1.checkQuotaExceeded)(userId, "playground_runs", playgroundLimit);
                if (quota.exceeded) {
                    await (0, events_1.trackEvent)(userId, "usage.quota_exceeded", {
                        metric_type: "playground_runs",
                        current: quota.current,
                        limit: quota.limit,
                    });
                    return (0, api_response_1.sendError)(res, 429, "QUOTA_EXCEEDED", "You've reached your daily limit of 3 playground runs. Upgrade to Commercial for unlimited runs.", {
                        currentUsage: quota.current,
                        limit: quota.limit,
                        upgradeUrl: "/pricing",
                    });
                }
            }
        }
        next();
    }
    catch (error) {
        // Don't block request if quota check fails
        (0, logger_1.logInfo)("Usage quota check failed", {
            userId,
            error: error instanceof Error ? error.message : String(error),
        });
        next();
    }
}
/**
 * Track usage after successful operation
 */
async function trackUsageAfterOperation(req, res, next) {
    const authReq = req;
    const userId = authReq.userId;
    const tenantId = authReq.tenantId;
    // Store original end function
    const originalEnd = res.end.bind(res);
    // Override end to track usage
    res.end = function (chunk, encoding, cb) {
        // Only track if request was successful
        if (res.statusCode >= 200 && res.statusCode < 300) {
            if (userId && tenantId) {
                // Track reconciliation execution
                if (req.path.includes("/jobs") && req.method === "POST") {
                    (0, tracker_1.trackReconciliationExecution)(userId, tenantId).catch(() => {
                        // Silent fail - tracking is non-critical
                    });
                }
                // Track export creation (fire and forget)
                if (req.path.includes("/exports") && req.method === "POST") {
                    Promise.resolve().then(() => __importStar(require("../services/usage/tracker"))).then(({ trackExportCreation }) => {
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
        }
        else if (cb !== undefined) {
            originalEnd(chunk, cb);
        }
        else {
            originalEnd(chunk);
        }
    };
    next();
}
//# sourceMappingURL=usage-quota.js.map