import Stripe from 'stripe';
import { getEnv } from '../utils/env';

// In a real implementation, this would be injected via a DI container
const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16', // Using standard API version
});

export class BillingService {
  /**
   * Report metered usage for a tenant (Day One Monetization)
   */
  async reportUsage(tenantId: string, transactionCount: number): Promise<void> {
    try {
      // Lookup the Stripe Subscription Item ID for this tenant from your DB
      // const subscriptionItemId = await db.getSubscriptionItemId(tenantId);
      const subscriptionItemId = `si_mock_${tenantId}`; // Stub

      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity: transactionCount,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });
      console.log(`Successfully reported ${transactionCount} transactions for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to report usage for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming Stripe webhooks (upgrades, downgrades, failed payments)
   */
  async handleWebhook(body: string | Buffer, signature: string): Promise<void> {
    const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET') || '';
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err);
      throw new Error('Webhook signature verification failed.');
    }

    // Zero-Touch Ops: Automatically handle billing events without manual intervention
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Provision access / reset limits
        break;
      case 'invoice.payment_failed':
        // Automatically downgrade the tenant / send automated dunning email
        break;
      case 'customer.subscription.deleted':
        // Revoke access automatically
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}
