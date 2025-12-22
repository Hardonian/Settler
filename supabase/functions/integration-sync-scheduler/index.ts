/**
 * Integration Sync Scheduler
 * 
 * Scheduled function to sync all active connectors
 * Runs periodically (e.g., every hour) to sync data from all connected integrations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active connectors
    const { data: connectors, error: connectorsError } = await supabaseClient
      .from("connectors")
      .select("id, tenant_id, provider_id, last_sync_at")
      .eq("status", "connected")
      .eq("auto_disabled", false);

    if (connectorsError) {
      throw new Error(`Failed to fetch connectors: ${connectorsError.message}`);
    }

    const results = [];

    // Sync each connector
    for (const connector of connectors || []) {
      try {
        // Check if sync is needed (e.g., last sync was more than 1 hour ago)
        const lastSync = connector.last_sync_at
          ? new Date(connector.last_sync_at)
          : null;
        const hoursSinceSync = lastSync
          ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
          : Infinity;

        // Skip if synced recently (within last hour)
        if (hoursSinceSync < 1) {
          continue;
        }

        // Trigger sync via API
        const syncResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/integration-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              connector_id: connector.id,
              tenant_id: connector.tenant_id,
              provider_id: connector.provider_id,
            }),
          }
        );

        if (syncResponse.ok) {
          results.push({
            connector_id: connector.id,
            provider_id: connector.provider_id,
            status: "success",
          });
        } else {
          results.push({
            connector_id: connector.id,
            provider_id: connector.provider_id,
            status: "failed",
            error: await syncResponse.text(),
          });
        }
      } catch (error) {
        results.push({
          connector_id: connector.id,
          provider_id: connector.provider_id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status !== "success").length,
        results,
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
