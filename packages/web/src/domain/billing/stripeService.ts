/**
 * Stripe Service
 * 
 * Handles Stripe integration: customers, subscriptions, checkout, customer portal.
 * Includes proper error handling, input validation, and security measures.
 */

import Stripe from 'stripe';
import { prisma } from '@/shared/db/prismaClient';
import { getPlanConfig, PlanCode } from './planConfig';
import { generateIdempotencyKey } from '@/lib/stripe/idempotency';

/**
 * Lazy Stripe client initialization
 * Only initializes when actually needed (at runtime), not during build time
 */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      // Demo mode: return null instead of throwing
      // eslint-disable-next-line no-console
      console.warn('[Stripe] STRIPE_SECRET_KEY not configured, running in demo mode');
      return null;
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover' as any, // Cast to any to avoid strict version check if types are outdated
      typescript: true,
    });
  }
  return stripeInstance;
}

/**
 * Check if Stripe is configured (not in demo mode)
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Export stripe client getter function
 * Use this to get the Stripe instance when needed
 * Returns null if Stripe is not configured (demo mode)
 */
export function getStripeClient(): Stripe | null {
  return getStripe();
}

/**
 * Export stripe client proxy for backward compatibility
 * This allows existing code to use `stripe` as before
 * The proxy lazily initializes the Stripe client when properties are accessed
 */
// Proxy that handles demo mode gracefully
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    if (!instance) {
      // Return a no-op function for demo mode
      return () => {
        throw new Error('Stripe is not configured. Running in demo mode.');
      };
    }
    return (instance as any)[prop];
  },
});

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Create or get Stripe customer for a billing account
 */
export async function getOrCreateStripeCustomer(
  billingAccountId: string
): Promise<string> {
  // Input validation
  if (!billingAccountId || !isValidUUID(billingAccountId)) {
    throw new Error('Invalid billing account ID');
  }

  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    // Demo mode: return a mock customer ID
    // eslint-disable-next-line no-console
    console.warn('[Stripe] Demo mode: returning mock customer ID');
    return 'cus_demo_' + billingAccountId.substring(0, 8);
  }

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

  // Validate email before creating customer
  if (!account.email || !account.email.includes('@')) {
    throw new Error('Invalid email address for billing account');
  }

  // Create new Stripe customer with idempotency and rate limit handling
  const { safeStripeCall } = await import('@/lib/stripe/rate-limit-handler');
  const result = await safeStripeCall(async (stripe) => {
    return await stripe.customers.create(
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
  });
  const customer = result.data;

  // Update billing account with customer ID atomically
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
  // Input validation
  if (!billingAccountId || !isValidUUID(billingAccountId)) {
    throw new Error('Invalid billing account ID');
  }

  if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
    throw new Error('Invalid URL format for success or cancel URL');
  }

  // Ensure URLs are from same origin (security)
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://settler.dev';
  if (!successUrl.startsWith(origin) || !cancelUrl.startsWith(origin)) {
    throw new Error('URLs must be from the same origin');
  }

  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    // Demo mode: return a mock checkout session
    // eslint-disable-next-line no-console
    console.warn('[Stripe] Demo mode: returning mock checkout session');
    return {
      id: 'cs_demo_' + Date.now(),
      object: 'checkout.session',
      url: `${successUrl}?demo=true&plan=${planCode}`,
      // Add minimal required fields
    } as Stripe.Checkout.Session;
  }

  const planConfig = getPlanConfig(planCode);
  if (!planConfig || !planConfig.stripePriceId) {
    throw new Error(`Plan ${planCode} does not have a Stripe price ID configured`);
  }

  const customerId = await getOrCreateStripeCustomer(billingAccountId);

  // Use safe Stripe call with rate limit handling
  const { safeStripeCall } = await import('@/lib/stripe/rate-limit-handler');
  const result = await safeStripeCall(async (stripe) => {
    return await stripe.checkout.sessions.create(
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
  });

  return result.data;
}

