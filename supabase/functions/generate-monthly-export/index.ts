/**
 * Monthly Metrics Export Generator
 * Generates and emails monthly metrics report
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

    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Collect metrics
    const { data: newUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", lastMonth.toISOString())
      .lt("created_at", lastMonthEnd.toISOString());

    const { data: activeUsers } = await supabase
      .from("user_lifecycle")
      .select("user_id")
      .gte("last_active_at", lastMonth.toISOString());

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("amount, status")
      .eq("status", "active");

    const mrr = subscriptions?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    const { data: jobs } = await supabase
      .from("reconciliation_jobs")
      .select("id")
      .gte("created_at", lastMonth.toISOString());

    // Generate CSV
    const csv = `Month,New Users,Active Users,MRR,Jobs Created
${lastMonth.toISOString().substring(0, 7)},${newUsers?.length || 0},${activeUsers?.length || 0},${mrr},${jobs?.length || 0}`;

    // In production, save to storage and email
    return new Response(
      JSON.stringify({
        csv,
        metrics: {
          newUsers: newUsers?.length || 0,
          activeUsers: activeUsers?.length || 0,
          mrr,
          jobsCreated: jobs?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
