/**
 * Retry Queue Processor
 *
 * Processes failed syncs from the retry queue
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get ready jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("retry_queue")
      .select("*")
      .eq("status", "pending")
      .lte("next_retry_at", new Date().toISOString())
      .lt("attempt_count", supabase.raw("max_attempts"))
      .order("next_retry_at", { ascending: true })
      .limit(50);

    if (jobsError) {
      throw new Error(`Failed to fetch retry jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get connector driver registry
    const { getAllConnectorMetadata } = await import("@settler/adapters");
    const metadata = getAllConnectorMetadata();
    const connectorMap = new Map(metadata.map((m) => [m.id, m]));

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Get connector
        const { data: connector } = await supabase
          .from("connectors")
          .select("provider_id")
          .eq("id", job.connector_id)
          .single();

        if (!connector) {
          // Mark job as failed
          await supabase
            .from("retry_queue")
            .update({
              status: "failed",
              error_message: "Connector not found",
              completed_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          failed++;
          continue;
        }

        // Mark as processing
        await supabase
          .from("retry_queue")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        // Trigger sync via API
        const syncResponse = await fetch(
          `${supabaseUrl.replace("/rest/v1", "")}/functions/v1/integration-sync-scheduler`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              connector_id: connector.provider_id,
              tenant_id: job.tenant_id,
              sync_run_id: job.sync_run_id,
            }),
          }
        );

        if (syncResponse.ok) {
          // Mark as completed
          await supabase
            .from("retry_queue")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          succeeded++;
        } else {
          // Mark as failed and schedule retry
          const newAttemptCount = job.attempt_count + 1;
          const retryAgain = newAttemptCount < job.max_attempts;

          if (retryAgain) {
            const nextRetryAt = new Date(Date.now() + Math.pow(2, newAttemptCount) * 1000);
            await supabase
              .from("retry_queue")
              .update({
                attempt_count: newAttemptCount,
                next_retry_at: nextRetryAt.toISOString(),
                status: "pending",
              })
              .eq("id", job.id);
          } else {
            await supabase
              .from("retry_queue")
              .update({
                attempt_count: newAttemptCount,
                status: "failed",
                completed_at: new Date().toISOString(),
              })
              .eq("id", job.id);
          }
          failed++;
        }

        processed++;
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        failed++;

        // Update job with error
        const newAttemptCount = job.attempt_count + 1;
        if (newAttemptCount < job.max_attempts) {
          const nextRetryAt = new Date(Date.now() + Math.pow(2, newAttemptCount) * 1000);
          await supabase
            .from("retry_queue")
            .update({
              attempt_count: newAttemptCount,
              next_retry_at: nextRetryAt.toISOString(),
              error_message: error instanceof Error ? error.message : String(error),
              status: "pending",
            })
            .eq("id", job.id);
        } else {
          await supabase
            .from("retry_queue")
            .update({
              attempt_count: newAttemptCount,
              status: "failed",
              error_message: error instanceof Error ? error.message : String(error),
              completed_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Processed retry jobs",
        processed,
        succeeded,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in retry queue processor:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
