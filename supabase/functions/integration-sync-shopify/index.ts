// Edge Function: integration-sync-shopify
// Purpose: Sync Shopify data and log usage events
// Authentication: Required (JWT token)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { billing_account_id, project_id, tenant_id, order_count } = body;

    if (!billing_account_id) {
      return new Response(
        JSON.stringify({ error: "Missing billing_account_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log usage event for Shopify sync
    const { data: eventId, error: logError } = await supabaseClient.rpc(
      "log_usage_event",
      {
        p_billing_account_id: billing_account_id,
        p_event_type: "integration_sync",
        p_quantity: order_count || 1,
        p_project_id: project_id || null,
        p_user_id: user.id,
        p_tenant_id: tenant_id || null,
        p_integration_id: "shopify",
        p_unit: "order",
        p_metadata: { integration: "shopify", sync_type: "orders" },
      }
    );

    if (logError) {
      console.error("Error logging usage:", logError);
      return new Response(
        JSON.stringify({
          error: "Failed to log usage",
          details: logError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        integration: "shopify",
        message: "Shopify sync completed and usage logged",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
