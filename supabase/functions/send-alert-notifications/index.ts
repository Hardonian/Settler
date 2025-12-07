// Edge Function: send-alert-notifications
// Purpose: Send alert notifications via email, webhook, WhatsApp, Telegram
// Authentication: Service role only (internal)
// Trigger: Cron job (every 5 minutes)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  try {
    // Only allow service role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get pending notifications
    const { data: notifications, error } = await supabase.rpc("send_pending_alert_notifications");

    if (error) {
      console.error("Error getting pending notifications:", error);
      return new Response(JSON.stringify({ error: "Failed to get notifications" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const notification of notifications || []) {
      try {
        let sent = false;

        switch (notification.notification_type) {
          case "email":
            sent = await sendEmail(
              notification.recipient,
              notification.title || "Alert",
              notification.message || ""
            );
            break;

          case "webhook":
            sent = await sendWebhook(
              notification.recipient,
              notification.title || "Alert",
              notification.message || ""
            );
            break;

          case "whatsapp":
            sent = await sendWhatsApp(notification.recipient, notification.message || "");
            break;

          case "telegram":
            sent = await sendTelegram(notification.recipient, notification.message || "");
            break;
        }

        // Update notification status
        if (sent) {
          await supabase
            .from("alert_notifications")
            .update({
              status: "delivered",
              delivered_at: new Date().toISOString(),
            })
            .eq("id", notification.notification_id);
        } else {
          await supabase
            .from("alert_notifications")
            .update({
              status: "failed",
              error_message: "Failed to send notification",
            })
            .eq("id", notification.notification_id);
        }

        results.push({
          notification_id: notification.notification_id,
          status: sent ? "delivered" : "failed",
        });
      } catch (error) {
        console.error(`Error sending notification ${notification.notification_id}:`, error);
        await supabase
          .from("alert_notifications")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq("id", notification.notification_id);

        results.push({
          notification_id: notification.notification_id,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Settler.dev Alerts <alerts@settler.dev>",
        to: [to],
        subject,
        html: `<p>${body}</p>`,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function sendWebhook(url: string, title: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending webhook:", error);
    return false;
  }
}

async function sendWhatsApp(number: string, message: string): Promise<boolean> {
  if (!WHATSAPP_API_KEY) {
    console.warn("WHATSAPP_API_KEY not configured");
    return false;
  }

  // TODO: Implement WhatsApp Business API integration
  console.log("WhatsApp notification (not implemented):", number, message);
  return false;
}

async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
}
