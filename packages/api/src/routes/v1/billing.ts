import express, { Router, Response } from "express";
import { queryWithTenant } from "../../db";
import { logInfo, logError } from "../../utils/logger";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { idempotencyMiddleware } from "../../middleware/idempotency";

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
  }
);

// Stripe Webhook Endpoint (No authMiddleware since Stripe calls this)
billingRouter.post("/webhook", async (req: AuthRequest, res: Response): Promise<void> => {
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

export default billingRouter as any;
