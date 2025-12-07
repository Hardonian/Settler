// Edge Function: sync-usage-to-stripe
// Purpose: Sync usage aggregates to Stripe for metered billing
// Authentication: Service role (internal use)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Parse request body
    const body = await req.json();
    const billingAccountId = body.billing_account_id;
    const date = body.date || new Date().toISOString().split("T")[0];

    if (!billingAccountId) {
      return new Response(JSON.stringify({ error: "Missing billing_account_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get billing account with Stripe customer ID
    const { data: billingAccount, error: billingError } = await supabaseClient
      .from("billing_accounts")
      .select("id, stripe_customer_id")
      .eq("id", billingAccountId)
      .single();

    if (billingError || !billingAccount || !billingAccount.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          error: "Billing account not found or missing Stripe customer ID",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get active subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("id, stripe_subscription_id")
      .eq("billing_account_id", billingAccountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription || !subscription.stripe_subscription_id) {
      return new Response(
        JSON.stringify({
          error: "No active subscription found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get usage aggregates for the date
    const { data: usageAggregates, error: usageError } = await supabaseClient
      .from("usage_aggregate_daily")
      .select("*")
      .eq("billing_account_id", billingAccountId)
      .eq("date", date);

    if (usageError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch usage aggregates",
          details: usageError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sync each usage aggregate to Stripe
    const results = [];
    for (const aggregate of usageAggregates || []) {
      // Find corresponding Stripe subscription item for this usage type
      // In a real implementation, you'd map event_type to Stripe price IDs
      // For now, we'll skip if no mapping exists

      // Example: Sync reconciliation_job usage
      if (aggregate.event_type === "reconciliation_job") {
        try {
          // Get subscription items
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          );

          // Find the usage-based price item (this would be configured per subscription)
          // For now, we'll create a usage record if a metered price exists
          const meteredItems = stripeSubscription.items.data.filter(
            (item) => item.price.billing_scheme === "per_unit"
          );

          if (meteredItems.length > 0) {
            // Create usage record in Stripe
            await stripe.subscriptionItems.createUsageRecord(meteredItems[0].id, {
              quantity: Math.floor(Number(aggregate.total_quantity)),
              timestamp: Math.floor(new Date(date).getTime() / 1000),
              action: "set",
            });

            results.push({
              event_type: aggregate.event_type,
              quantity: aggregate.total_quantity,
              synced: true,
            });
          }
        } catch (stripeError) {
          console.error("Stripe sync error:", stripeError);
          results.push({
            event_type: aggregate.event_type,
            quantity: aggregate.total_quantity,
            synced: false,
            error: stripeError instanceof Error ? stripeError.message : String(stripeError),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        billing_account_id: billingAccountId,
        date: date,
        results: results,
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
