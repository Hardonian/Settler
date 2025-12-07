/**
 * Error Pattern Recognition Service
 * Automatically categorizes and summarizes error patterns
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface ErrorPattern {
  pattern: string;
  count: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  suggestedFix: string;
  relatedErrors: string[];
  severity: "low" | "medium" | "high";
}

/**
 * Analyze error patterns
 */
export async function analyzeErrorPatterns(
  timeWindow: "hour" | "day" | "week" = "day"
): Promise<ErrorPattern[]> {
  try {
    const interval = timeWindow === "hour" ? "1 hour" : timeWindow === "day" ? "1 day" : "7 days";

    // Get errors grouped by similar messages
    const errors = await query<{
      error_message: string;
      count: string;
      user_count: string;
      first_seen: Date;
      last_seen: Date;
      endpoint: string | null;
    }>(
      `SELECT 
        error_message,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as user_count,
        MIN(created_at) as first_seen,
        MAX(created_at) as last_seen,
        MODE() WITHIN GROUP (ORDER BY path) as endpoint
      FROM error_logs
      WHERE created_at > NOW() - INTERVAL '${interval}'
        AND severity = 'error'
      GROUP BY error_message
      HAVING COUNT(*) >= 3
      ORDER BY COUNT(*) DESC
      LIMIT 50`,
      []
    );

    const patterns: ErrorPattern[] = [];

    for (const error of errors) {
      const count = parseInt(error.count || "0");
      const affectedUsers = parseInt(error.user_count || "0");
      const message = error.error_message || "";

      // Categorize error pattern
      let pattern = "unknown";
      let suggestedFix = "Review error logs and investigate root cause.";
      let severity: "low" | "medium" | "high" = "low";

      if (message.toLowerCase().includes("timeout")) {
        pattern = "timeout";
        suggestedFix = "Increase timeout settings or add retry logic with exponential backoff.";
        severity = count > 20 ? "high" : "medium";
      } else if (
        message.toLowerCase().includes("connection") ||
        message.toLowerCase().includes("connect")
      ) {
        pattern = "connection_error";
        suggestedFix = "Check adapter connection health and credentials. Add connection pooling.";
        severity = count > 20 ? "high" : "medium";
      } else if (
        message.toLowerCase().includes("validation") ||
        message.toLowerCase().includes("invalid")
      ) {
        pattern = "validation_error";
        suggestedFix = "Improve input validation and provide clearer error messages to users.";
        severity = "medium";
      } else if (
        message.toLowerCase().includes("permission") ||
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("forbidden")
      ) {
        pattern = "authorization_error";
        suggestedFix = "Review permission checks and ensure proper authorization middleware.";
        severity = "medium";
      } else if (
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("limit")
      ) {
        pattern = "quota_exceeded";
        suggestedFix = "Review quota limits and provide clearer upgrade paths for users.";
        severity = "low";
      } else if (message.toLowerCase().includes("not found")) {
        pattern = "not_found";
        suggestedFix = "Check resource existence and ID validation.";
        severity = "low";
      } else if (message.toLowerCase().includes("database")) {
        pattern = "database_error";
        suggestedFix = "Check database connection, query performance, and connection pooling.";
        severity = count > 10 ? "high" : "medium";
      } else {
        // Try to extract a pattern from the message
        const words = message.toLowerCase().split(/\s+/);
        if (words.length > 0) {
          pattern = words.slice(0, 3).join("_");
        }
      }

      // Find related errors (similar messages)
      const relatedErrors: string[] = [];
      if (count > 5) {
        const related = await query<{ error_message: string }>(
          `SELECT DISTINCT error_message
           FROM error_logs
           WHERE created_at > NOW() - INTERVAL '${interval}'
             AND severity = 'error'
             AND error_message != $1
             AND (
               error_message ILIKE '%' || $2 || '%'
               OR error_message ILIKE '%' || $3 || '%'
             )
           LIMIT 5`,
          [message, pattern, message.split(" ")[0] || ""]
        );
        relatedErrors.push(...related.map((r) => r.error_message));
      }

      if (error.first_seen && error.last_seen && error.error_message) {
        patterns.push({
          pattern,
          count,
          affectedUsers,
          firstSeen: error.first_seen,
          lastSeen: error.last_seen,
          suggestedFix,
          relatedErrors,
          severity,
        });
      }
    }

    // Sort by severity and count
    patterns.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.count - a.count;
    });

    return patterns;
  } catch (error) {
    logInfo("Failed to analyze error patterns", {
      timeWindow,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
