// Edge Function: automated-health-checks
// Purpose: Automated health checks for critical systems with alerting
// Trigger: Scheduled (cron) - runs every 5 minutes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  check: string;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const results: HealthCheckResult[] = [];
    const now = new Date().toISOString();

    // 1. Database connectivity check
    try {
      const { error: dbError } = await supabaseClient.from("profiles").select("id").limit(1);
      results.push({
        check: "database_connectivity",
        status: dbError ? "unhealthy" : "healthy",
        message: dbError ? `Database error: ${dbError.message}` : "Database is accessible",
        timestamp: now,
      });
    } catch (error) {
      results.push({
        check: "database_connectivity",
        status: "unhealthy",
        message: `Database check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: now,
      });
    }

    // 2. Database query performance check
    try {
      const startTime = Date.now();
      await supabaseClient.from("profiles").select("id").limit(100);
      const queryTime = Date.now() - startTime;
      results.push({
        check: "database_performance",
        status: queryTime > 1000 ? "degraded" : "healthy",
        message: `Query took ${queryTime}ms`,
        timestamp: now,
        details: { query_time_ms: queryTime },
      });
    } catch (error) {
      results.push({
        check: "database_performance",
        status: "unhealthy",
        message: `Performance check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: now,
      });
    }

    // 3. Stripe webhook processing check
    try {
      const { data: recentWebhooks, error: webhookError } = await supabaseClient
        .from("stripe_event_log")
        .select("id, event_type, processed, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (webhookError) {
        results.push({
          check: "stripe_webhooks",
          status: "unhealthy",
          message: `Webhook check failed: ${webhookError.message}`,
          timestamp: now,
        });
      } else {
        const unprocessed = recentWebhooks?.filter((w) => !w.processed) || [];
        const failedRate = unprocessed.length / (recentWebhooks?.length || 1);
        results.push({
          check: "stripe_webhooks",
          status: failedRate > 0.1 ? "degraded" : "healthy",
          message: `${unprocessed.length} unprocessed webhooks out of ${recentWebhooks?.length || 0}`,
          timestamp: now,
          details: {
            unprocessed_count: unprocessed.length,
            total_recent: recentWebhooks?.length || 0,
            failed_rate: failedRate,
          },
        });
      }
    } catch (error) {
      results.push({
        check: "stripe_webhooks",
        status: "unhealthy",
        message: `Webhook check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: now,
      });
    }

    // 4. Billing reconciliation check
    try {
      const { data: subscriptions, error: subError } = await supabaseClient
        .from("subscriptions")
        .select("id, status, updated_at")
        .eq("status", "active")
        .limit(10);

      if (subError) {
        results.push({
          check: "billing_reconciliation",
          status: "unhealthy",
          message: `Subscription check failed: ${subError.message}`,
          timestamp: now,
        });
      } else {
        // Check for subscriptions not updated in last 24 hours (potential sync issue)
        const staleSubs =
          subscriptions?.filter((s) => {
            const updated = new Date(s.updated_at);
            const hoursSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
            return hoursSinceUpdate > 24;
          }) || [];

        results.push({
          check: "billing_reconciliation",
          status: staleSubs.length > 0 ? "degraded" : "healthy",
          message: `${staleSubs.length} subscriptions not updated in 24h`,
          timestamp: now,
          details: {
            active_subscriptions: subscriptions?.length || 0,
            stale_count: staleSubs.length,
          },
        });
      }
    } catch (error) {
      results.push({
        check: "billing_reconciliation",
        status: "unhealthy",
        message: `Billing check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: now,
      });
    }

    // 5. API usage anomaly detection
    try {
      const { data: recentUsage, error: usageError } = await supabaseClient
        .from("usage_events")
        .select("event_type, quantity, created_at")
        .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order("created_at", { ascending: false });

      if (usageError) {
        results.push({
          check: "usage_anomaly",
          status: "unhealthy",
          message: `Usage check failed: ${usageError.message}`,
          timestamp: now,
        });
      } else {
        // Simple anomaly detection: check if usage is unusually high/low
        const totalUsage = recentUsage?.reduce((sum, u) => sum + (u.quantity || 0), 0) || 0;
        const avgUsage = totalUsage / (recentUsage?.length || 1);
        // Threshold: if usage is 10x average or 0, flag as anomaly
        const hasAnomaly = avgUsage > 1000 || (recentUsage?.length === 0 && totalUsage === 0);

        results.push({
          check: "usage_anomaly",
          status: hasAnomaly ? "degraded" : "healthy",
          message: `Usage in last hour: ${totalUsage} events (avg: ${avgUsage.toFixed(2)})`,
          timestamp: now,
          details: {
            total_usage: totalUsage,
            event_count: recentUsage?.length || 0,
            average_per_event: avgUsage,
          },
        });
      }
    } catch (error) {
      results.push({
        check: "usage_anomaly",
        status: "unhealthy",
        message: `Usage check error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: now,
      });
    }

    // 6. Email service check (if Resend configured)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        // Check recent email sends for failures
        const { data: recentEmails, error: emailError } = await supabaseClient
          .from("email_sends")
          .select("status, created_at")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
          .order("created_at", { ascending: false })
          .limit(100);

        if (emailError) {
          results.push({
            check: "email_service",
            status: "unhealthy",
            message: `Email check failed: ${emailError.message}`,
            timestamp: now,
          });
        } else {
          const failedEmails = recentEmails?.filter((e) => e.status === "failed") || [];
          const failureRate = failedEmails.length / (recentEmails?.length || 1);
          results.push({
            check: "email_service",
            status: failureRate > 0.05 ? "degraded" : "healthy",
            message: `${failedEmails.length} failed emails out of ${recentEmails?.length || 0}`,
            timestamp: now,
            details: {
              failed_count: failedEmails.length,
              total_recent: recentEmails?.length || 0,
              failure_rate: failureRate,
            },
          });
        }
      } catch (error) {
        results.push({
          check: "email_service",
          status: "unhealthy",
          message: `Email check error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: now,
        });
      }
    }

    // Store health check results
    const unhealthyChecks = results.filter((r) => r.status === "unhealthy");
    const degradedChecks = results.filter((r) => r.status === "degraded");

    await supabaseClient
      .from("health_checks")
      .insert({
        check_type: "automated",
        results: results,
        overall_status:
          unhealthyChecks.length > 0
            ? "unhealthy"
            : degradedChecks.length > 0
              ? "degraded"
              : "healthy",
        timestamp: now,
      })
      .catch(() => {
        // Table might not exist, that's okay
      });

    // Alert if unhealthy
    if (unhealthyChecks.length > 0 || degradedChecks.length > 0) {
      const alerts = [
        ...unhealthyChecks.map((check) => ({
          severity: "critical" as const,
          title: `Unhealthy: ${check.check}`,
          message: check.message,
          check: check.check,
          details: check.details,
        })),
        ...degradedChecks.map((check) => ({
          severity: "high" as const,
          title: `Degraded: ${check.check}`,
          message: check.message,
          check: check.check,
          details: check.details,
        })),
      ];

      // Send alerts asynchronously (don't block response)
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/automated-alerting`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alerts }),
      }).catch((error) => {
        console.error("Failed to send alerts:", error);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        overall_status:
          unhealthyChecks.length > 0
            ? "unhealthy"
            : degradedChecks.length > 0
              ? "degraded"
              : "healthy",
        checks: results,
        unhealthy_count: unhealthyChecks.length,
        degraded_count: degradedChecks.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({
        error: "Health check failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
