/**
 * Lifecycle Automation System
 * Manages user journey: activation → engagement → retention → expansion
 */

import { createClient } from "@/lib/supabase/client";

export type LifecycleStage =
  | "signup"
  | "activation"
  | "engaged"
  | "retention"
  | "expansion"
  | "at_risk"
  | "churned";

export interface LifecycleTransition {
  from: LifecycleStage;
  to: LifecycleStage;
  trigger: string;
  metadata?: Record<string, unknown>;
}

interface UserLifecycle {
  user_id: string;
  current_stage?: LifecycleStage;
  activated_at?: string | null;
  first_successful_setup_at?: string | null;
  last_active_at?: string;
  churn_risk_score?: number;
  churn_risk_reasons?: string[];
  expansion_opportunity_score?: number;
  updated_at?: string;
}

interface UserActivityMetrics {
  active_last_7_days?: boolean;
  active_days_last_30?: number;
  has_upgraded?: boolean;
  using_premium_features?: boolean;
  days_since_last_activity?: number;
  explicitly_cancelled?: boolean;
  total_jobs_created?: number;
  has_payment_issues?: boolean;
  usage_percentage?: number;
  integration_count?: number;
  viewed_enterprise_features?: boolean;
}

/**
 * Transition user to new lifecycle stage
 */
export async function transitionLifecycleStage(
  userId: string,
  newStage: LifecycleStage,
  trigger: string,
  _metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();

  // Get current stage
  const { data: current } = await supabase
    .from("user_lifecycle")
    .select("current_stage")
    .eq("user_id", userId)
    .single();

  const currentData = current as { current_stage?: LifecycleStage } | null;
  const fromStage = (currentData?.current_stage as LifecycleStage) || "signup";

  // Update lifecycle
  const updateData: Record<string, unknown> = {
    current_stage: newStage,
    updated_at: new Date().toISOString(),
  };

  // Set activation timestamp if transitioning to activation
  if (newStage === "activation" && fromStage !== "activation") {
    updateData.activated_at = new Date().toISOString();
  }

  // Update last active timestamp
  if (newStage !== "churned") {
    updateData.last_active_at = new Date().toISOString();
  }

  await (supabase.from("user_lifecycle") as any).upsert({
    user_id: userId,
    ...updateData,
  });

  // Log transition
  // eslint-disable-next-line no-console
  console.log(`Lifecycle transition: ${userId} ${fromStage} → ${newStage} (trigger: ${trigger})`);
}

/**
 * Check and update lifecycle stage based on user activity
 */
export async function evaluateLifecycleStage(userId: string): Promise<LifecycleStage> {
  const supabase = createClient();

  // Get user data
  const { data: lifecycle } = await supabase
    .from("user_lifecycle")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!lifecycle) {
    // Initialize lifecycle
    await (supabase.from("user_lifecycle") as any).insert({
      user_id: userId,
      current_stage: "signup",
    });
    return "signup";
  }

  const lifecycleData = lifecycle as UserLifecycle;
  const currentStage = (lifecycleData.current_stage as LifecycleStage) || "signup";

  // Get user activity metrics
  const { data: metrics } = await (supabase.rpc as any)("get_user_activity_metrics", {
    user_id: userId,
  });

  // Determine new stage based on metrics
  let newStage: LifecycleStage = currentStage;

  const metricsData = metrics as UserActivityMetrics | null;

  // Activation: First successful setup
  if (currentStage === "signup" && lifecycleData.first_successful_setup_at) {
    newStage = "activation";
  }

  // Engaged: Active usage in last 7 days
  if (
    (currentStage === "activation" || currentStage === "engaged") &&
    metricsData?.active_last_7_days
  ) {
    newStage = "engaged";
  }

  // Retention: Consistent usage over 30 days
  if (
    (currentStage === "engaged" || currentStage === "retention") &&
    (metricsData?.active_days_last_30 || 0) >= 20
  ) {
    newStage = "retention";
  }

  // Expansion: Upgraded or using premium features
  if (
    (currentStage === "retention" || currentStage === "expansion") &&
    (metricsData?.has_upgraded || metricsData?.using_premium_features)
  ) {
    newStage = "expansion";
  }

  // At Risk: Low activity or high churn score
  if (
    currentStage !== "churned" &&
    ((lifecycleData.churn_risk_score || 0) > 0.7 ||
      (metricsData?.days_since_last_activity || 0) > 30)
  ) {
    newStage = "at_risk";
  }

  // Churned: No activity for 90+ days or explicit cancellation
  if ((metricsData?.days_since_last_activity || 0) > 90 || metricsData?.explicitly_cancelled) {
    newStage = "churned";
  }

  // Update if stage changed
  if (newStage !== currentStage) {
    await transitionLifecycleStage(userId, newStage, "automated_evaluation");
  }

  return newStage;
}

