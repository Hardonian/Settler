/**
 * Pattern Detection Service
 * Detects usage patterns, feature dependencies, and user behavior clusters
 */

import { query } from "../../db";
import { logInfo } from "../../utils/logger";

export interface FeatureDependency {
  featureA: string;
  featureB: string;
  correlation: number;
  sampleSize: number;
}

export interface UserCluster {
  clusterName: string;
  userIds: string[];
  characteristics: string[];
  recommendations: string[];
  size: number;
}

/**
 * Detect feature dependencies (which features users use together)
 */
export async function detectFeatureDependencies(days: number = 30): Promise<FeatureDependency[]> {
  try {
    // Extract feature usage from analytics events
    // Features are identified by event names like: feature.accessed, usage.metric, etc.
    const featureEvents = await query<{
      user_id: string;
      feature: string;
    }>(
      `SELECT DISTINCT user_id, 
        CASE 
          WHEN event LIKE 'feature.%' THEN SPLIT_PART(event, '.', 2)
          WHEN event LIKE 'usage.%' THEN 'usage'
          WHEN event LIKE 'onboarding.%' THEN 'onboarding'
          WHEN event LIKE 'conversion.%' THEN 'conversion'
          ELSE event
        END as feature
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '${days} days'
        AND (event LIKE 'feature.%' OR event LIKE 'usage.%' OR event LIKE 'onboarding.%')
      ORDER BY user_id, feature`,
      []
    );

    // Build co-occurrence matrix
    const userFeatures = new Map<string, Set<string>>();
    for (const row of featureEvents) {
      if (!row.user_id || !row.feature) continue;
      if (!userFeatures.has(row.user_id)) {
        userFeatures.set(row.user_id, new Set());
      }
      userFeatures.get(row.user_id)!.add(row.feature);
    }

    // Calculate correlations
    const features = new Set<string>();
    for (const featureSet of userFeatures.values()) {
      for (const feature of featureSet) {
        features.add(feature);
      }
    }

    const dependencies: FeatureDependency[] = [];
    const featureArray = Array.from(features);

    for (let i = 0; i < featureArray.length; i++) {
      for (let j = i + 1; j < featureArray.length; j++) {
        const featureA = featureArray[i]!;
        const featureB = featureArray[j]!;

        let coOccurrence = 0;
        let featureACount = 0;
        let featureBCount = 0;

        for (const featureSet of userFeatures.values()) {
          const hasA = featureSet.has(featureA);
          const hasB = featureSet.has(featureB);

          if (hasA) featureACount++;
          if (hasB) featureBCount++;
          if (hasA && hasB) coOccurrence++;
        }

        // Calculate correlation (Jaccard similarity)
        const union = featureACount + featureBCount - coOccurrence;
        const correlation = union > 0 ? coOccurrence / union : 0;

        // Only include correlations > 0.5
        if (correlation > 0.5 && coOccurrence >= 5) {
          if (featureA && featureB) {
            dependencies.push({
              featureA,
              featureB,
              correlation: Math.round(correlation * 1000) / 1000,
              sampleSize: coOccurrence,
            });
          }
        }
      }
    }

    // Sort by correlation
    dependencies.sort((a, b) => b.correlation - a.correlation);

    return dependencies;
  } catch (error) {
    logInfo("Failed to detect feature dependencies", {
      days,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Cluster users by behavior patterns
 */
export async function clusterUsersByBehavior(): Promise<UserCluster[]> {
  try {
    // Get user behavior metrics
    const userMetrics = await query<{
      user_id: string;
      reconciliation_count: string;
      adapter_count: string;
      error_count: string;
      success_rate: string;
      feature_access_count: string;
      days_active: string;
    }>(
      `SELECT 
        u.id as user_id,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as reconciliation_count,
        COUNT(DISTINCT j.source_adapter) + COUNT(DISTINCT j.target_adapter) as adapter_count,
        COUNT(DISTINCT el.id) as error_count,
        CASE 
          WHEN COUNT(DISTINCT e.id) > 0 
          THEN (COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')::float / COUNT(DISTINCT e.id) * 100)::int
          ELSE 0
        END as success_rate,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae.event LIKE 'feature.%') as feature_access_count,
        EXTRACT(DAY FROM (NOW() - u.created_at))::int as days_active
      FROM users u
      LEFT JOIN jobs j ON j.user_id = u.id
      LEFT JOIN executions e ON e.job_id = j.id
      LEFT JOIN error_logs el ON el.user_id = u.id
      LEFT JOIN analytics_events ae ON ae.user_id = u.id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id`,
      []
    );

    const clusters: UserCluster[] = [];
    const powerUsers: string[] = [];
    const explorers: string[] = [];
    const minimalists: string[] = [];
    const stuckUsers: string[] = [];

    for (const metric of userMetrics) {
      const reconciliations = parseInt(metric.reconciliation_count || "0");
      const adapters = parseInt(metric.adapter_count || "0");
      const errors = parseInt(metric.error_count || "0");
      const successRate = parseInt(metric.success_rate || "0");
      const features = parseInt(metric.feature_access_count || "0");

      if (reconciliations > 50 && adapters > 2 && successRate > 80) {
        powerUsers.push(metric.user_id);
      } else if (features > 10 && reconciliations < 10) {
        explorers.push(metric.user_id);
      } else if (reconciliations > 0 && adapters === 1 && features < 5) {
        minimalists.push(metric.user_id);
      } else if (errors > 5 && successRate < 50) {
        stuckUsers.push(metric.user_id);
      }
    }

    if (powerUsers.length > 0) {
      clusters.push({
        clusterName: "Power Users",
        userIds: powerUsers,
        characteristics: [
          "High reconciliation volume (>50)",
          "Multiple adapters (>2)",
          "High success rate (>80%)",
        ],
        recommendations: [
          "Offer advanced features",
          "Provide priority support",
          "Consider enterprise tier",
        ],
        size: powerUsers.length,
      });
    }

    if (explorers.length > 0) {
      clusters.push({
        clusterName: "Explorers",
        userIds: explorers,
        characteristics: [
          "Many feature accesses (>10)",
          "Low completion rate",
          "High exploration, low execution",
        ],
        recommendations: ["Provide guided tutorials", "Add demo mode", "Send activation emails"],
        size: explorers.length,
      });
    }

    if (minimalists.length > 0) {
      clusters.push({
        clusterName: "Minimalists",
        userIds: minimalists,
        characteristics: ["Single adapter usage", "Basic features only", "Focused workflow"],
        recommendations: [
          "Show value of additional adapters",
          "Highlight advanced features",
          "Provide use case examples",
        ],
        size: minimalists.length,
      });
    }

    if (stuckUsers.length > 0) {
      clusters.push({
        clusterName: "Stuck Users",
        userIds: stuckUsers,
        characteristics: ["High error rate", "Low success rate (<50%)", "Needs help"],
        recommendations: [
          "Send troubleshooting guide",
          "Offer support call",
          "Review adapter configuration",
        ],
        size: stuckUsers.length,
      });
    }

    return clusters;
  } catch (error) {
    logInfo("Failed to cluster users by behavior", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Detect incomplete workflows
 */
export async function detectIncompleteWorkflows(userId?: string): Promise<
  Array<{
    userId: string;
    workflowType: string;
    dropOffStep: string;
    completionRate: number;
  }>
> {
  try {
    const incomplete: Array<{
      userId: string;
      workflowType: string;
      dropOffStep: string;
      completionRate: number;
    }> = [];

    // Detect incomplete reconciliation workflows
    const incompleteReconciliations = await query<{
      user_id: string;
      job_count: string;
      executed_count: string;
      completed_count: string;
    }>(
      `SELECT 
        j.user_id,
        COUNT(DISTINCT j.id) as job_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.id IS NOT NULL) as executed_count,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed') as completed_count
      FROM jobs j
      LEFT JOIN executions e ON e.job_id = j.id
      ${userId ? "WHERE j.user_id = $1" : ""}
      GROUP BY j.user_id
      HAVING COUNT(DISTINCT j.id) > COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')
      ${userId ? "" : "LIMIT 100"}`,
      userId ? [userId] : []
    );

    for (const row of incompleteReconciliations) {
      const jobs = parseInt(row.job_count || "0");
      const executed = parseInt(row.executed_count || "0");
      const completed = parseInt(row.completed_count || "0");

      let dropOffStep = "job_created";
      if (executed === 0) {
        dropOffStep = "job_execution";
      } else if (completed < executed) {
        dropOffStep = "reconciliation_completion";
      }

      const completionRate = jobs > 0 ? (completed / jobs) * 100 : 0;

      incomplete.push({
        userId: row.user_id,
        workflowType: "reconciliation",
        dropOffStep,
        completionRate: Math.round(completionRate * 100) / 100,
      });
    }

    return incomplete;
  } catch (error) {
    logInfo("Failed to detect incomplete workflows", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
