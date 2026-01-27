"use strict";
/**
 * Friction Point Detection Service
 * Identifies where users struggle (errors, slow operations, retries)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyFrictionPoints = identifyFrictionPoints;
exports.getEndpointFriction = getEndpointFriction;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Identify friction points in the system
 */
async function identifyFrictionPoints(timeWindow = "week") {
    try {
        const interval = timeWindow === "day" ? "1 day" : timeWindow === "week" ? "7 days" : "30 days";
        const frictionPoints = [];
        // 1. Analyze error logs by endpoint
        const errorLogs = await (0, db_1.query)(`SELECT 
        COALESCE(
          CASE 
            WHEN path LIKE '/api/v1/%' THEN '/api/v1/*'
            WHEN path LIKE '/api/v2/%' THEN '/api/v2/*'
            ELSE path
          END,
          'unknown'
        ) as endpoint,
        error_message,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as user_count,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen
      FROM error_logs
      WHERE created_at > NOW() - INTERVAL '${interval}'
        AND severity = 'error'
      GROUP BY endpoint, error_message
      HAVING COUNT(*) >= 5
      ORDER BY COUNT(*) DESC
      LIMIT 20`, []);
        for (const log of errorLogs) {
            const frequency = parseInt(log.count || "0");
            const affectedUsers = parseInt(log.user_count || "0");
            const severity = frequency > 100 ? "high" : frequency > 20 ? "medium" : "low";
            // Generate suggested fix based on error pattern
            let suggestedFix = "Review error logs and investigate root cause.";
            if (log.error_message?.toLowerCase().includes("timeout")) {
                suggestedFix = "Increase timeout settings or add retry logic with exponential backoff.";
            }
            else if (log.error_message?.toLowerCase().includes("connection")) {
                suggestedFix = "Check adapter connection health and credentials. Add connection pooling.";
            }
            else if (log.error_message?.toLowerCase().includes("validation")) {
                suggestedFix = "Improve input validation and provide clearer error messages to users.";
            }
            else if (log.error_message?.toLowerCase().includes("permission")) {
                suggestedFix = "Review permission checks and ensure proper authorization middleware.";
            }
            else if (log.error_message?.toLowerCase().includes("quota")) {
                suggestedFix = "Review quota limits and provide clearer upgrade paths for users.";
            }
            frictionPoints.push({
                endpoint: log.endpoint || "unknown",
                issue: log.error_message || "Unknown error",
                frequency,
                affectedUsers,
                severity,
                suggestedFix,
                firstSeen: log.first_seen,
                lastSeen: log.last_seen,
            });
        }
        // 2. Analyze slow API calls (if we have performance logs)
        // This would require a performance_logs table or similar
        // For now, we'll skip this and add it later
        // 3. Analyze high retry rates (if we track retries)
        // This would require retry tracking in the system
        // For now, we'll skip this and add it later
        // Sort by severity and frequency
        frictionPoints.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[b.severity] - severityOrder[a.severity];
            }
            return b.frequency - a.frequency;
        });
        const totalIssues = frictionPoints.length;
        const topIssue = frictionPoints[0] || null;
        // Generate summary
        const highSeverityCount = frictionPoints.filter((p) => p.severity === "high").length;
        const summary = `Found ${totalIssues} friction points in the last ${timeWindow}. ${highSeverityCount} high-severity issues detected. Top issue: ${topIssue?.issue || "None"}.`;
        return {
            timeWindow,
            frictionPoints,
            totalIssues,
            topIssue,
            summary,
        };
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to identify friction points", {
            timeWindow,
            error: error instanceof Error ? error.message : String(error),
        });
        return {
            timeWindow,
            frictionPoints: [],
            totalIssues: 0,
            topIssue: null,
            summary: "Failed to analyze friction points.",
        };
    }
}
/**
 * Get friction points for a specific endpoint
 */
async function getEndpointFriction(endpoint, days = 7) {
    try {
        const result = await identifyFrictionPoints(days >= 30 ? "month" : days >= 7 ? "week" : "day");
        return result.frictionPoints.filter((p) => p.endpoint === endpoint);
    }
    catch (error) {
        (0, logger_1.logInfo)("Failed to get endpoint friction", {
            endpoint,
            days,
            error: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}
//# sourceMappingURL=friction-detector.js.map