/**
 * Create Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  billingAccountId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  // Input validation
  if (!billingAccountId || !isValidUUID(billingAccountId)) {
    throw new Error('Invalid billing account ID');
  }

  if (!isValidUrl(returnUrl)) {
    throw new Error('Invalid URL format for return URL');
  }

  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    // Demo mode: return a mock portal session
    // eslint-disable-next-line no-console
    console.warn('[Stripe] Demo mode: returning mock portal session');
    return {
      id: 'bps_demo_' + Date.now(),
      object: 'billing_portal.session',
      url: `${returnUrl}?demo=true`,
      // Add minimal required fields
    } as Stripe.BillingPortal.Session;
  }

  const account = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { stripeCustomerId: true },
  });

  if (!account || !account.stripeCustomerId) {
    throw new Error('No Stripe customer found for this account');
  }

  // Use safe Stripe call with rate limit handling
  const { safeStripeCall } = await import('@/lib/stripe/rate-limit-handler');
  const result = await safeStripeCall(async (stripe) => {
    return await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId || '',
      return_url: returnUrl,
    });
  });

  return result.data;
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

/**
 * Sync subscription data from Stripe to database
 * Exported for use in reconciliation service
 */
export async function syncSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
  const billingAccountId = stripeSubscription.metadata?.billingAccountId;
  if (!billingAccountId || typeof billingAccountId !== 'string' || !isValidUUID(billingAccountId)) {
    // Log error but don't throw - webhook processing should be resilient
    // eslint-disable-next-line no-console
    console.error('[Stripe] Subscription missing valid billingAccountId metadata', {
      subscriptionId: stripeSubscription.id,
      metadata: stripeSubscription.metadata,
    });
    return;
  }

  // Validate billing account exists
  const accountExists = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { id: true },
  });
  if (!accountExists) {
    // eslint-disable-next-line no-console
    console.error('[Stripe] Billing account not found', { billingAccountId, subscriptionId: stripeSubscription.id });
    return;
  }

  // Get plan code from metadata or price
  const planCode = (stripeSubscription.metadata?.planCode || 'starter') as PlanCode;
  const planConfig = getPlanConfig(planCode);
  if (!planConfig) {
    // eslint-disable-next-line no-console
    console.error('[Stripe] Invalid plan code', { planCode, subscriptionId: stripeSubscription.id });
    return;
  }

  // Map to legacy planId for compatibility
  const planIdMap: Partial<Record<PlanCode, string>> = {
    starter: 'base',
    growth: 'pro',
    scale: 'enterprise',
    enterprise: 'enterprise',
  };
  const planId = planIdMap[planCode] || 'base';

  // Extract period dates safely with type checking
  // Stripe subscription properties are numbers (Unix timestamps)
  const periodStart = (stripeSubscription as unknown as { current_period_start: number }).current_period_start;
  const periodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;
  const currentPeriodStart = typeof periodStart === 'number' && periodStart > 0
    ? new Date(periodStart * 1000)
    : new Date();
  const currentPeriodEnd = typeof periodEnd === 'number' && periodEnd > 0
    ? new Date(periodEnd * 1000)
    : new Date();

  // Safely extract optional dates
  const canceledAt = (stripeSubscription as unknown as { canceled_at: number | null }).canceled_at;
  const trialStart = (stripeSubscription as unknown as { trial_start: number | null }).trial_start;
  const trialEnd = (stripeSubscription as unknown as { trial_end: number | null }).trial_end;

  const cancelledAt = canceledAt && typeof canceledAt === 'number' && canceledAt > 0
    ? new Date(canceledAt * 1000)
    : null;
  const trialStartDate = trialStart && typeof trialStart === 'number' && trialStart > 0
    ? new Date(trialStart * 1000)
    : null;
  const trialEndDate = trialEnd && typeof trialEnd === 'number' && trialEnd > 0
    ? new Date(trialEnd * 1000)
    : null;

  // Safely serialize metadata for Prisma JSON type
  const metadata = stripeSubscription.metadata
    ? (JSON.parse(JSON.stringify(stripeSubscription.metadata)) as unknown)
    : null;

  // Upsert subscription with transaction for atomicity
  await prisma.$transaction(async (tx: any) => {
    await tx.subscription.upsert({
      where: {
        stripeSubscriptionId: stripeSubscription.id,
      },
      update: {
        planId,
        planName: planConfig.name,
        status: stripeSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
        cancelledAt,
        trialStart: trialStartDate,
        trialEnd: trialEndDate,
        metadata: metadata as never,
      },
      create: {
        billingAccountId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0]?.price.id || null,
        planId,
        planName: planConfig.name,
        status: stripeSubscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
        cancelledAt,
        trialStart: trialStartDate,
        trialEnd: trialEndDate,
        metadata: metadata as never,
      },
    });
  });
}

/**
 * Handle subscription deletion
 */
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
