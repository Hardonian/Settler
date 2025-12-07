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

  await supabase.from("customer_segments").upsert({
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

  const { data, error } = await supabase
    .from("customer_segments")
    .select("*")
    .eq("user_id", userId)
    .is("expires_at", null); // Only active segments

  if (error) {
    console.error("Error fetching segments:", error);
    return [];
  }

  return (data || []).map((s) => ({
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
  const { data: metrics } = await supabase.rpc("get_user_activity_metrics", { user_id: userId });

  if (!user || !lifecycle || !metrics) return;

  // Billing segments
  const billingSegment = user.plan_type || "free_tier";
  await assignSegment(userId, "billing", billingSegment);

  // Behavioral segments
  if (!lifecycle.activated_at) {
    await assignSegment(userId, "behavioral", "inactive", {
      reason: "never_activated",
    });
  } else if (lifecycle.churn_risk_score > 0.7) {
    await assignSegment(userId, "behavioral", "at_risk", {
      churn_score: lifecycle.churn_risk_score,
      reasons: lifecycle.churn_risk_reasons,
    });
  } else if (lifecycle.expansion_opportunity_score > 0.6) {
    await assignSegment(userId, "behavioral", "expansion_ready", {
      opportunity_score: lifecycle.expansion_opportunity_score,
    });
  } else if (lifecycle.current_stage === "retention" || lifecycle.current_stage === "expansion") {
    await assignSegment(userId, "behavioral", "engaged", {
      stage: lifecycle.current_stage,
    });
  }

  // Usage segments
  if (metrics.total_jobs_created === 0) {
    await assignSegment(userId, "usage", "no_usage", {});
  } else if (metrics.total_jobs_created < 5) {
    await assignSegment(userId, "usage", "light_usage", {
      jobs_created: metrics.total_jobs_created,
    });
  } else if (metrics.total_jobs_created < 20) {
    await assignSegment(userId, "usage", "moderate_usage", {
      jobs_created: metrics.total_jobs_created,
    });
  } else {
    await assignSegment(userId, "usage", "heavy_usage", {
      jobs_created: metrics.total_jobs_created,
    });
  }

  // Usage percentage segments
  if (metrics.usage_percentage > 90) {
    await assignSegment(userId, "usage", "near_limit", {
      usage_percentage: metrics.usage_percentage,
    });
  } else if (metrics.usage_percentage > 70) {
    await assignSegment(userId, "usage", "approaching_limit", {
      usage_percentage: metrics.usage_percentage,
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
