"use strict";
/**
 * Churn Prediction Service
 * Predicts user churn using heuristic signals
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictChurn = predictChurn;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Predict churn for a user
 */
async function predictChurn(userId) {
    try {
        const signals = [];
        const interventions = [];
        let score = 0;
        // Get user data
        const user = await (0, db_1.query)(`SELECT id, plan_type, created_at
       FROM users
       WHERE id = $1
         AND deleted_at IS NULL`, [userId]);
        if (user.length === 0 || !user[0]) {
            return null;
        }
        const userData = user[0];
        const daysSinceSignup = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24));
        // Signal 1: Login frequency decline
        const loginFrequency = await (0, db_1.query)(`SELECT 
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_logins,
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') as previous_logins
      FROM analytics_events
      WHERE user_id = $1
        AND event = 'user.login'`, [userId]);
        if (loginFrequency.length > 0) {
            const recent = parseInt(loginFrequency[0]?.recent_logins || "0");
            const previous = parseInt(loginFrequency[0]?.previous_logins || "0");
            if (previous > 0 && recent < previous * 0.5) {
                score += 20;
                signals.push("Login frequency declined by >50%");
                interventions.push("Send re-engagement email with new features");
            }
        }
        // Signal 2: Feature usage decline
        const featureUsage = await (0, db_1.query)(`SELECT 
        COUNT(DISTINCT event) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_features,
        COUNT(DISTINCT event) FILTER (WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') as previous_features
      FROM analytics_events
      WHERE user_id = $1
        AND event LIKE 'feature.%'`, [userId]);
        if (featureUsage.length > 0) {
            const recent = parseInt(featureUsage[0]?.recent_features || "0");
            const previous = parseInt(featureUsage[0]?.previous_features || "0");
            if (previous > 0 && recent < previous * 0.5) {
                score += 15;
                signals.push("Feature usage declined by >50%");
                interventions.push("Show feature highlights and tutorials");
            }
        }
        // Signal 3: Trial expiration without upgrade
        if (userData && userData.plan_type === "trial") {
            const daysUntilExpiration = 30 - daysSinceSignup;
            if (daysUntilExpiration <= 3 && daysUntilExpiration > 0) {
                const upgradeEvents = await (0, db_1.query)(`SELECT COUNT(*) as count
           FROM analytics_events
           WHERE user_id = $1
             AND event LIKE 'conversion.upgrade%'`, [userId]);
                if (parseInt(upgradeEvents[0]?.count || "0") === 0) {
                    score += 30;
                    signals.push(`Trial expires in ${daysUntilExpiration} days, no upgrade attempt`);
                    interventions.push("Send urgent upgrade email with trial benefits");
                }
            }
        }
        // Signal 4: High error rate
        const errorRate = await (0, db_1.query)(`SELECT 
        COUNT(*) FILTER (WHERE severity = 'error') as error_count,
        COUNT(*) as total_requests
      FROM error_logs
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '7 days'`, [userId]);
        if (errorRate.length > 0) {
            const errors = parseInt(errorRate[0]?.error_count || "0");
            const total = parseInt(errorRate[0]?.total_requests || "0");
            const errorPercentage = total > 0 ? (errors / total) * 100 : 0;
            if (errorPercentage > 20 && errors >= 5) {
                score += 15;
                signals.push(`High error rate (${Math.round(errorPercentage)}%)`);
                interventions.push("Send troubleshooting guide and offer support call");
            }
        }
        // Signal 5: No activity after activation
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
                score += 20;
                signals.push(`Inactive for ${daysSinceActivity} days after activation`);
                interventions.push("Send re-engagement email with success stories");
            }
        }
        // Determine risk level
        let riskLevel = "low";
        if (score >= 60) {
            riskLevel = "high";
        }
        else if (score >= 30) {
            riskLevel = "medium";
        }
        return {
            userId,
            riskLevel,
            score: Math.min(score, 100),
            signals,
            interventions,
        };
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to predict churn", {
            userId,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
//# sourceMappingURL=churn-predictor.js.map