/**
 * Calculate churn risk score
 */
export async function calculateChurnRisk(userId: string): Promise<number> {
  const supabase = createClient();

  // Get user metrics
  const { data: metrics } = await (supabase.rpc as any)("get_user_activity_metrics", {
    user_id: userId,
  });
  const { data: lifecycle } = await supabase
    .from("user_lifecycle")
    .select("*")
    .eq("user_id", userId)
    .single();

  const metricsData = metrics as UserActivityMetrics | null;
  const lifecycleData = lifecycle as UserLifecycle | null;

  if (!metricsData || !lifecycleData) return 0;

  let riskScore = 0;
  const reasons: string[] = [];

  // Days since last activity (0-0.4)
  const daysSinceActivity = metricsData.days_since_last_activity || 0;
  if (daysSinceActivity > 30) {
    riskScore += 0.4;
    reasons.push(`No activity for ${daysSinceActivity} days`);
  } else if (daysSinceActivity > 14) {
    riskScore += 0.2;
    reasons.push(`Low activity (${daysSinceActivity} days)`);
  }

  // Never activated (0-0.3)
  if (!lifecycleData.activated_at) {
    riskScore += 0.3;
    reasons.push("Never completed activation");
  }

  // Low usage (0-0.2)
  if ((metricsData.total_jobs_created || 0) < 3) {
    riskScore += 0.2;
    reasons.push("Low job creation");
  }

  // Payment issues (0-0.1)
  if (metricsData.has_payment_issues) {
    riskScore += 0.1;
    reasons.push("Payment issues");
  }

  // Update churn risk
  await (supabase.from("user_lifecycle") as any)
    .update({
      churn_risk_score: Math.min(riskScore, 1.0),
      churn_risk_reasons: reasons,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return Math.min(riskScore, 1.0);
}

/**
 * Calculate expansion opportunity score
 */
export async function calculateExpansionOpportunity(userId: string): Promise<number> {
  const supabase = createClient();

  const { data: metrics } = await (supabase.rpc as any)("get_user_activity_metrics", {
    user_id: userId,
  });

  const metricsData = metrics as UserActivityMetrics | null;
  if (!metricsData) return 0;

  let opportunityScore = 0;

  // High usage (approaching limits)
  const usagePercentage = metricsData.usage_percentage || 0;
  if (usagePercentage > 80) {
    opportunityScore += 0.4;
  } else if (usagePercentage > 60) {
    opportunityScore += 0.2;
  }

  // Consistent usage
  if ((metricsData.active_days_last_30 || 0) >= 20) {
    opportunityScore += 0.3;
  }

  // Multiple integrations
  if ((metricsData.integration_count || 0) >= 3) {
    opportunityScore += 0.2;
  }

  // Enterprise features interest
  if (metricsData.viewed_enterprise_features) {
    opportunityScore += 0.1;
  }

  // Update expansion score
  await (supabase.from("user_lifecycle") as any)
    .update({
      expansion_opportunity_score: Math.min(opportunityScore, 1.0),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return Math.min(opportunityScore, 1.0);
}
