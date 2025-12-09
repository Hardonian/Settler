/**
 * Usage Accounting Service
 * 
 * Aggregates usage events and calculates current period usage for billing.
 */

import { prisma } from '@/shared/db/prismaClient';
import { ServiceCode } from './planConfig';

export interface ServiceUsage {
  service: ServiceCode;
  callsUsed: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface AccountUsage {
  billingAccountId: string;
  periodStart: Date;
  periodEnd: Date;
  services: {
    reconcile: number;
    receipts: number;
    featureFlags: number;
  };
}

/**
 * Get current billing period for an account
 */
export async function getCurrentBillingPeriod(
  billingAccountId: string
): Promise<{ start: Date; end: Date }> {
  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      billingAccountId,
      status: {
        in: ['active', 'trialing'],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (subscription) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  // Default to calendar month for free plan
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Get usage for a specific service in a period
 */
export async function getServiceUsage(
  billingAccountId: string,
  service: ServiceCode,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Map service codes to eventType patterns
  // Usage events use format: "service:operation" (e.g., "settler-receipts:parse_sync")
  const eventTypePatterns: Record<ServiceCode, string> = {
    reconcile: 'settler-reconcile',
    receipts: 'settler-receipts',
    featureFlags: 'settler-feature-flags',
  };

  const pattern = eventTypePatterns[service];

  // Aggregate usage events - match events that start with the service pattern
  const events = await prisma.usageEvent.findMany({
    where: {
      billingAccountId,
      eventType: {
        startsWith: pattern,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      quantity: true,
    },
  });

  // Sum quantities
  return events.reduce((total, event) => {
    return total + Number(event.quantity);
  }, 0);
}

/**
 * Get usage for all services in current period
 */
export async function getAccountUsage(
  billingAccountId: string
): Promise<AccountUsage> {
  const period = await getCurrentBillingPeriod(billingAccountId);

  const [reconcileUsage, receiptsUsage, flagsUsage] = await Promise.all([
    getServiceUsage(billingAccountId, 'reconcile', period.start, period.end),
    getServiceUsage(billingAccountId, 'receipts', period.start, period.end),
    getServiceUsage(billingAccountId, 'featureFlags', period.start, period.end),
  ]);

  return {
    billingAccountId,
    periodStart: period.start,
    periodEnd: period.end,
    services: {
      reconcile: reconcileUsage,
      receipts: receiptsUsage,
      featureFlags: flagsUsage,
    },
  };
}
