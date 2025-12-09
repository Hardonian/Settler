/**
 * Customer Segmentation System
 * Segments users by behavior, billing tier, and usage patterns
 */

import { createClient } from "@/lib/supabase/client";

export type SegmentType = "behavioral" | "billing" | "usage";

export interface CustomerSegment {
  userId: string;
  segmentType: SegmentType;
  segmentName: string;
  metadata?: Record<string, unknown>;
}

/**
 * Assign customer segment
 */
export async function assignSegment(
  userId: string,
  segmentType: SegmentType,
  segmentName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();

  await supabase.from("user_segments").upsert({
    user_id: userId,
    segment_type: segmentType,
    segment_name: segmentName,
    segment_metadata: metadata || {},
    assigned_at: new Date().toISOString(),
  });
}

/**
 * Get user segments
 */
export async function getUserSegments(userId: string): Promise<CustomerSegment[]> {
  const supabase = createClient();

  const { data, error } = await supabase.from("user_segments").select("*").eq("user_id", userId);

  if (error) {
    console.error("Error fetching segments:", error);
    return [];
  }

  type SegmentRow = {
    user_id: string;
    segment_type: string;
    segment_name: string;
    segment_metadata: Record<string, unknown>;
  };
  
  return (data || []).map((s: SegmentRow) => ({
    userId: s.user_id,
    segmentType: s.segment_type as SegmentType,
    segmentName: s.segment_name,
    metadata: s.segment_metadata,
  }));
}

/**
 * Auto-segment user based on behavior and usage
 */
export async function autoSegmentUser(userId: string): Promise<void> {
  const supabase = createClient();

  // Get user data
  const { data: user } = await supabase.from("users").select("plan_type").eq("id", userId).single();
  const { data: lifecycle } = await supabase
    .from("user_lifecycle")
    .select("*")
    .eq("user_id", userId)
    .single();
  const { data: metrics } = await supabase.rpc("get_user_activity_metrics", {
    user_id: userId,
  } as any);

  if (!user || !lifecycle || !metrics) return;

  type UserRow = { plan_type?: string };
  type LifecycleRow = {
    activated_at?: string | null;
    churn_risk_score?: number;
    churn_risk_reasons?: unknown;
    expansion_opportunity_score?: number;
    current_stage?: string;
  };
  type MetricsRow = {
    total_jobs_created?: number;
    usage_percentage?: number;
  };
  
  const userData = user as UserRow;
  const lifecycleData = lifecycle as LifecycleRow;
  const metricsData = metrics as MetricsRow | null;
  
  // Billing segments
  const billingSegment = userData.plan_type || "free_tier";
  await assignSegment(userId, "billing", billingSegment);

  // Behavioral segments
  if (!lifecycleData.activated_at) {
    await assignSegment(userId, "behavioral", "inactive", {
      reason: "never_activated",
    });
  } else if ((lifecycleData.churn_risk_score || 0) > 0.7) {
    await assignSegment(userId, "behavioral", "at_risk", {
      churn_score: lifecycleData.churn_risk_score,
      reasons: lifecycleData.churn_risk_reasons,
    });
  } else if ((lifecycleData.expansion_opportunity_score || 0) > 0.6) {
    await assignSegment(userId, "behavioral", "expansion_ready", {
      opportunity_score: lifecycleData.expansion_opportunity_score,
    });
  } else if (
    lifecycleData.current_stage === "retention" ||
    lifecycleData.current_stage === "expansion"
  ) {
    await assignSegment(userId, "behavioral", "engaged", {
      stage: lifecycleData.current_stage,
    });
  }

  // Usage segments
  const totalJobs = metricsData?.total_jobs_created || 0;
  if (totalJobs === 0) {
    await assignSegment(userId, "usage", "no_usage", {});
  } else if (totalJobs < 5) {
    await assignSegment(userId, "usage", "light_usage", {
      jobs_created: totalJobs,
    });
  } else if (totalJobs < 20) {
    await assignSegment(userId, "usage", "moderate_usage", {
      jobs_created: totalJobs,
    });
  } else {
    await assignSegment(userId, "usage", "heavy_usage", {
      jobs_created: totalJobs,
    });
  }

  // Usage percentage segments
  const usagePercentage = metricsData?.usage_percentage || 0;
  if (usagePercentage > 90) {
    await assignSegment(userId, "usage", "near_limit", {
      usage_percentage: usagePercentage,
    });
  } else if (usagePercentage > 70) {
    await assignSegment(userId, "usage", "approaching_limit", {
      usage_percentage: usagePercentage,
    });
  }
}

/**
 * Get segment-based recommendations
 */
export async function getSegmentRecommendations(userId: string): Promise<string[]> {
  const segments = await getUserSegments(userId);
  const recommendations: string[] = [];

  // Check for upgrade opportunities
  const billingSegment = segments.find((s) => s.segmentType === "billing");
  if (billingSegment?.segmentName === "free_tier" || billingSegment?.segmentName === "trial") {
    recommendations.push("Consider upgrading to unlock more features");
  }

  // Check for activation
  const inactiveSegment = segments.find((s) => s.segmentName === "inactive");
  if (inactiveSegment) {
    recommendations.push("Complete your first reconciliation to get started");
  }

  // Check for churn risk
  const atRiskSegment = segments.find((s) => s.segmentName === "at_risk");
  if (atRiskSegment) {
    recommendations.push("We noticed you haven't been active recently. Need help?");
  }

  // Check for expansion
  const expansionSegment = segments.find((s) => s.segmentName === "expansion_ready");
  if (expansionSegment) {
    recommendations.push("You're ready for more! Explore enterprise features");
  }

  return recommendations;
}
