// Edge Function: automated-alerting
// Purpose: Centralized alerting system - handles all alerts, notifications, and founder digests
// Trigger: Called by health checks, agents, or scheduled (daily digest)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Alert {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  check?: string;
  source?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

interface DigestRequest {
  type: "daily" | "weekly" | "custom";
  include_metrics?: boolean;
  include_insights?: boolean;
  include_recommendations?: boolean;
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "alert"; // "alert" | "digest" | "check_deadman"

    // ========================================================================
    // ACTION: Generate Founder Digest
    // ========================================================================
    if (action === "digest") {
      const digestRequest = body as DigestRequest;
      const digest = await generateFounderDigest(supabaseClient, digestRequest);

      // Send digest via email
      const founderEmail = Deno.env.get("FOUNDER_EMAIL") || Deno.env.get("ALERT_EMAIL");
      if (founderEmail) {
        await sendDigestEmail(founderEmail, digest);
      }

      return new Response(
        JSON.stringify({
          success: true,
          digest_type: digestRequest.type,
          digest,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========================================================================
    // ACTION: Check Dead-Man Switches
    // ========================================================================
    if (action === "check_deadman") {
      const deadmanResults = await checkDeadManSwitches(supabaseClient);

      // If any agents are missing, create alerts
      if (deadmanResults.missing_agents.length > 0) {
        const alerts: Alert[] = deadmanResults.missing_agents.map((agent) => ({
          severity: "critical",
          title: `Agent Dead-Man Switch: ${agent.agent_type}`,
          message: `${agent.agent_type} has not run in ${agent.hours_overdue} hours (expected every ${agent.expected_interval_hours}h)`,
          check: "deadman_switch",
          source: "agent_monitor",
          details: {
            agent_type: agent.agent_type,
            last_run: agent.last_run,
            expected_run: agent.expected_run,
            hours_overdue: agent.hours_overdue,
          },
        }));

        // Recursively call alerting (but prevent infinite loop)
        if (!body._deadman_check) {
          await sendAlerts(supabaseClient, alerts);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          deadman_check: deadmanResults,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========================================================================
    // ACTION: Send Alerts (default)
    // ========================================================================
    const alerts: Alert[] = body.alerts || [];

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No alerts to send" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendAlerts(supabaseClient, alerts);

    return new Response(
      JSON.stringify({
        success: true,
        alerts_sent: alerts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Alerting error:", error);

    // Fallback: Try direct email if alerting system fails
    const founderEmail = Deno.env.get("FOUNDER_EMAIL");
    if (founderEmail) {
      try {
        await sendEmailAlert(founderEmail, [
          {
            severity: "critical",
            title: "Alerting System Failure",
            message: `Automated alerting system failed: ${error instanceof Error ? error.message : String(error)}`,
            check: "system",
            source: "automated-alerting",
          },
        ]);
      } catch (fallbackError) {
        console.error("Fallback email also failed:", fallbackError);
      }
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send alerts",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendAlerts(supabaseClient: any, alerts: Alert[]): Promise<void> {
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  const mediumAlerts = alerts.filter((a) => a.severity === "medium");

  // Send email alerts for critical/high/medium severity
  const alertEmail = Deno.env.get("ALERT_EMAIL") || Deno.env.get("FOUNDER_EMAIL");

  if (
    alertEmail &&
    (criticalAlerts.length > 0 || highAlerts.length > 0 || mediumAlerts.length > 0)
  ) {
    await sendEmailAlert(alertEmail, [...criticalAlerts, ...highAlerts, ...mediumAlerts]);
  }

  // Send Slack webhook if configured
  const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (slackWebhookUrl && (criticalAlerts.length > 0 || highAlerts.length > 0)) {
    await sendSlackAlert(slackWebhookUrl, [...criticalAlerts, ...highAlerts]);
  }

  // Log alerts to database
  await supabaseClient
    .from("alerts")
    .insert(
      alerts.map((alert) => ({
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        check_type: alert.check || alert.source || "unknown",
        source: alert.source || "unknown",
        details: alert.details || {},
        sent_at: new Date().toISOString(),
        timestamp: alert.timestamp || new Date().toISOString(),
      }))
    )
    .catch((err) => {
      console.warn("Failed to log alerts to database:", err);
    });
}

async function generateFounderDigest(supabaseClient: any, request: DigestRequest): Promise<any> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const digest: any = {
    date: now.toISOString().split("T")[0],
    type: request.type,
    metrics: {},
    insights: [],
    recommendations: [],
    alerts: [],
    agent_status: [],
  };

  // Get metrics
  if (request.include_metrics !== false) {
    const { data: newUsers } = await supabaseClient
      .from("users")
      .select("id")
      .gte("created_at", yesterday.toISOString());

    const { data: subscriptions } = await supabaseClient
      .from("subscriptions")
      .select("plan_id, status")
      .eq("status", "active");

    const planMultiplier: Record<string, number> = {
      base: 29,
      pro: 99,
      enterprise: 299,
    };

    const mrr =
      subscriptions?.reduce((sum, s) => {
        return sum + (planMultiplier[s.plan_id as string] || 0);
      }, 0) || 0;

    digest.metrics = {
      new_users: newUsers?.length || 0,
      mrr,
      active_subscriptions: subscriptions?.length || 0,
    };
  }

  // Get recent alerts
  const { data: recentAlerts } = await supabaseClient
    .from("alerts")
    .select("severity, title, message, created_at")
    .gte("created_at", yesterday.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  digest.alerts = recentAlerts || [];

  // Get agent status
  const { data: recentRuns } = await supabaseClient
    .from("agent_runs")
    .select("agent_type, status, started_at, completed_at, duration_ms")
    .order("started_at", { ascending: false })
    .limit(50);

  const agentStatus = new Map<string, any>();
  recentRuns?.forEach((run: any) => {
    if (!agentStatus.has(run.agent_type)) {
      agentStatus.set(run.agent_type, {
        agent_type: run.agent_type,
        last_run: run.started_at,
        last_status: run.status,
        last_duration_ms: run.duration_ms,
      });
    }
  });

  digest.agent_status = Array.from(agentStatus.values());

  // Generate insights
  if (request.include_insights !== false) {
    const criticalAlerts = digest.alerts.filter((a: any) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      digest.insights.push(
        `🚨 ${criticalAlerts.length} critical alert(s) require immediate attention`
      );
    }

    if (digest.metrics.new_users < 3) {
      digest.insights.push("⚠️ Low user signups - consider marketing push");
    }

    if (digest.metrics.mrr < 5000) {
      digest.insights.push("💰 MRR below target - focus on upgrades");
    }
  }

  // Generate recommendations
  if (request.include_recommendations !== false) {
    if (digest.alerts.filter((a: any) => a.severity === "critical").length > 0) {
      digest.recommendations.push("Review and resolve critical alerts");
    }
    if (digest.metrics.new_users < 3) {
      digest.recommendations.push("Increase marketing spend or improve signup flow");
    }
  }

  return digest;
}

async function checkDeadManSwitches(supabaseClient: any): Promise<any> {
  const now = new Date();
  const agentSchedules: Record<string, number> = {
    strategic_governor: 168, // Weekly = 168 hours
    architecture_sentinel: 24, // Daily = 24 hours
    user_intent_synthesizer: 24, // Daily
    preemptive_support: 24, // Daily
    autonomous_cfo: 24, // Daily
    organic_growth: 168, // Weekly
    release_gatekeeper: 0, // Real-time, no schedule
  };

  const { data: recentRuns } = await supabaseClient
    .from("agent_runs")
    .select("agent_type, started_at")
    .order("started_at", { ascending: false });

  const agentLastRuns = new Map<string, Date>();
  recentRuns?.forEach((run: any) => {
    if (!agentLastRuns.has(run.agent_type)) {
      agentLastRuns.set(run.agent_type, new Date(run.started_at));
    }
  });

  const missingAgents: any[] = [];

  Object.entries(agentSchedules).forEach(([agentType, expectedIntervalHours]) => {
    if (expectedIntervalHours === 0) return; // Skip real-time agents

    const lastRun = agentLastRuns.get(agentType);
    if (!lastRun) {
      missingAgents.push({
        agent_type: agentType,
        last_run: null,
        expected_run: new Date(now.getTime() - expectedIntervalHours * 60 * 60 * 1000),
        hours_overdue: expectedIntervalHours,
        expected_interval_hours: expectedIntervalHours,
      });
      return;
    }

    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
    const expectedRun = new Date(lastRun.getTime() + expectedIntervalHours * 60 * 60 * 1000);

    if (hoursSinceLastRun > expectedIntervalHours * 1.5) {
      // Allow 50% grace period
      missingAgents.push({
        agent_type: agentType,
        last_run: lastRun.toISOString(),
        expected_run: expectedRun.toISOString(),
        hours_overdue: Math.floor(hoursSinceLastRun - expectedIntervalHours),
        expected_interval_hours: expectedIntervalHours,
      });
    }
  });

  return {
    checked_at: now.toISOString(),
    missing_agents: missingAgents,
    total_agents_checked: Object.keys(agentSchedules).length,
  };
}

async function sendEmailAlert(email: string, alerts: Alert[]): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email alert");
    return;
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const subject =
    criticalCount > 0
      ? `🚨 CRITICAL: ${criticalCount} Alert(s) - Settler`
      : `⚠️ ${alerts.length} Alert(s) - Settler`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: ${criticalCount > 0 ? "#dc2626" : "#f59e0b"};">
          ${criticalCount > 0 ? "🚨 CRITICAL ALERTS" : "⚠️ ALERTS"}
        </h1>
        ${alerts
          .map(
            (alert) => `
          <div style="background-color: ${getAlertColor(alert.severity)}; border-left: 4px solid ${getAlertBorderColor(alert.severity)}; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 8px; color: ${getAlertTextColor(alert.severity)};">
              ${alert.title}
            </h2>
            <p style="margin: 0 0 8px; color: ${getAlertTextColor(alert.severity)};">
              ${alert.message}
            </p>
            ${
              alert.check
                ? `<p style="margin: 0; font-size: 12px; color: ${getAlertTextColor(alert.severity)}; opacity: 0.8;">
              Check: ${alert.check}
            </p>`
                : ""
            }
          </div>
        `
          )
          .join("")}
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
          <a href="${Deno.env.get("FRONTEND_URL") || "https://settler.dev"}/founder">View Dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Settler Alerts <alerts@settler.dev>",
        to: email,
        subject,
        html,
      }),
    });
  } catch (error) {
    console.error("Failed to send email alert:", error);
    throw error;
  }
}

async function sendDigestEmail(email: string, digest: any): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping digest email");
    return;
  }

  const subject = `📊 Settler ${digest.type === "daily" ? "Daily" : "Weekly"} Digest - ${digest.date}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>📊 ${digest.type === "daily" ? "Daily" : "Weekly"} Digest</h1>
        <p style="color: #6b7280;">${digest.date}</p>
        
        ${
          digest.metrics
            ? `
          <h2>Metrics</h2>
          <ul>
            <li>New Users: ${digest.metrics.new_users || 0}</li>
            <li>MRR: $${digest.metrics.mrr || 0}</li>
            <li>Active Subscriptions: ${digest.metrics.active_subscriptions || 0}</li>
          </ul>
        `
            : ""
        }
        
        ${
          digest.insights && digest.insights.length > 0
            ? `
          <h2>Insights</h2>
          <ul>
            ${digest.insights.map((i: string) => `<li>${i}</li>`).join("")}
          </ul>
        `
            : ""
        }
        
        ${
          digest.recommendations && digest.recommendations.length > 0
            ? `
          <h2>Recommendations</h2>
          <ul>
            ${digest.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
          </ul>
        `
            : ""
        }
        
        ${
          digest.alerts && digest.alerts.length > 0
            ? `
          <h2>Recent Alerts (${digest.alerts.length})</h2>
          <ul>
            ${digest.alerts
              .slice(0, 5)
              .map((a: any) => `<li><strong>${a.severity.toUpperCase()}</strong>: ${a.title}</li>`)
              .join("")}
          </ul>
        `
            : ""
        }
        
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
          <a href="${Deno.env.get("FRONTEND_URL") || "https://settler.dev"}/founder">View Full Dashboard</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Settler Digest <digest@settler.dev>",
        to: email,
        subject,
        html,
      }),
    });
  } catch (error) {
    console.error("Failed to send digest email:", error);
    throw error;
  }
}

async function sendSlackAlert(webhookUrl: string, alerts: Alert[]): Promise<void> {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text:
          criticalCount > 0
            ? `🚨 ${criticalCount} Critical Alert(s)`
            : `⚠️ ${alerts.length} Alert(s)`,
      },
    },
    ...alerts.map((alert) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${alert.title}*\n${alert.message}\n${alert.check ? `_Check: ${alert.check}_` : ""}`,
      },
    })),
  ];

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
  } catch (error) {
    console.error("Failed to send Slack alert:", error);
  }
}

function getAlertColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#fee2e2";
    case "high":
      return "#fef3c7";
    case "medium":
      return "#dbeafe";
    default:
      return "#f3f4f6";
  }
}

function getAlertBorderColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f59e0b";
    case "medium":
      return "#2563eb";
    default:
      return "#6b7280";
  }
}

function getAlertTextColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#991b1b";
    case "high":
      return "#92400e";
    case "medium":
      return "#1e40af";
    default:
      return "#374151";
  }
}
