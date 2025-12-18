/**
 * Usage Accounting Service
 * 
 * Aggregates usage events and calculates current period usage for billing.
 * Optimized with efficient queries and proper error handling.
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
    ingestions: number;
    exports: number;
  };
}

/**
 * Get current billing period for an account
 */
export async function getCurrentBillingPeriod(
  billingAccountId: string
): Promise<{ start: Date; end: Date }> {
  // Validate input
  if (!billingAccountId || typeof billingAccountId !== 'string') {
    throw new Error('Invalid billing account ID');
  }

  // Get active subscription with optimized query
  const subscription = await prisma.subscription.findFirst({
    where: {
      billingAccountId,
      status: {
        in: ['active', 'trialing'],
      },
    },
    select: {
      currentPeriodStart: true,
      currentPeriodEnd: true,
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
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Get usage for a specific service in a period
 * Optimized with aggregation query
 */
export async function getServiceUsage(
  billingAccountId: string,
  service: ServiceCode,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Validate inputs
  if (!billingAccountId || typeof billingAccountId !== 'string') {
    throw new Error('Invalid billing account ID');
  }
  if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date range');
  }
  if (startDate > endDate) {
    throw new Error('Start date must be before end date');
  }

  // Map service codes to eventType patterns
  // Usage events use format: "service:operation" (e.g., "settler-receipts:parse_sync")
  const eventTypePatterns: Record<ServiceCode, string> = {
    reconcile: 'settler-reconcile',
    receipts: 'settler-receipts',
    featureFlags: 'settler-feature-flags',
    ingestions: 'settler-ingestions',
    exports: 'settler-exports',
  };

  const pattern = eventTypePatterns[service];
  if (!pattern) {
    throw new Error(`Invalid service code: ${service}`);
  }

  // Use aggregation for better performance instead of fetching all events
  const result = await prisma.usageEvent.aggregate({
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
    _sum: {
      quantity: true,
    },
  });

  // Return sum or 0 if null
  return Number(result._sum.quantity) || 0;
}

/**
 * Get usage for all services in current period
 * Optimized with parallel queries
 */
export async function getAccountUsage(
  billingAccountId: string
): Promise<AccountUsage> {
  // Validate input
  if (!billingAccountId || typeof billingAccountId !== 'string') {
    throw new Error('Invalid billing account ID');
  }

  const period = await getCurrentBillingPeriod(billingAccountId);

  // Parallel queries for better performance
  const [reconcileUsage, receiptsUsage, flagsUsage, ingestionsUsage, exportsUsage] = await Promise.all([
    getServiceUsage(billingAccountId, 'reconcile', period.start, period.end),
    getServiceUsage(billingAccountId, 'receipts', period.start, period.end),
    getServiceUsage(billingAccountId, 'featureFlags', period.start, period.end),
    getServiceUsage(billingAccountId, 'ingestions', period.start, period.end),
    getServiceUsage(billingAccountId, 'exports', period.start, period.end),
  ]);

  return {
    billingAccountId,
    periodStart: period.start,
    periodEnd: period.end,
    services: {
      reconcile: reconcileUsage,
      receipts: receiptsUsage,
      featureFlags: flagsUsage,
      ingestions: ingestionsUsage,
      exports: exportsUsage,
    },
  };
}
