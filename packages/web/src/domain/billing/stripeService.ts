/**
 * Stripe Service
 * 
 * Handles Stripe integration: customers, subscriptions, checkout, customer portal.
 */

import Stripe from 'stripe';
import { prisma } from '@/shared/db/prismaClient';
import { getPlanConfig, PlanCode } from './planConfig';
import { generateIdempotencyKey } from '@/lib/stripe/idempotency';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

/**
 * Create or get Stripe customer for a billing account
 */
export async function getOrCreateStripeCustomer(
  billingAccountId: string
): Promise<string> {
  const account = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!account) {
    throw new Error('Billing account not found');
  }

  // Return existing customer ID if present
  if (account.stripeCustomerId) {
    return account.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create(
    {
      email: account.email,
      name: account.name || undefined,
      metadata: {
        billingAccountId,
      },
    },
    {
      idempotencyKey: generateIdempotencyKey('create_customer', billingAccountId),
    }
  );

  // Update billing account with customer ID
  await prisma.billingAccount.update({
    where: { id: billingAccountId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  billingAccountId: string,
  planCode: PlanCode,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const planConfig = getPlanConfig(planCode);
  if (!planConfig || !planConfig.stripePriceId) {
    throw new Error(`Plan ${planCode} does not have a Stripe price ID configured`);
  }

  const customerId = await getOrCreateStripeCustomer(billingAccountId);

  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        billingAccountId,
        planCode,
      },
      subscription_data: {
        metadata: {
          billingAccountId,
          planCode,
        },
      },
    },
    {
      idempotencyKey: generateIdempotencyKey('checkout_session', billingAccountId, planCode),
    }
  );

  return session;
}

/**
 * Create Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  billingAccountId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const account = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { stripeCustomerId: true },
  });

  if (!account || !account.stripeCustomerId) {
    throw new Error('No Stripe customer found for this account');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Sync subscription from Stripe webhook event
 */
export async function syncSubscriptionFromWebhook(
  event: Stripe.Event
): Promise<void> {
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    await syncSubscription(subscription);
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionDeleted(subscription);
  }
}

async function syncSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
  const billingAccountId = stripeSubscription.metadata?.billingAccountId;
  if (!billingAccountId) {
    console.warn('Subscription missing billingAccountId metadata', stripeSubscription.id);
    return;
  }

  // Get plan code from metadata or price
  const planCode = (stripeSubscription.metadata?.planCode || 'free') as PlanCode;
  const planConfig = getPlanConfig(planCode);
  if (!planConfig) {
    console.warn('Invalid plan code', planCode);
    return;
  }

  // Map to legacy planId for compatibility
  const planIdMap: Record<PlanCode, string> = {
    free: 'base',
    pro: 'pro',
    scale: 'enterprise',
  };
  const planId = planIdMap[planCode] || 'base';

  // Upsert subscription
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: stripeSubscription.id,
    },
    update: {
      planId,
      planName: planConfig.name,
      status: stripeSubscription.status,
      currentPeriodStart: new Date((stripeSubscription.current_period_start as number) * 1000),
      currentPeriodEnd: new Date((stripeSubscription.current_period_end as number) * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      cancelledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      metadata: stripeSubscription.metadata ? JSON.parse(JSON.stringify(stripeSubscription.metadata)) : {},
    },
    create: {
      billingAccountId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id || null,
      planId,
      planName: planConfig.name,
      status: stripeSubscription.status,
      currentPeriodStart: new Date((stripeSubscription.current_period_start as number) * 1000),
      currentPeriodEnd: new Date((stripeSubscription.current_period_end as number) * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      cancelledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      metadata: stripeSubscription.metadata ? JSON.parse(JSON.stringify(stripeSubscription.metadata)) : {},
    },
  });
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: stripeSubscription.id,
    },
    data: {
      status: 'canceled',
      cancelledAt: new Date(),
    },
  });
}
