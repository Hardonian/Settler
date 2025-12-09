"use strict";
/**
 * Early Warning Signal Detection Service
 * Detects early signals that indicate a user might churn or need help
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningSeverity = void 0;
exports.detectEarlyWarningSignals = detectEarlyWarningSignals;
exports.getAllWarningSignals = getAllWarningSignals;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const tracker_1 = require("../onboarding/tracker");
var WarningSeverity;
(function (WarningSeverity) {
    WarningSeverity["LOW"] = "low";
    WarningSeverity["MEDIUM"] = "medium";
    WarningSeverity["HIGH"] = "high";
})(WarningSeverity || (exports.WarningSeverity = WarningSeverity = {}));
/**
 * Detect early warning signals for a user
 */
async function detectEarlyWarningSignals(userId) {
    try {
        const signals = [];
        // 1. Check onboarding completion after 7 days
        const user = await (0, db_1.query)(`SELECT created_at, plan_type
       FROM users
       WHERE id = $1
         AND deleted_at IS NULL`, [userId]);
        if (user.length === 0) {
            return [];
        }
        const userCreatedAt = user[0]?.created_at;
        const daysSinceSignup = userCreatedAt
            ? Math.floor((Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        if (daysSinceSignup >= 7) {
            const progress = await (0, tracker_1.getOnboardingProgress)(userId);
            if (progress && progress.completionPercentage < 100) {
                signals.push({
                    userId,
                    signal: "onboarding_incomplete_7_days",
                    severity: WarningSeverity.MEDIUM,
                    detectedAt: new Date(),
                    description: `Onboarding incomplete after ${daysSinceSignup} days. Completion: ${progress.completionPercentage}%.`,
                    suggestedAction: "Send help email with onboarding checklist and support contact.",
                    metadata: {
                        completionPercentage: progress.completionPercentage,
                        daysSinceSignup,
                    },
                });
            }
        }
        // 2. Check for first error after successful usage
        const hasSuccessfulUsage = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM executions e
       JOIN jobs j ON e.job_id = j.id
       WHERE j.user_id = $1
         AND e.status = 'completed'
         AND e.created_at < NOW() - INTERVAL '1 day'`, [userId]);
        const hasRecentErrors = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM error_logs
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '1 day'
         AND severity = 'error'`, [userId]);
        if (parseInt(hasSuccessfulUsage[0]?.count || "0") > 0 &&
            parseInt(hasRecentErrors[0]?.count || "0") > 0) {
            signals.push({
                userId,
                signal: "first_error_after_success",
                severity: WarningSeverity.MEDIUM,
                detectedAt: new Date(),
                description: "User experienced errors after previously successful usage. This may indicate a configuration issue or system change.",
                suggestedAction: "Send troubleshooting email with common solutions and support contact.",
                metadata: {
                    errorCount: parseInt(hasRecentErrors[0]?.count || "0"),
                },
            });
        }
        // 3. Check for quota exceeded (feature access denied)
        const quotaExceeded = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM analytics_events
       WHERE user_id = $1
         AND event = 'usage.quota_exceeded'
         AND created_at > NOW() - INTERVAL '7 days'`, [userId]);
        if (parseInt(quotaExceeded[0]?.count || "0") > 0) {
            signals.push({
                userId,
                signal: "quota_exceeded",
                severity: WarningSeverity.HIGH,
                detectedAt: new Date(),
                description: "User has hit usage quota limits. This may cause frustration and churn.",
                suggestedAction: "Send upgrade email highlighting benefits of higher tier and current usage stats.",
                metadata: {
                    quotaExceededCount: parseInt(quotaExceeded[0]?.count || "0"),
                },
            });
        }
        // 4. Check for no activity after activation
        const lastActivity = await (0, db_1.query)(`SELECT MAX(created_at) as last_activity
       FROM analytics_events
       WHERE user_id = $1`, [userId]);
        const isActivated = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM onboarding_progress
       WHERE user_id = $1
         AND completed = true
         AND step IN ('first_reconciliation', 'first_export')`, [userId]);
        if (parseInt(isActivated[0]?.count || "0") > 0 && lastActivity[0]?.last_activity) {
            const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity[0].last_activity).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceActivity >= 14) {
                signals.push({
                    userId,
                    signal: "inactive_after_activation",
                    severity: WarningSeverity.HIGH,
                    detectedAt: new Date(),
                    description: `User was activated but has been inactive for ${daysSinceActivity} days. High churn risk.`,
                    suggestedAction: "Send re-engagement email with success stories, new features, or special offer.",
                    metadata: {
                        daysSinceActivity,
                    },
                });
            }
        }
        // 5. Check for trial expiration approaching without upgrade
        if (user[0]?.plan_type === "trial") {
            const daysUntilExpiration = 30 - daysSinceSignup;
            if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
                // Check if user has upgrade events
                const upgradeEvents = await (0, db_1.query)(`SELECT COUNT(*) as count
           FROM analytics_events
           WHERE user_id = $1
             AND event LIKE 'conversion.upgrade%'`, [userId]);
                if (parseInt(upgradeEvents[0]?.count || "0") === 0) {
                    signals.push({
                        userId,
                        signal: "trial_expiring_no_upgrade",
                        severity: WarningSeverity.HIGH,
                        detectedAt: new Date(),
                        description: `Trial expires in ${daysUntilExpiration} days. No upgrade attempt detected.`,
                        suggestedAction: "Send urgent upgrade email with trial benefits summary and limited-time offer.",
                        metadata: {
                            daysUntilExpiration,
                        },
                    });
                }
            }
        }
        // 6. Check for high error rate
        const errorRate = await (0, db_1.query)(`SELECT 
        COUNT(*) FILTER (WHERE severity = 'error') as error_count,
        COUNT(*) as total_requests
       FROM error_logs
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '7 days'`, [userId]);
        const errors = parseInt(errorRate[0]?.error_count || "0");
        const total = parseInt(errorRate[0]?.total_requests || "0");
        const errorPercentage = total > 0 ? (errors / total) * 100 : 0;
        if (errorPercentage > 20 && errors >= 5) {
            signals.push({
                userId,
                signal: "high_error_rate",
                severity: WarningSeverity.MEDIUM,
                detectedAt: new Date(),
                description: `User has ${Math.round(errorPercentage)}% error rate in the last 7 days (${errors} errors).`,
                suggestedAction: "Send troubleshooting email with error summary and support contact. Consider reaching out directly.",
                metadata: {
                    errorCount: errors,
                    errorPercentage: Math.round(errorPercentage),
                },
            });
        }
        // Sort by severity
        signals.sort((a, b) => {
            const severityOrder = {
                [WarningSeverity.HIGH]: 3,
                [WarningSeverity.MEDIUM]: 2,
                [WarningSeverity.LOW]: 1,
            };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
        return signals;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to detect early warning signals", {
            userId,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
/**
 * Get all users with active warning signals
 */
async function getAllWarningSignals(severity) {
    try {
        // Get all active users
        const users = await (0, db_1.query)(`SELECT id
       FROM users
       WHERE deleted_at IS NULL
       LIMIT 1000`, []);
        const allSignals = [];
        for (const user of users) {
            const signals = await detectEarlyWarningSignals(user.id);
            const filtered = severity ? signals.filter((s) => s.severity === severity) : signals;
            allSignals.push(...filtered);
        }
        // Sort by severity and detection time
        allSignals.sort((a, b) => {
            const severityOrder = {
                [WarningSeverity.HIGH]: 3,
                [WarningSeverity.MEDIUM]: 2,
                [WarningSeverity.LOW]: 1,
            };
            if (severityOrder[b.severity] !== severityOrder[a.severity]) {
                return severityOrder[b.severity] - severityOrder[a.severity];
            }
            return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
        });
        return allSignals;
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to get all warning signals", {
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
//# sourceMappingURL=early-warning.js.map