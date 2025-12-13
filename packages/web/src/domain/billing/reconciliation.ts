/**
 * Billing Reconciliation Service
 * 
 * Reconciles subscription status between Stripe and database.
 * Used when webhooks are missed or status gets out of sync.
 */

import Stripe from 'stripe';
import { prisma } from '@/shared/db/prismaClient';
import { getStripeClient } from './stripeService';
import { syncSubscription as syncSubscriptionFromStripe } from './stripeService';

// Helper to safely access Stripe subscription period end
function getStripePeriodEnd(subscription: Stripe.Subscription): number {
  if (subscription && typeof subscription === 'object' && 'current_period_end' in subscription) {
    const periodEnd = subscription.current_period_end;
    if (typeof periodEnd === 'number') {
      return periodEnd;
    }
  }
  return 0;
}

export interface ReconciliationResult {
  success: boolean;
  billingAccountId: string;
  changes: string[];
  errors: string[];
}

/**
 * Reconcile a single billing account from Stripe
 */
export async function reconcileBillingAccount(
  billingAccountId: string
): Promise<ReconciliationResult> {
  const changes: string[] = [];
  const errors: string[] = [];

  try {
    // Get billing account
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      select: {
        id: true,
        stripeCustomerId: true,
        email: true,
      },
    });

    if (!billingAccount) {
      return {
        success: false,
        billingAccountId,
        changes: [],
        errors: ['Billing account not found'],
      };
    }

    if (!billingAccount.stripeCustomerId) {
      return {
        success: true,
        billingAccountId,
        changes: ['No Stripe customer ID - account is on free plan'],
        errors: [],
      };
    }

    // Get Stripe customer subscriptions
    const stripe = getStripeClient();
    const subscriptions = await stripe.subscriptions.list({
      customer: billingAccount.stripeCustomerId,
      status: 'all',
      limit: 100,
    });

    // Get database subscriptions
    const dbSubscriptions = await prisma.subscription.findMany({
      where: { billingAccountId },
    });

    // Sync each Stripe subscription
    for (const stripeSub of subscriptions.data) {
      const dbSub = dbSubscriptions.find(
        (s) => s.stripeSubscriptionId === stripeSub.id
      );

      if (!dbSub) {
        // Subscription exists in Stripe but not in DB - create it
        await syncSubscriptionFromStripe(stripeSub);
        changes.push(`Created subscription ${stripeSub.id}`);
      } else {
        // Compare status
        if (dbSub.status !== stripeSub.status) {
          await syncSubscriptionFromStripe(stripeSub);
          changes.push(
            `Updated subscription ${stripeSub.id} status: ${dbSub.status} → ${stripeSub.status}`
          );
        }

        // Compare period dates
        const dbPeriodEnd = Math.floor(dbSub.currentPeriodEnd.getTime() / 1000);
        const stripePeriodEnd = getStripePeriodEnd(stripeSub);
        if (stripePeriodEnd > 0 && Math.abs(dbPeriodEnd - stripePeriodEnd) > 60) {
          // More than 1 minute difference
          await syncSubscriptionFromStripe(stripeSub);
          changes.push(`Updated subscription ${stripeSub.id} period dates`);
        }
      }
    }

    // Mark subscriptions as canceled if they don't exist in Stripe
    for (const dbSub of dbSubscriptions) {
      if (!dbSub.stripeSubscriptionId) continue;

      const existsInStripe = subscriptions.data.some(
        (s) => s.id === dbSub.stripeSubscriptionId
      );

      if (!existsInStripe && dbSub.status !== 'canceled') {
        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: 'canceled',
            cancelledAt: new Date(),
          },
        });
        changes.push(
          `Marked subscription ${dbSub.id} as canceled (not found in Stripe)`
        );
      }
    }

    return {
      success: true,
      billingAccountId,
      changes,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      billingAccountId,
      changes,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Reconcile all active subscriptions
 * Useful for bulk reconciliation after webhook outages
 */
export async function reconcileAllActiveSubscriptions(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: ReconciliationResult[];
}> {
  const results: ReconciliationResult[] = [];

  // Get all billing accounts with Stripe customer IDs
  const billingAccounts = await prisma.billingAccount.findMany({
    where: {
      stripeCustomerId: { not: null },
      status: 'active',
    },
    select: { id: true },
  });

  for (const account of billingAccounts) {
    const result = await reconcileBillingAccount(account.id);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: billingAccounts.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Find subscriptions that are out of sync
 */
export async function findOutOfSyncSubscriptions(): Promise<{
  billingAccountId: string;
  subscriptionId: string;
  issue: string;
}[]> {
  const issues: {
    billingAccountId: string;
    subscriptionId: string;
    issue: string;
  }[] = [];

  const stripe = getStripeClient();
  const dbSubscriptions = await prisma.subscription.findMany({
    where: {
      stripeSubscriptionId: { not: null },
      status: { in: ['active', 'trialing', 'past_due'] },
    },
    include: {
      billingAccount: {
        select: { stripeCustomerId: true },
      },
    },
  });

  for (const dbSub of dbSubscriptions) {
    if (!dbSub.stripeSubscriptionId || !dbSub.billingAccount.stripeCustomerId) {
      continue;
    }

    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        dbSub.stripeSubscriptionId
      );

      // Check status mismatch
      if (dbSub.status !== stripeSub.status) {
        issues.push({
          billingAccountId: dbSub.billingAccountId,
          subscriptionId: dbSub.id,
          issue: `Status mismatch: DB=${dbSub.status}, Stripe=${stripeSub.status}`,
        });
      }

      // Check period mismatch
      const dbPeriodEnd = Math.floor(dbSub.currentPeriodEnd.getTime() / 1000);
      const stripePeriodEnd = getStripePeriodEnd(stripeSub);
      if (stripePeriodEnd > 0 && Math.abs(dbPeriodEnd - stripePeriodEnd) > 60) {
        issues.push({
          billingAccountId: dbSub.billingAccountId,
          subscriptionId: dbSub.id,
          issue: `Period end mismatch: DB=${dbPeriodEnd}, Stripe=${stripePeriodEnd}`,
        });
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        // Subscription doesn't exist in Stripe
        issues.push({
          billingAccountId: dbSub.billingAccountId,
          subscriptionId: dbSub.id,
          issue: 'Subscription not found in Stripe',
        });
      }
    }
  }

  return issues;
}
