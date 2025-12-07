/**
 * AI-Powered Founder Daily Digest
 * Generates daily metrics summary with AI insights
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

    // Get metrics for today
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // User metrics
    const { data: newUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    const { data: totalUsers } = await supabase.from("users").select("id", { count: "exact", head: true });

    // Revenue metrics
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("amount, status")
      .eq("status", "active");

    const mrr = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    // Usage metrics
    const { data: jobs } = await supabase
      .from("reconciliation_jobs")
      .select("id")
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    // Churn metrics
    const { data: atRiskUsers } = await supabase
      .from("user_lifecycle")
      .select("user_id")
      .gt("churn_risk_score", 0.7);

    // Generate AI insights
    const insights: string[] = [];

    const newUserCount = newUsers?.length || 0;
    if (newUserCount > 10) {
      insights.push(`🚀 Strong growth: ${newUserCount} new users today (above average)`);
    } else if (newUserCount < 3) {
      insights.push(`⚠️ Low signups: Only ${newUserCount} new users today. Consider marketing push.`);
    }

    const atRiskCount = atRiskUsers?.length || 0;
    if (atRiskCount > 20) {
      insights.push(`⚠️ High churn risk: ${atRiskCount} users at risk. Consider retention campaign.`);
    }

    const jobCount = jobs?.length || 0;
    if (jobCount > 50) {
      insights.push(`✅ High engagement: ${jobCount} jobs created today. Users are active!`);
    }

    // Compile digest
    const digest = {
      date: today.toISOString().split("T")[0],
      metrics: {
        newUsers: newUserCount,
        totalUsers: totalUsers?.length || 0,
        mrr: mrr,
        jobsCreated: jobCount,
        atRiskUsers: atRiskCount,
      },
      insights,
      recommendations: [
        atRiskCount > 20 ? "Launch churn save campaign" : null,
        newUserCount < 3 ? "Increase marketing spend" : null,
        mrr < 10000 ? "Focus on upgrade conversions" : null,
      ].filter(Boolean),
    };

    // Send email (in production, use email service)
    // await sendEmail("founder@settler.dev", "Daily Digest", formatDigest(digest));

    return new Response(JSON.stringify({ digest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
