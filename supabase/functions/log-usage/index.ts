// Edge Function: log-usage
// Purpose: Log usage events for billing and analytics
// Authentication: Required (JWT token)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageEventRequest {
  billing_account_id: string;
  event_type: string;
  quantity?: number;
  project_id?: string;
  user_id?: string;
  tenant_id?: string;
  integration_id?: string;
  add_on_id?: string;
  unit?: string;
  metadata?: Record<string, unknown>;
}

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

    // Parse request body
    const body: UsageEventRequest = await req.json();

    // Validate required fields
    if (!body.billing_account_id || !body.event_type) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: billing_account_id, event_type",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify billing account belongs to user or tenant
    const { data: billingAccount, error: billingError } = await supabaseClient
      .from("billing_accounts")
      .select("id, user_id, tenant_id")
      .eq("id", body.billing_account_id)
      .single();

    if (billingError || !billingAccount) {
      return new Response(JSON.stringify({ error: "Billing account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check authorization (user must own billing account or be in same tenant)
    if (
      billingAccount.user_id !== user.id &&
      (!body.tenant_id || billingAccount.tenant_id !== body.tenant_id)
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized access to billing account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log usage event via database function
    const { data: eventId, error: logError } = await supabaseClient.rpc("log_usage_event", {
      p_billing_account_id: body.billing_account_id,
      p_event_type: body.event_type,
      p_quantity: body.quantity ?? 1,
      p_project_id: body.project_id ?? null,
      p_user_id: body.user_id ?? user.id,
      p_tenant_id: body.tenant_id ?? billingAccount.tenant_id,
      p_integration_id: body.integration_id ?? null,
      p_add_on_id: body.add_on_id ?? null,
      p_unit: body.unit ?? null,
      p_metadata: body.metadata ?? {},
    });

    if (logError) {
      console.error("Error logging usage event:", logError);
      return new Response(
        JSON.stringify({
          error: "Failed to log usage event",
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
        message: "Usage event logged successfully",
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
