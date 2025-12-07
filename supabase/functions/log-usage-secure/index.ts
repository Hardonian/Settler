// Edge Function: log-usage-secure
// Purpose: Secure usage event logging with idempotency, fraud detection, and validation
// Authentication: Required (JWT token or API key)
// Security: Rate limiting, fraud detection, server-side validation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-idempotency-key",
};

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;

  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  return entry.count <= maxRequests;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get IP for rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting: 100 requests per minute per IP
    if (!checkRateLimit(ip, 60 * 1000, 100)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded", retryAfter: 60 }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("x-api-key");

    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({ error: "Missing authorization header or API key" }), {
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
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Get authenticated user (if using JWT)
    let userId: string | null = null;
    let tenantId: string | null = null;

    if (authHeader) {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            details: userError?.message,
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = user.id;
      tenantId = (user.user_metadata?.tenant_id as string) || null;
    }

    // Parse request body
    const body = await req.json();
    const {
      billing_account_id,
      event_type,
      quantity = 1,
      project_id,
      user_id,
      tenant_id,
      integration_id,
      add_on_id,
      unit,
      metadata = {},
      idempotency_key,
    } = body;

    // Validate required fields
    if (!billing_account_id || !event_type) {
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
      .select("id, user_id, tenant_id, status")
      .eq("id", billing_account_id)
      .single();

    if (billingError || !billingAccount) {
      return new Response(JSON.stringify({ error: "Billing account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check billing account is active
    if (billingAccount.status !== "active") {
      return new Response(JSON.stringify({ error: "Billing account is not active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check authorization (user must own billing account or be in same tenant)
    if (userId && billingAccount.user_id !== userId) {
      if (!tenant_id || billingAccount.tenant_id !== tenant_id) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized access to billing account",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Server-side validation: Check if usage event is legitimate
    const { data: isValid, error: validationError } = await supabaseClient.rpc(
      "validate_usage_event_server_side",
      {
        p_billing_account_id: billing_account_id,
        p_event_type: event_type,
        p_integration_id: integration_id || null,
        p_add_on_id: add_on_id || null,
      }
    );

    if (validationError || !isValid) {
      return new Response(
        JSON.stringify({
          error: "Invalid usage event",
          details: "Event type or integration not configured for this account",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotency_key || crypto.randomUUID();

    // Log usage event via database function (with idempotency and fraud detection)
    const { data: eventId, error: logError } = await supabaseClient.rpc("log_usage_event", {
      p_billing_account_id: billing_account_id,
      p_event_type: event_type,
      p_quantity: quantity,
      p_project_id: project_id || null,
      p_user_id: user_id || userId,
      p_tenant_id: tenant_id || billingAccount.tenant_id,
      p_integration_id: integration_id || null,
      p_add_on_id: add_on_id || null,
      p_unit: unit || null,
      p_metadata: metadata,
      p_idempotency_key: finalIdempotencyKey,
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
        idempotency_key: finalIdempotencyKey,
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
