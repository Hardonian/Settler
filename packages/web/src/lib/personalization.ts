/**
 * On-site Personalization System
 * Dynamic CTAs and content based on user source, segment, and behavior
 */

import { createClient } from "@/lib/supabase/client";

export type TrafficSource = "organic" | "paid" | "referral" | "direct" | "social" | "email";

export interface PersonalizedCTA {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
  priority: number;
}

/**
 * Get personalized CTA based on source and user data
 */
export async function getPersonalizedCTA(
  userId: string | null,
  source: TrafficSource,
  _page: string
): Promise<PersonalizedCTA> {
  const supabase = createClient();

  // Default CTAs by source
  const sourceCTAs: Record<TrafficSource, PersonalizedCTA> = {
    organic: {
      text: "Start Free Trial—No Credit Card Required",
      href: "/signup",
      variant: "primary",
      priority: 1,
    },
    paid: {
      text: "Get Started Free—30-Day Trial",
      href: "/signup?source=paid",
      variant: "primary",
      priority: 1,
    },
    referral: {
      text: "Join with Referral Code",
      href: "/signup?ref=referral",
      variant: "primary",
      priority: 1,
    },
    direct: {
      text: "Start Your Free Trial",
      href: "/signup",
      variant: "primary",
      priority: 1,
    },
    social: {
      text: "Try Settler Free—No Credit Card",
      href: "/signup?source=social",
      variant: "primary",
      priority: 1,
    },
    email: {
      text: "Complete Your Setup",
      href: "/dashboard",
      variant: "primary",
      priority: 1,
    },
  };

  // If user is logged in, personalize based on their data
  if (userId) {
    const { data: lifecycle } = await supabase
      .from("user_lifecycle")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (lifecycle) {
      // High churn risk → retention CTA
      if ((lifecycle as any).churn_risk_score > 0.7) {
        return {
          text: "Need Help? Contact Support",
          href: "/support",
          variant: "secondary",
          priority: 1,
        };
      }

      // Expansion opportunity → upgrade CTA
      if ((lifecycle as any).expansion_opportunity_score > 0.6) {
        return {
          text: "Unlock Enterprise Features",
          href: "/enterprise",
          variant: "primary",
          priority: 1,
        };
      }

      // Not activated → activation CTA
      if (!(lifecycle as any).activated_at) {
        return {
          text: "Complete Your First Reconciliation",
          href: "/playground",
          variant: "primary",
          priority: 1,
        };
      }

      // Trial ending → upgrade CTA
      if ((lifecycle as any).current_stage === "trial") {
        return {
          text: "Upgrade to Keep Your Features",
          href: "/pricing",
          variant: "primary",
          priority: 1,
        };
      }
    }
  }

  // Return source-based CTA
  return sourceCTAs[source] || sourceCTAs.organic;
}

/**
 * Get personalized content based on user segment
 */
export async function getPersonalizedContent(
  userId: string | null,
  _contentType: "hero" | "features" | "testimonials"
): Promise<string> {
  if (!userId) {
    return "default"; // Return default content for anonymous users
  }

  const supabase = createClient();
  const { data: segments } = await supabase
    .from("user_segments")
    .select("segment_name")
    .eq("user_id", userId);

  const segmentNames = segments?.map((s: any) => s.segment_name) || [];

  // Personalize based on segments
  if (segmentNames.includes("at_risk")) {
    return "retention_focused";
  }
  if (segmentNames.includes("expansion_ready")) {
    return "enterprise_focused";
  }
  if (segmentNames.includes("inactive")) {
    return "activation_focused";
  }

  return "default";
}
