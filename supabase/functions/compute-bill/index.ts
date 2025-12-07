// Edge Function: compute-bill
// Purpose: Compute estimated bill for a billing account
// Authentication: Required (JWT token)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters or request body
    const url = new URL(req.url);
    const billingAccountId = url.searchParams.get("billing_account_id");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    if (!billingAccountId) {
      return new Response(
        JSON.stringify({ error: "Missing billing_account_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify billing account belongs to user
    const { data: billingAccount, error: billingError } = await supabaseClient
      .from("billing_accounts")
      .select("id, user_id")
      .eq("id", billingAccountId)
      .single();

    if (billingError || !billingAccount) {
      return new Response(
        JSON.stringify({ error: "Billing account not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (billingAccount.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to billing account" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current subscription period if dates not provided
    let periodStart: string;
    let periodEnd: string;

    if (startDate && endDate) {
      periodStart = startDate;
      periodEnd = endDate;
    } else {
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("current_period_start, current_period_end")
        .eq("billing_account_id", billingAccountId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!subscription) {
        return new Response(
          JSON.stringify({ error: "No active subscription found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      periodStart = subscription.current_period_start.split("T")[0];
      periodEnd = subscription.current_period_end.split("T")[0];
    }

    // Compute estimated bill
    const { data: bill, error: computeError } = await supabaseClient.rpc(
      "compute_estimated_bill",
      {
        p_billing_account_id: billingAccountId,
        p_start_date: periodStart,
        p_end_date: periodEnd,
      }
    );

    if (computeError) {
      console.error("Error computing bill:", computeError);
      return new Response(
        JSON.stringify({
          error: "Failed to compute bill",
          details: computeError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(bill), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
