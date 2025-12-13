/**
 * Business Metrics Server-Side Functions
 * 
 * Server-only functions for querying business metrics from the database.
 * These functions use Prisma and can only be called from API routes or server components.
 * 
 * For client-safe tracking functions, see business.ts
 */

import { prisma } from '@/shared/db/prismaClient';
import type { BusinessMetrics } from './business';

/**
 * Get business metrics snapshot (SERVER-ONLY)
 * 
 * This function queries the database and can only be used in:
 * - API routes
 * - Server components
 * - Server actions
 */
export async function getBusinessMetrics(
  startDate: Date,
  endDate: Date
): Promise<BusinessMetrics> {
  // Get subscription metrics
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: ['active', 'trialing'],
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      planId: true,
      planName: true,
      status: true,
    },
  });

  // Calculate MRR (simplified - would need actual price data)
  const subscriptionsByPlan: Record<string, number> = {};
  subscriptions.forEach((sub) => {
    subscriptionsByPlan[sub.planName] = (subscriptionsByPlan[sub.planName] || 0) + 1;
  });

  // Get usage metrics
  const usageEvents = await prisma.usageEvent.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      eventType: true,
      quantity: true,
    },
  });

  const apiCallsByService: Record<string, number> = {};
  let totalApiCalls = 0;

  usageEvents.forEach((event) => {
    const service = event.eventType?.split(':')[0] || 'unknown';
    const quantity = typeof event.quantity === 'number' ? event.quantity : Number(event.quantity || 0);
    apiCallsByService[service] = (apiCallsByService[service] || 0) + quantity;
    totalApiCalls += quantity;
  });

  // Get churn metrics
  const cancellations = await prisma.subscription.count({
    where: {
      status: 'canceled',
      cancelledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // TODO: Track upgrades/downgrades in a separate table or via webhook events
  const upgrades = 0;
  const downgrades = 0;

  return {
    checkoutStarted: 0, // Would be tracked via analytics
    checkoutCompleted: 0,
    checkoutCanceled: 0,
    activeSubscriptions: subscriptions.length,
    subscriptionsByPlan,
    mrr: 0, // Would calculate from actual subscription prices
    totalApiCalls,
    apiCallsByService,
    cancellations,
    upgrades,
    downgrades,
  };
}
