/**
 * Collect Reality Metrics
 *
 * This function collects reality metrics from actual data sources and updates
 * the canonical reality_metrics table. It should be run periodically (e.g., hourly).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ========================================================================
    // REVENUE REALITY
    // ========================================================================

    // Active subscriptions
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact" })
      .eq("status", "active");

    if (!subError && activeSubscriptions) {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "revenue",
        p_name: "active_subscriptions",
        p_value: Array.isArray(activeSubscriptions) ? activeSubscriptions.length : 0,
        p_status: "proven",
        p_source: "subscriptions table",
      });
    }

    // MRR calculation (sum of active subscription monthly amounts)
    const { data: subscriptions, error: mrrError } = await supabase
      .from("subscriptions")
      .select("plan_id, plan_name, stripe_price_id")
      .eq("status", "active");

    // For now, we'll mark MRR as assumed if we can't calculate it properly
    // In production, you'd fetch actual prices from Stripe
    let mrr = 0;
    let mrrStatus = "assumed";
    if (!mrrError && subscriptions) {
      // Placeholder: In real implementation, fetch prices from Stripe API
      mrrStatus = "assumed"; // Will be proven once Stripe integration is verified
    }

    await supabase.rpc("upsert_reality_metric", {
      p_category: "revenue",
      p_name: "mrr",
      p_value: mrr,
      p_status: mrrStatus,
      p_source: "subscriptions table + Stripe API",
    });

    // Failed payments (7d and 30d)
    const { data: failed7d, error: failed7dError } = await supabase
      .from("stripe_events")
      .select("id", { count: "exact" })
      .in("type", ["invoice.payment_failed", "charge.failed", "payment_intent.payment_failed"])
      .gte("received_at", sevenDaysAgo.toISOString());

    if (!failed7dError) {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "revenue",
        p_name: "failed_payments_7d",
        p_value: Array.isArray(failed7d) ? failed7d.length : 0,
        p_status: "proven",
        p_source: "stripe_events table",
      });
    }

    const { data: failed30d, error: failed30dError } = await supabase
      .from("stripe_events")
      .select("id", { count: "exact" })
      .in("type", ["invoice.payment_failed", "charge.failed", "payment_intent.payment_failed"])
      .gte("received_at", thirtyDaysAgo.toISOString());

    if (!failed30dError) {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "revenue",
        p_name: "failed_payments_30d",
        p_value: Array.isArray(failed30d) ? failed30d.length : 0,
        p_status: "proven",
        p_source: "stripe_events table",
      });
    }

    // Churn (cancelled subscriptions in last 30 days / active at start of period)
    // This is simplified - real churn calculation is more complex
    const { data: cancelled, error: cancelledError } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact" })
      .eq("status", "cancelled")
      .gte("cancelled_at", thirtyDaysAgo.toISOString());

    if (!cancelledError) {
      const churnRate =
        Array.isArray(cancelled) && cancelled.length > 0
          ? (cancelled.length /
              Math.max(Array.isArray(activeSubscriptions) ? activeSubscriptions.length : 1, 1)) *
            100
          : 0;

      await supabase.rpc("upsert_reality_metric", {
        p_category: "revenue",
        p_name: "churn",
        p_value: churnRate,
        p_status: "assumed", // Simplified calculation
        p_source: "subscriptions table",
      });
    }

    // ========================================================================
    // USER REALITY
    // ========================================================================

    // DAU (Daily Active Users) - users who logged in today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const { data: dauData, error: dauError } = await supabase
      .from("audit_logs")
      .select("actor_id", { count: "exact" })
      .eq("action", "read")
      .gte("created_at", todayStart.toISOString());

    if (!dauError) {
      // Count unique users
      const uniqueUsers = new Set();
      if (Array.isArray(dauData)) {
        dauData.forEach((log: any) => {
          if (log.actor_id) uniqueUsers.add(log.actor_id);
        });
      }

      await supabase.rpc("upsert_reality_metric", {
        p_category: "user",
        p_name: "dau",
        p_value: uniqueUsers.size,
        p_status: "proven",
        p_source: "audit_logs table",
      });
    }

    // WAU (Weekly Active Users)
    const { data: wauData, error: wauError } = await supabase
      .from("audit_logs")
      .select("actor_id", { count: "exact" })
      .eq("action", "read")
      .gte("created_at", sevenDaysAgo.toISOString());

    if (!wauError) {
      const uniqueUsers = new Set();
      if (Array.isArray(wauData)) {
        wauData.forEach((log: any) => {
          if (log.actor_id) uniqueUsers.add(log.actor_id);
        });
      }

      await supabase.rpc("upsert_reality_metric", {
        p_category: "user",
        p_name: "wau",
        p_value: uniqueUsers.size,
        p_status: "proven",
        p_source: "audit_logs table",
      });
    }

    // Time to First Value - check onboarding events
    const { data: onboardingEvents, error: onboardingError } = await supabase
      .from("onboarding_events")
      .select("created_at, event_type, properties")
      .eq("event_type", "activation_complete")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!onboardingError && Array.isArray(onboardingEvents) && onboardingEvents.length > 0) {
      // Calculate median time to activation
      // This is simplified - real calculation would track from onboarding_started
      await supabase.rpc("upsert_reality_metric", {
        p_category: "user",
        p_name: "time_to_first_value_median",
        p_value: 0, // Placeholder - needs proper calculation
        p_status: "assumed",
        p_source: "onboarding_events table",
      });
    } else {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "user",
        p_name: "time_to_first_value_median",
        p_value: 0,
        p_status: "assumed",
        p_source: "onboarding_events table (no data)",
      });
    }

    // Onboarding completion rate
    const { data: onboardingProgress, error: progressError } = await supabase
      .from("onboarding_progress")
      .select("progress, completed_at");

    if (!progressError && Array.isArray(onboardingProgress)) {
      const completed = onboardingProgress.filter((p: any) => p.completed_at !== null).length;
      const total = onboardingProgress.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      await supabase.rpc("upsert_reality_metric", {
        p_category: "user",
        p_name: "onboarding_completion_rate",
        p_value: completionRate,
        p_status: "proven",
        p_source: "onboarding_progress table",
      });
    }

    // ========================================================================
    // TENANT ISOLATION REALITY
    // ========================================================================

    // RLS violations - check for any events indicating blocked access
    const { data: rlsEvents, error: rlsError } = await supabase
      .from("reality_events")
      .select("id", { count: "exact" })
      .eq("category", "tenant_isolation")
      .eq("event_name", "rls_violation_blocked");

    if (!rlsError) {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "tenant_isolation",
        p_name: "rls_violations",
        p_value: Array.isArray(rlsEvents) ? rlsEvents.length : 0,
        p_status: "proven",
        p_source: "reality_events table",
      });
    }

    // ========================================================================
    // FAILURE & RESILIENCE REALITY
    // ========================================================================

    // Safe mode activations
    const { data: safeModeEvents, error: safeModeError } = await supabase
      .from("reality_events")
      .select("id", { count: "exact" })
      .eq("category", "failure")
      .eq("event_name", "safe_mode_activated");

    if (!safeModeError) {
      await supabase.rpc("upsert_reality_metric", {
        p_category: "failure",
        p_name: "safe_mode_activations",
        p_value: Array.isArray(safeModeEvents) ? safeModeEvents.length : 0,
        p_status: "proven",
        p_source: "reality_events table",
      });
    }

    // Hard 500 count - check for 500 errors in audit logs or error logs
    // This would typically come from application logs, but we'll check what we have
    await supabase.rpc("upsert_reality_metric", {
      p_category: "failure",
      p_name: "hard_500_count",
      p_value: 0, // Placeholder - needs application log integration
      p_status: "assumed",
      p_source: "application logs (not yet integrated)",
    });

    // ========================================================================
    // GTM REALITY
    // ========================================================================

    // Pricing page views - would come from analytics events
    // For now, mark as assumed
    await supabase.rpc("upsert_reality_metric", {
      p_category: "gtm",
      p_name: "pricing_page_views",
      p_value: 0,
      p_status: "assumed",
      p_source: "analytics_events table (not yet integrated)",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reality metrics collected",
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error collecting reality metrics:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
