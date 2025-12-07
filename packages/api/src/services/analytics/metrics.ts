/**
 * Analytics Metrics Service
 * Calculates growth and conversion metrics
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface ActivationMetrics {
  total: number;
  activated: number;
  rate: number;
}

export interface ConversionMetrics {
  trialStarted: number;
  upgradePrompted: number;
  upgradeClicked: number;
  upgradeCompleted: number;
  conversionRate: number;
}

export interface UsageMetrics {
  userId: string;
  reconciliations: number;
  exports: number;
  webhooks: number;
  period: string;
}

/**
 * Get activation rate for a time period
 */
export async function getActivationRate(days: number = 7): Promise<ActivationMetrics> {
  try {
    const result = await query<{
      total: string;
      activated: string;
    }>(
      `SELECT 
        COUNT(DISTINCT u.id) as total,
        COUNT(DISTINCT CASE 
          WHEN op.completion_percentage = 100 THEN u.id 
        END) as activated
      FROM users u
      LEFT JOIN (
        SELECT user_id, 
               CASE 
                 WHEN COUNT(*) FILTER (WHERE completed = true) = 6 THEN 100
                 ELSE (COUNT(*) FILTER (WHERE completed = true)::float / 6 * 100)::int
               END as completion_percentage
        FROM onboarding_progress
        GROUP BY user_id
      ) op ON u.id = op.user_id
      WHERE u.created_at > NOW() - INTERVAL '${days} days'
        AND u.deleted_at IS NULL`,
      []
    );

    if (result.length === 0 || !result[0]) {
      return { total: 0, activated: 0, rate: 0 };
    }

    const total = parseInt(result[0].total || "0");
    const activated = parseInt(result[0].activated || "0");
    const rate = total > 0 ? (activated / total) * 100 : 0;

    return { total, activated, rate: Math.round(rate * 100) / 100 };
  } catch (error) {
    logInfo("Failed to get activation rate", {
      days,
      error: error instanceof Error ? error.message : String(error),
    });
    return { total: 0, activated: 0, rate: 0 };
  }
}

/**
 * Get conversion metrics
 */
export async function getConversionMetrics(days: number = 30): Promise<ConversionMetrics> {
  try {
    const result = await query<{
      trial_started: string;
      upgrade_prompted: string;
      upgrade_clicked: string;
      upgrade_completed: string;
    }>(
      `SELECT 
        COUNT(DISTINCT CASE WHEN u.plan_type = 'trial' THEN u.id END) as trial_started,
        COUNT(DISTINCT CASE WHEN ae.event = 'conversion.upgrade_prompt_shown' THEN ae.user_id END) as upgrade_prompted,
        COUNT(DISTINCT CASE WHEN ae.event = 'conversion.upgrade_clicked' THEN ae.user_id END) as upgrade_clicked,
        COUNT(DISTINCT CASE WHEN ae.event = 'conversion.upgrade_completed' THEN ae.user_id END) as upgrade_completed
      FROM users u
      LEFT JOIN analytics_events ae ON u.id = ae.user_id
      WHERE u.created_at > NOW() - INTERVAL '${days} days'
        AND u.deleted_at IS NULL`,
      []
    );

    if (result.length === 0 || !result[0]) {
      return {
        trialStarted: 0,
        upgradePrompted: 0,
        upgradeClicked: 0,
        upgradeCompleted: 0,
        conversionRate: 0,
      };
    }

    const trialStarted = parseInt(result[0].trial_started || "0");
    const upgradePrompted = parseInt(result[0].upgrade_prompted || "0");
    const upgradeClicked = parseInt(result[0].upgrade_clicked || "0");
    const upgradeCompleted = parseInt(result[0].upgrade_completed || "0");

    const conversionRate = trialStarted > 0 ? (upgradeCompleted / trialStarted) * 100 : 0;

    return {
      trialStarted,
      upgradePrompted,
      upgradeClicked,
      upgradeCompleted,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  } catch (error) {
    logInfo("Failed to get conversion metrics", {
      days,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      trialStarted: 0,
      upgradePrompted: 0,
      upgradeClicked: 0,
      upgradeCompleted: 0,
      conversionRate: 0,
    };
  }
}

/**
 * Get user usage metrics
 */
export async function getUserUsageMetrics(
  userId: string,
  period: "month" | "week" | "day" = "month"
): Promise<UsageMetrics> {
  try {
    const periodStart =
      period === "month"
        ? "DATE_TRUNC('month', NOW())"
        : period === "week"
          ? "DATE_TRUNC('week', NOW())"
          : "DATE_TRUNC('day', NOW())";

    const [reconciliations, exports, webhooks] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM executions e
         JOIN jobs j ON e.job_id = j.id
         WHERE j.user_id = $1
           AND e.started_at >= ${periodStart}`,
        [userId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM exports
         WHERE user_id = $1
           AND created_at >= ${periodStart}`,
        [userId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM webhooks
         WHERE user_id = $1
           AND created_at >= ${periodStart}`,
        [userId]
      ),
    ]);

    return {
      userId,
      reconciliations: parseInt(reconciliations[0]?.count || "0"),
      exports: parseInt(exports[0]?.count || "0"),
      webhooks: parseInt(webhooks[0]?.count || "0"),
      period,
    };
  } catch (error) {
    logInfo("Failed to get user usage metrics", {
      userId,
      period,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      userId,
      reconciliations: 0,
      exports: 0,
      webhooks: 0,
      period,
    };
  }
}

/**
 * Get daily active users
 */
export async function getDailyActiveUsers(date?: Date): Promise<number> {
  try {
    const targetDate = date || new Date();
    const result = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM analytics_events
       WHERE DATE(created_at) = DATE($1)`,
      [targetDate]
    );

    return parseInt(result[0]?.count || "0");
  } catch (error) {
    logInfo("Failed to get daily active users", {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * Get monthly recurring revenue (MRR)
 */
export async function getMonthlyRecurringRevenue(): Promise<number> {
  try {
    const result = await query<{ mrr: string }>(
      `SELECT 
        COUNT(*) FILTER (WHERE plan_type = 'commercial') * 99 as mrr
      FROM users
      WHERE plan_type IN ('commercial', 'enterprise')
        AND deleted_at IS NULL`,
      []
    );

    return parseFloat(result[0]?.mrr || "0");
  } catch (error) {
    logInfo("Failed to get MRR", {
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
