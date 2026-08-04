import Stripe from "stripe";
import { getEnv } from "../utils/env";

// In a real implementation, this would be injected via a DI container
const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion, // Must match installed Stripe SDK types
});

export class BillingService {
  /**
   * Report metered usage for a tenant (Day One Monetization)
   */
  async reportUsage(tenantId: string, transactionCount: number): Promise<void> {
    // Stripe retired subscriptionItems.createUsageRecord. Do not invent a Billing
    // Meter event name or silently mark local usage as sent; operators must wire a
    // configured meter explicitly before enabling metered billing.
    void stripe;
    throw new Error(
      `Metered usage reporting is not configured for tenant ${tenantId}; refusing to report ${transactionCount} units.`
    );
  }

  /**
   * Handle incoming Stripe webhooks (upgrades, downgrades, failed payments)
   */
  async handleWebhook(body: string | Buffer, signature: string): Promise<void> {
    const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET") || "";
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      throw new Error("Webhook signature verification failed.");
    }

    // Zero-Touch Ops: Automatically handle billing events without manual intervention
    switch (event.type) {
      case "invoice.payment_succeeded":
        // Provision access / reset limits
        break;
      case "invoice.payment_failed":
        // Automatically downgrade the tenant / send automated dunning email
        break;
      case "customer.subscription.deleted":
        // Revoke access automatically
        break;
      default:
        console.info(`Unhandled event type ${event.type}`);
    }
  }
}
