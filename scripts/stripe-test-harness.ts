#!/usr/bin/env tsx
/**
 * Stripe Test Harness
 *
 * Provides utilities for testing Stripe webhooks locally:
 * - npm run stripe:listen - Forward webhooks to local server
 * - npm run stripe:test - Send test webhook events
 *
 * Usage:
 *   npm run stripe:listen
 *   npm run stripe:test checkout.session.completed
 */

import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Generate Stripe webhook signature
 */
function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Send test webhook event to local server
 */
async function sendTestWebhook(eventType: string, data?: any): Promise<void> {
  const localUrl = process.env.WEBHOOK_URL || "http://localhost:3000/api/stripe/webhook";

  // Create test event payload
  const event: Stripe.Event = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2024-12-18.acacia",
    created: Math.floor(Date.now() / 1000),
    type: eventType as Stripe.Event.Type,
    livemode: false,
    pending_webhooks: 0,
    request: null,
    data: {
      object: data || {},
    },
  } as Stripe.Event;

  const payload = JSON.stringify(event);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);

  console.log(`[Stripe Test] Sending ${eventType} webhook to ${localUrl}`);
  console.log(`[Stripe Test] Event ID: ${event.id}`);

  try {
    const response = await fetch(localUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    console.log(`[Stripe Test] Response: ${response.status} ${response.statusText}`);
    console.log(`[Stripe Test] Body: ${responseText}`);

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${responseText}`);
    }

    console.log("[Stripe Test] ✅ Webhook sent successfully");
  } catch (error) {
    console.error("[Stripe Test] ❌ Failed to send webhook:", error);
    process.exit(1);
  }
}

/**
 * Listen for Stripe webhooks (using Stripe CLI forwarding)
 */
async function listenForWebhooks(): Promise<void> {
  console.log("[Stripe Listen] Starting webhook listener...");
  console.log(
    "[Stripe Listen] Make sure Stripe CLI is installed: https://stripe.com/docs/stripe-cli"
  );
  console.log(
    "[Stripe Listen] Run: stripe listen --forward-to http://localhost:3000/api/stripe/webhook"
  );
  console.log(
    "[Stripe Listen] Or use: stripe listen --forward-to http://localhost:3000/api/stripe/webhook --print-secret"
  );
}

// Main execution
const command = process.argv[2];

if (command === "listen") {
  listenForWebhooks().catch(console.error);
} else if (command === "test") {
  const eventType = process.argv[3] || "checkout.session.completed";

  if (!WEBHOOK_SECRET) {
    console.error("[Stripe Test] ❌ STRIPE_WEBHOOK_SECRET not set");
    console.error("[Stripe Test] Get it from: stripe listen --print-secret");
    process.exit(1);
  }

  sendTestWebhook(eventType).catch((error) => {
    console.error("[Stripe Test] ❌ Error:", error);
    process.exit(1);
  });
} else {
  console.log("Usage:");
  console.log("  npm run stripe:listen          - Show instructions for Stripe CLI");
  console.log("  npm run stripe:test <event>  - Send test webhook event");
  console.log("");
  console.log("Examples:");
  console.log("  npm run stripe:test checkout.session.completed");
  console.log("  npm run stripe:test customer.subscription.created");
  console.log("  npm run stripe:test customer.subscription.updated");
  console.log("  npm run stripe:test invoice.paid");
  process.exit(1);
}
