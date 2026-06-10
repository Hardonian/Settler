import { Router } from "express";
import { query } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { requireAuth } from "../../middleware/auth";
import { idempotencyMiddleware } from "../../middleware/idempotency";

export const billingRouter = Router();

// Retrieve current subscription status
billingRouter.get("/status", requireAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { rows } = await query(
      `SELECT tier, current_usage, usage_limit, stripe_subscription_id, status 
       FROM tenant_billing 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    if (rows.length === 0) {
      // Default to free tier
      return res.json({
        tier: "free",
        currentUsage: 0,
        usageLimit: 1000,
        status: "active",
      });
    }

    res.json({
      tier: rows[0].tier,
      currentUsage: parseInt(rows[0].current_usage, 10),
      usageLimit: rows[0].usage_limit === -1 ? Infinity : parseInt(rows[0].usage_limit, 10),
      status: rows[0].status,
    });
  } catch (error) {
    logError("Failed to fetch billing status", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Stripe Checkout Session
billingRouter.post("/checkout", requireAuth, idempotencyMiddleware(), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { tier } = req.body;

    logInfo("Creating checkout session", { tenantId, tier });

    // In a real implementation, we would call Stripe SDK here:
    // const session = await stripe.checkout.sessions.create({...})

    // For now, mock a checkout URL
    res.json({
      url: `https://checkout.stripe.com/pay/cs_test_mock_${Date.now()}`,
    });
  } catch (error) {
    logError("Failed to create checkout session", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Stripe Webhook Endpoint (No requireAuth since Stripe calls this)
billingRouter.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    // 1. Verify Stripe signature
    // const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

    // 2. Handle event
    // if (event.type === 'invoice.payment_succeeded') { ... update tenant_billing ... }

    logInfo("Received Stripe webhook", { signature: sig });
    res.json({ received: true });
  } catch (error) {
    logError("Stripe webhook failed", error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Unknown"}`);
  }
});

export default billingRouter;
