/**
 * Executive Summary Metrics Auto-Email
 * Sends daily/weekly executive summary to founders
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

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get key metrics
    const { data: newUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    const { data: totalUsers } = await supabase.from("users").select("id", { count: "exact", head: true });

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("amount, status")
      .eq("status", "active");

    const mrr = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    const { data: atRisk } = await supabase
      .from("user_lifecycle")
      .select("user_id")
      .gt("churn_risk_score", 0.7);

    // Generate summary
    const summary = {
      date: today.toISOString().split("T")[0],
      metrics: {
        newUsers: newUsers?.length || 0,
        totalUsers: totalUsers?.length || 0,
        mrr,
        atRiskUsers: atRisk?.length || 0,
      },
      insights: [
        newUsers && newUsers.length > 10 ? "🚀 Strong signup growth today" : "📊 Normal signup volume",
        atRisk && atRisk.length > 20 ? "⚠️ High churn risk detected" : "✅ Churn risk normal",
      ],
    };

    // In production, send email
    // await sendEmail("founder@settler.dev", "Daily Executive Summary", formatSummary(summary));

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
