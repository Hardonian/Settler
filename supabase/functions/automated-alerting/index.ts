// Edge Function: automated-alerting
// Purpose: Send alerts for critical health check failures
// Trigger: Called by health checks function or scheduled

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
  check: string;
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

    const body = await req.json().catch(() => ({}));
    const alerts: Alert[] = body.alerts || [];

    if (alerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No alerts to send" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    const highAlerts = alerts.filter((a) => a.severity === "high");

    // Send email alerts for critical/high severity
    const alertEmail = Deno.env.get("ALERT_EMAIL") || Deno.env.get("FOUNDER_EMAIL");
    
    if (alertEmail && (criticalAlerts.length > 0 || highAlerts.length > 0)) {
      await sendEmailAlert(alertEmail, criticalAlerts.concat(highAlerts));
    }

    // Send Slack webhook if configured
    const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackWebhookUrl && (criticalAlerts.length > 0 || highAlerts.length > 0)) {
      await sendSlackAlert(slackWebhookUrl, criticalAlerts.concat(highAlerts));
    }

    // Log alerts to database
    await supabaseClient.from("alerts").insert(
      alerts.map((alert) => ({
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        check_type: alert.check,
        details: alert.details || {},
        sent_at: new Date().toISOString(),
      }))
    ).catch(() => {
      // Table might not exist, that's okay
    });

    return new Response(
      JSON.stringify({
        success: true,
        alerts_sent: criticalAlerts.length + highAlerts.length,
        total_alerts: alerts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Alerting error:", error);
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

async function sendEmailAlert(email: string, alerts: Alert[]): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email alert");
    return;
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const subject = criticalCount > 0
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
        <h1 style="color: ${criticalCount > 0 ? '#dc2626' : '#f59e0b'};">
          ${criticalCount > 0 ? '🚨 CRITICAL ALERTS' : '⚠️ ALERTS'}
        </h1>
        ${alerts.map((alert) => `
          <div style="background-color: ${getAlertColor(alert.severity)}; border-left: 4px solid ${getAlertBorderColor(alert.severity)}; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h2 style="margin: 0 0 8px; color: ${getAlertTextColor(alert.severity)};">
              ${alert.title}
            </h2>
            <p style="margin: 0 0 8px; color: ${getAlertTextColor(alert.severity)};">
              ${alert.message}
            </p>
            <p style="margin: 0; font-size: 12px; color: ${getAlertTextColor(alert.severity)}; opacity: 0.8;">
              Check: ${alert.check}
            </p>
          </div>
        `).join('')}
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
        "Authorization": `Bearer ${resendApiKey}`,
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
  }
}

async function sendSlackAlert(webhookUrl: string, alerts: Alert[]): Promise<void> {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: criticalCount > 0 ? `🚨 ${criticalCount} Critical Alert(s)` : `⚠️ ${alerts.length} Alert(s)`,
      },
    },
    ...alerts.map((alert) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${alert.title}*\n${alert.message}\n_Check: ${alert.check}_`,
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
