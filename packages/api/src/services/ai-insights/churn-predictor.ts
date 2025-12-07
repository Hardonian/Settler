/**
 * Churn Prediction Service
 * Predicts user churn using heuristic signals
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface ChurnPrediction {
  userId: string;
  riskLevel: "low" | "medium" | "high";
  score: number; // 0-100
  signals: string[];
  interventions: string[];
}

/**
 * Predict churn for a user
 */
export async function predictChurn(userId: string): Promise<ChurnPrediction | null> {
  try {
    const signals: string[] = [];
    const interventions: string[] = [];
    let score = 0;

    // Get user data
    const user = await query<{
      id: string;
      plan_type: string;
      created_at: Date;
    }>(
      `SELECT id, plan_type, created_at
       FROM users
       WHERE id = $1
         AND deleted_at IS NULL`,
      [userId]
    );

    if (user.length === 0 || !user[0]) {
      return null;
    }

    const userData = user[0];
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Signal 1: Login frequency decline
    const loginFrequency = await query<{
      recent_logins: string;
      previous_logins: string;
    }>(
      `SELECT 
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_logins,
        COUNT(DISTINCT DATE(created_at)) FILTER (WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') as previous_logins
      FROM analytics_events
      WHERE user_id = $1
        AND event = 'user.login'`,
      [userId]
    );

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
    const featureUsage = await query<{
      recent_features: string;
      previous_features: string;
    }>(
      `SELECT 
        COUNT(DISTINCT event) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_features,
        COUNT(DISTINCT event) FILTER (WHERE created_at > NOW() - INTERVAL '14 days' AND created_at <= NOW() - INTERVAL '7 days') as previous_features
      FROM analytics_events
      WHERE user_id = $1
        AND event LIKE 'feature.%'`,
      [userId]
    );

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
        const upgradeEvents = await query<{ count: string }>(
          `SELECT COUNT(*) as count
           FROM analytics_events
           WHERE user_id = $1
             AND event LIKE 'conversion.upgrade%'`,
          [userId]
        );

        if (parseInt(upgradeEvents[0]?.count || "0") === 0) {
          score += 30;
          signals.push(`Trial expires in ${daysUntilExpiration} days, no upgrade attempt`);
          interventions.push("Send urgent upgrade email with trial benefits");
        }
      }
    }

    // Signal 4: High error rate
    const errorRate = await query<{
      error_count: string;
      total_requests: string;
    }>(
      `SELECT 
        COUNT(*) FILTER (WHERE severity = 'error') as error_count,
        COUNT(*) as total_requests
      FROM error_logs
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );

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
    const lastActivity = await query<{ last_activity: Date | null }>(
      `SELECT MAX(created_at) as last_activity
       FROM analytics_events
       WHERE user_id = $1`,
      [userId]
    );

    const isActivated = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM onboarding_progress
       WHERE user_id = $1
         AND completed = true
         AND step IN ('first_reconciliation', 'first_export')`,
      [userId]
    );

    if (parseInt(isActivated[0]?.count || "0") > 0 && lastActivity[0]?.last_activity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivity[0].last_activity).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity >= 14) {
        score += 20;
        signals.push(`Inactive for ${daysSinceActivity} days after activation`);
        interventions.push("Send re-engagement email with success stories");
      }
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (score >= 60) {
      riskLevel = "high";
    } else if (score >= 30) {
      riskLevel = "medium";
    }

    return {
      userId,
      riskLevel,
      score: Math.min(score, 100),
      signals,
      interventions,
    };
  } catch (error) {
    logInfo("Failed to predict churn", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
