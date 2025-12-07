// Edge Function: trigger-upgrade-alert
// Purpose: Check if upgrade is required and trigger alerts
// Authentication: Required (JWT token)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse query parameters or request body
    const url = new URL(req.url);
    const billingAccountId = url.searchParams.get("billing_account_id");

    if (!billingAccountId) {
      return new Response(JSON.stringify({ error: "Missing billing_account_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify billing account belongs to user
    const { data: billingAccount, error: billingError } = await supabaseClient
      .from("billing_accounts")
      .select("id, user_id, email")
      .eq("id", billingAccountId)
      .single();

    if (billingError || !billingAccount) {
      return new Response(JSON.stringify({ error: "Billing account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (billingAccount.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized access to billing account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check upgrade requirement
    const { data: upgradeCheck, error: checkError } = await supabaseClient.rpc(
      "check_upgrade_requirement",
      {
        p_billing_account_id: billingAccountId,
      }
    );

    if (checkError) {
      console.error("Error checking upgrade requirement:", checkError);
      return new Response(
        JSON.stringify({
          error: "Failed to check upgrade requirement",
          details: checkError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If upgrade is recommended, trigger alert (in a real implementation,
    // this would send email, create notification, etc.)
    if (upgradeCheck.should_upgrade || upgradeCheck.warnings?.length > 0) {
      // In production, this would:
      // 1. Create a notification in the alerts table
      // 2. Send an email to the user
      // 3. Optionally send WhatsApp/Telegram message if enabled

      console.log("Upgrade alert triggered for billing account:", billingAccountId);
    }

    return new Response(JSON.stringify(upgradeCheck), {
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
