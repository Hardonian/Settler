import express, { Router, Response } from "express";
import { queryWithTenant } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { idempotencyMiddleware } from "../../middleware/idempotency";
import { getEnv } from "../../utils/env";

export const billingRouter: Router = express.Router();

// Retrieve current subscription status
billingRouter.get(
  "/status",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const rows = await queryWithTenant<{
        tier: string;
        current_usage: number;
        usage_limit: number;
        stripe_subscription_id: string;
        status: string;
      }>(
        tenantId,
        `SELECT tier, current_usage, usage_limit, stripe_subscription_id, status 
       FROM tenant_billing 
       WHERE tenant_id = $1`,
        [tenantId]
      );

      const firstRow = rows[0];

      if (!firstRow) {
        // Default to free tier
        res.json({
          tier: "free",
          currentUsage: 0,
          usageLimit: 1000,
          status: "active",
        });
        return;
      }

      res.json({
        tier: firstRow.tier,
        currentUsage: Number(firstRow.current_usage),
        usageLimit: Number(firstRow.usage_limit) === -1 ? Infinity : Number(firstRow.usage_limit),
        status: firstRow.status,
      });
    } catch (error) {
      logError("Failed to fetch billing status", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create Stripe Checkout Session
billingRouter.post(
  "/checkout",
  authMiddleware,
  idempotencyMiddleware(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { priceId, tier } = req.body;

      logInfo("Creating checkout session", { tenantId, priceId, tier });

      const stripe = new (await import("stripe")).default(
        getEnv("STRIPE_SECRET_KEY") || "",
        { apiVersion: "2023-10-16" }
      );

      if (!getEnv("STRIPE_SECRET_KEY")) {
        // Fallback to mock if not configured (dev)
        res.json({
          url: `https://checkout.stripe.com/pay/cs_test_mock_${Date.now()}`,
        });
        return;
      }

      // Get or create Stripe customer for tenant
      const tenantRows = await queryWithTenant<{ stripe_customer_id: string; name: string }>(
        tenantId,
        `SELECT stripe_customer_id, name FROM tenant_billing WHERE tenant_id = $1`,
        [tenantId]
      );

      let customerId = tenantRows[0]?.stripe_customer_id;
      const tenantName = tenantRows[0]?.name || "Settler Tenant";

      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { tenant_id: tenantId },
          name: tenantName,
        });
        customerId = customer.id;

        // Persist the customer ID
        await queryWithTenant(
          tenantId,
          `UPDATE tenant_billing SET stripe_customer_id = $1 WHERE tenant_id = $2`,
          [customerId, tenantId]
        );
      }

      // Create checkout session
      const origin = req.headers.origin || req.headers.referer || "https://app.settler.dev";
      const successUrl = `${origin}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/settings?billing=canceled`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          tenant_id: tenantId,
        },
        client_reference_id: tenantId,
        subscription_data: {
          metadata: {
            tenant_id: tenantId,
          },
        },
      });

      if (!session.url) {
        throw new Error("Stripe returned empty checkout URL");
      }

      res.json({ url: session.url });
    } catch (error) {
      logError("Failed to create checkout session", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Stripe Webhook Endpoint (No authMiddleware — Stripe calls this)
billingRouter.post("/webhook", async (req: AuthRequest, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET") || "";

  if (!webhookSecret) {
    logError("STRIPE_WEBHOOK_SECRET not configured", {});
    res.status(503).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: any;
  try {
    const stripe = new (await import("stripe")).default(
      getEnv("STRIPE_SECRET_KEY") || "",
      { apiVersion: "2023-10-16" }
    );
    event = stripe.webhooks.constructEvent(
      JSON.stringify(req.body),
      sig as string,
      webhookSecret
    );
  } catch (err: any) {
    logError("Stripe webhook signature verification failed", err);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  try {
    const tenantId =
      event.data?.object?.metadata?.tenant_id ||
      event.data?.object?.client_reference_id ||
      null;

    if (!tenantId) {
      logInfo("Webhook received with no tenant_id, skipping", { type: event.type });
      res.json({ received: true, skipped: true });
      return;
    }

    // Map Stripe price ID to plan tier
    const priceToTier: Record<string, string> = {
      [getEnv("STRIPE_PRICE_ID_STARTER") || ""]: "starter",
      [getEnv("STRIPE_PRICE_ID_GROWTH") || ""]: "growth",
    };

    const subscriptionId = event.data?.object?.subscription || event.data?.object?.id;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const priceId = session.metadata?.price_id || "";
        const tier = priceToTier[priceId] || "starter";
        await queryWithTenant(
          tenantId,
          `UPDATE tenant_billing SET status = 'active', tier = $1, stripe_subscription_id = $2 WHERE tenant_id = $3`,
          [tier, session.subscription, tenantId]
        );
        logInfo("Checkout completed", { tenantId, tier, subscriptionId });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id || "";
        const tier = priceToTier[priceId] || "growth";
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "inactive";
        await queryWithTenant(
          tenantId,
          `UPDATE tenant_billing SET tier = $1, status = $2, stripe_subscription_id = $3, updated_at = NOW() WHERE tenant_id = $4`,
          [tier, status, sub.id, tenantId]
        );
        logInfo("Subscription updated", { tenantId, tier, status, subscriptionId: sub.id });
        break;
      }
      case "customer.subscription.deleted": {
        await queryWithTenant(
          tenantId,
          `UPDATE tenant_billing SET status = 'canceled', updated_at = NOW() WHERE tenant_id = $1`,
          [tenantId]
        );
        logInfo("Subscription canceled", { tenantId });
        break;
      }
      case "invoice.payment_failed": {
        await queryWithTenant(
          tenantId,
          `UPDATE tenant_billing SET status = 'past_due', updated_at = NOW() WHERE tenant_id = $1`,
          [tenantId]
        );
        logInfo("Payment failed", { tenantId });
        break;
      }
      default:
        logInfo("Unhandled webhook event", { type: event.type, tenantId });
    }

    res.json({ received: true });
  } catch (error) {
    logError("Stripe webhook processing failed", error);
    res.status(500).json({ error: "Webhook processing error" });
  }
});

export default billingRouter as any;
