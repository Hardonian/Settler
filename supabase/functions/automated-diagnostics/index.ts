// Edge Function: automated-diagnostics
// Purpose: Automated diagnostics for errors and system issues
// Trigger: On error events or scheduled checks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticResult {
  issue_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  root_cause?: string;
  recommended_action: string;
  affected_count?: number;
  first_seen?: string;
  last_seen?: string;
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

    const diagnostics: DiagnosticResult[] = [];
    const now = new Date();

    // 1. Check for failed webhook processing
    const { data: failedWebhooks } = await supabaseClient
      .from("stripe_event_log")
      .select("id, event_type, error_message, created_at")
      .eq("processed", false)
      .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (failedWebhooks && failedWebhooks.length > 0) {
      // Group by error type
      const errorGroups = new Map<string, typeof failedWebhooks>();
      failedWebhooks.forEach((w) => {
        const errorKey = w.error_message || "unknown_error";
        if (!errorGroups.has(errorKey)) {
          errorGroups.set(errorKey, []);
        }
        errorGroups.get(errorKey)!.push(w);
      });

      errorGroups.forEach((webhooks, errorType) => {
        diagnostics.push({
          issue_type: "webhook_processing_failure",
          severity: webhooks.length > 10 ? "high" : webhooks.length > 5 ? "medium" : "low",
          description: `${webhooks.length} webhook(s) failed to process`,
          root_cause: errorType === "unknown_error" ? undefined : errorType,
          recommended_action: webhooks.length > 10
            ? "Investigate webhook processing immediately. Check database connectivity and Stripe API status."
            : "Review failed webhooks and retry processing.",
          affected_count: webhooks.length,
          first_seen: webhooks[webhooks.length - 1]?.created_at,
          last_seen: webhooks[0]?.created_at,
        });
      });
    }

    // 2. Check for billing discrepancies
    const { data: subscriptions } = await supabaseClient
      .from("subscriptions")
      .select("id, status, stripe_subscription_id, updated_at")
      .eq("status", "active")
      .limit(100);

    if (subscriptions) {
      // Check for subscriptions not synced recently
      const staleSubs = subscriptions.filter((s) => {
        const updated = new Date(s.updated_at);
        const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate > 48; // Not updated in 48 hours
      });

      if (staleSubs.length > 0) {
        diagnostics.push({
          issue_type: "billing_sync_stale",
          severity: staleSubs.length > 10 ? "high" : "medium",
          description: `${staleSubs.length} active subscription(s) not synced in 48+ hours`,
          root_cause: "Possible webhook processing failure or Stripe API issues",
          recommended_action: "Manually sync subscriptions from Stripe dashboard or trigger webhook replay",
          affected_count: staleSubs.length,
        });
      }
    }

    // 3. Check for usage tracking anomalies
    const { data: recentUsage } = await supabaseClient
      .from("usage_events")
      .select("event_type, quantity, created_at, user_id")
      .gte("created_at", new Date(now.getTime() - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (recentUsage) {
      // Check for unusually high usage from single user (potential abuse)
      const userUsage = new Map<string, number>();
      recentUsage.forEach((u) => {
        const userId = u.user_id || "unknown";
        userUsage.set(userId, (userUsage.get(userId) || 0) + (u.quantity || 0));
      });

      userUsage.forEach((totalUsage, userId) => {
        if (totalUsage > 10000) {
          diagnostics.push({
            issue_type: "usage_anomaly_high",
            severity: totalUsage > 100000 ? "critical" : "high",
            description: `User ${userId} has ${totalUsage} usage events in last hour`,
            root_cause: "Potential abuse or misconfiguration",
            recommended_action: "Review user's usage patterns and consider rate limiting",
            affected_count: 1,
          });
        }
      });

      // Check for zero usage (potential tracking issue)
      if (recentUsage.length === 0) {
        diagnostics.push({
          issue_type: "usage_tracking_zero",
          severity: "medium",
          description: "No usage events recorded in last hour",
          root_cause: "Possible usage tracking system failure",
          recommended_action: "Check usage tracking endpoints and database connectivity",
        });
      }
    }

    // 4. Check for email delivery failures
    const { data: failedEmails } = await supabaseClient
      .from("email_sends")
      .select("id, status, error_message, created_at")
      .eq("status", "failed")
      .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (failedEmails && failedEmails.length > 0) {
      const failureRate = failedEmails.length / (recentUsage?.length || 1);
      diagnostics.push({
        issue_type: "email_delivery_failure",
        severity: failureRate > 0.1 ? "high" : failureRate > 0.05 ? "medium" : "low",
        description: `${failedEmails.length} email(s) failed to send in last 24 hours`,
        root_cause: "Email service provider issue or configuration error",
        recommended_action: "Check Resend API key and email service status. Review error messages for patterns.",
        affected_count: failedEmails.length,
      });
    }

    // 5. Check for database performance issues
    const { data: slowQueries } = await supabaseClient
      .rpc("get_slow_queries", { p_min_duration_ms: 1000 })
      .catch(() => ({ data: null }));

    if (slowQueries && Array.isArray(slowQueries) && slowQueries.length > 0) {
      diagnostics.push({
        issue_type: "database_performance",
        severity: slowQueries.length > 10 ? "high" : "medium",
        description: `${slowQueries.length} slow query(s) detected`,
        root_cause: "Missing indexes, inefficient queries, or high load",
        recommended_action: "Review query performance, add indexes, or scale database",
        affected_count: slowQueries.length,
      });
    }

    // Store diagnostics
    await supabaseClient.from("diagnostics").insert({
      diagnostic_type: "automated",
      results: diagnostics,
      timestamp: now.toISOString(),
    }).catch(() => {
      // Table might not exist, that's okay
    });

    // Return critical/high severity diagnostics first
    const critical = diagnostics.filter((d) => d.severity === "critical");
    const high = diagnostics.filter((d) => d.severity === "high");

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics_count: diagnostics.length,
        critical_count: critical.length,
        high_count: high.length,
        diagnostics: diagnostics.sort((a, b) => {
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Diagnostics error:", error);
    return new Response(
      JSON.stringify({
        error: "Diagnostics failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
