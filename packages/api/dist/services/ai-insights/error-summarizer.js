"use strict";
/**
 * Error Summary Generator
 * Generates human-readable error summaries for support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeError = summarizeError;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Summarize an error for support
 */
async function summarizeError(errorId, traceId) {
    try {
        // Get error details
        const error = await (0, db_1.query)(`SELECT id, error_message, path, user_id, created_at, severity, trace_id
       FROM error_logs
       WHERE id = $1`, [errorId]);
        if (error.length === 0 || !error[0]) {
            return null;
        }
        const errorData = error[0];
        const searchTraceId = traceId || errorData.trace_id;
        // Get related logs (same trace_id)
        const relatedLogs = searchTraceId
            ? await (0, db_1.query)(`SELECT created_at, message, severity
           FROM error_logs
           WHERE trace_id = $1
             AND created_at BETWEEN $2 - INTERVAL '5 minutes' AND $2 + INTERVAL '5 minutes'
           ORDER BY created_at ASC
           LIMIT 20`, [searchTraceId, errorData.created_at])
            : [];
        // Build timeline
        const timeline = [];
        for (const log of relatedLogs) {
            timeline.push({
                time: log.created_at,
                event: `${log.severity}: ${log.message}`,
            });
        }
        // Count affected users and occurrences
        const affected = await (0, db_1.query)(`SELECT 
        COUNT(DISTINCT user_id) as user_count,
        COUNT(*) as total_count
      FROM error_logs
      WHERE error_message = $1
        AND created_at > NOW() - INTERVAL '7 days'`, [errorData.error_message]);
        const userCount = parseInt(affected[0]?.user_count || "0");
        const totalCount = parseInt(affected[0]?.total_count || "0");
        // Find similar errors
        const similarErrors = await (0, db_1.query)(`SELECT COUNT(*) as count
       FROM error_logs
       WHERE error_message ILIKE '%' || $1 || '%'
         AND id != $2
         AND created_at > NOW() - INTERVAL '7 days'`, [errorData.error_message?.split(" ")[0] || "", errorId]);
        const similarCount = parseInt(similarErrors[0]?.count || "0");
        // Generate summary
        const summary = `Error occurred at ${errorData.path || "unknown endpoint"}: ${errorData.error_message}`;
        // Determine root cause
        let rootCause = "Unknown cause. Requires investigation.";
        const message = errorData.error_message?.toLowerCase() || "";
        if (message.includes("timeout")) {
            rootCause = "Request timeout - likely due to slow external API or network issues.";
        }
        else if (message.includes("connection")) {
            rootCause = "Connection error - adapter credentials may be invalid or service unavailable.";
        }
        else if (message.includes("validation")) {
            rootCause = "Input validation failed - user provided invalid data.";
        }
        else if (message.includes("permission") || message.includes("unauthorized")) {
            rootCause = "Authorization failure - user lacks required permissions.";
        }
        else if (message.includes("quota") || message.includes("limit")) {
            rootCause = "Quota exceeded - user has reached usage limits.";
        }
        else if (message.includes("not found")) {
            rootCause = "Resource not found - ID may be invalid or resource deleted.";
        }
        else if (message.includes("database")) {
            rootCause = "Database error - connection issue or query problem.";
        }
        // Generate suggested fix
        let suggestedFix = "Review error logs and investigate root cause.";
        if (rootCause.includes("timeout")) {
            suggestedFix =
                "1. Check external API status\n2. Increase timeout settings\n3. Add retry logic with exponential backoff";
        }
        else if (rootCause.includes("connection")) {
            suggestedFix =
                "1. Verify adapter credentials\n2. Check adapter service status\n3. Test connection manually";
        }
        else if (rootCause.includes("validation")) {
            suggestedFix =
                "1. Review input validation rules\n2. Provide clearer error messages\n3. Check API documentation";
        }
        else if (rootCause.includes("authorization")) {
            suggestedFix =
                "1. Review user permissions\n2. Check RBAC configuration\n3. Verify token validity";
        }
        else if (rootCause.includes("quota")) {
            suggestedFix =
                "1. Check user's current usage\n2. Review plan limits\n3. Suggest upgrade if needed";
        }
        else if (rootCause.includes("not found")) {
            suggestedFix =
                "1. Verify resource ID\n2. Check if resource was deleted\n3. Review data consistency";
        }
        else if (rootCause.includes("database")) {
            suggestedFix =
                "1. Check database connection\n2. Review query performance\n3. Check connection pooling";
        }
        return {
            errorId,
            summary,
            rootCause,
            affected: {
                users: userCount,
                count: totalCount,
            },
            timeline,
            suggestedFix,
            similarErrors: similarCount,
        };
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to summarize error", {
            errorId,
            traceId,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}
//# sourceMappingURL=error-summarizer.js.map