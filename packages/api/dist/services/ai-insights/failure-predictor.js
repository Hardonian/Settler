"use strict";
/**
 * Failure Prediction Service
 * Predicts when jobs/processes are likely to fail
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictJobFailure = predictJobFailure;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Predict if a job is likely to fail
 */
async function predictJobFailure(jobId) {
    try {
        // Get job details
        const job = await (0, db_1.query)(`SELECT id, source_adapter, target_adapter, user_id, created_at
       FROM jobs
       WHERE id = $1`, [jobId]);
        if (job.length === 0 || !job[0]) {
            return null;
        }
        const jobData = job[0];
        const reasons = [];
        const suggestions = [];
        let confidence = 0;
        // Check 1: Historical success rate for similar jobs
        const similarJobs = await (0, db_1.query)(`SELECT 
        COUNT(*) FILTER (WHERE e.status = 'completed') as success_count,
        COUNT(*) as total_count
      FROM jobs j
      JOIN executions e ON e.job_id = j.id
      WHERE j.source_adapter = $1
        AND j.target_adapter = $2
        AND j.user_id = $3
        AND j.id != $4`, [jobData.source_adapter, jobData.target_adapter, jobData.user_id, jobId]);
        if (similarJobs.length > 0) {
            const successCount = parseInt(similarJobs[0]?.success_count || "0");
            const totalCount = parseInt(similarJobs[0]?.total_count || "0");
            const successRate = totalCount > 0 ? successCount / totalCount : 1;
            if (successRate < 0.5) {
                confidence += 0.4;
                reasons.push(`Low historical success rate (${Math.round(successRate * 100)}%) for similar jobs`);
                suggestions.push("Review adapter configuration and credentials");
            }
        }
        // Check 2: Recent errors for this user
        const recentErrors = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM error_logs
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '1 hour'
         AND severity = 'error'`, [jobData.user_id]);
        const errorCount = parseInt(recentErrors[0]?.count || "0");
        if (errorCount > 5) {
            confidence += 0.3;
            reasons.push(`High recent error rate (${errorCount} errors in last hour)`);
            suggestions.push("Check system health and adapter connections");
        }
        // Check 3: Adapter connection health (if we track this)
        // This would require adapter health monitoring - placeholder for now
        // Adapter health check would go here
        // Check 4: Job age (stale jobs might fail)
        const jobAge = Math.floor((Date.now() - new Date(jobData.created_at).getTime()) / (1000 * 60 * 60));
        if (jobAge > 24) {
            confidence += 0.1;
            reasons.push(`Job is ${jobAge} hours old (may have stale data)`);
            suggestions.push("Consider refreshing job configuration");
        }
        // Check 5: User quota status
        const quotaStatus = await (0, db_1.query)(`SELECT 
        COUNT(*) as usage,
        (SELECT reconciliations_per_month FROM plan_limits WHERE plan_type = (SELECT plan_type FROM users WHERE id = $1)) as limit
      FROM executions e
      JOIN jobs j ON e.job_id = j.id
      WHERE j.user_id = $1
        AND e.created_at >= DATE_TRUNC('month', NOW())`, [jobData.user_id]);
        if (quotaStatus.length > 0) {
            const usage = parseInt(quotaStatus[0]?.usage || "0");
            const limit = parseInt(quotaStatus[0]?.limit || "0");
            if (limit > 0 && usage >= limit) {
                confidence += 0.2;
                reasons.push("User has reached quota limit");
                suggestions.push("Upgrade plan or wait for next billing cycle");
            }
        }
        const willFail = confidence >= 0.5;
        return {
            jobId,
            willFail,
            confidence: Math.min(confidence, 1),
            reasons,
            suggestions,
        };
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to predict job failure", {
            jobId,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
//# sourceMappingURL=failure-predictor.js.map