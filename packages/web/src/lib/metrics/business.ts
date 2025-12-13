/**
 * Business Metrics Tracking
 * 
 * Tracks key business events for analytics and reporting.
 * All events are sent to analytics service and can be queried for dashboards.
 */

import { analytics } from '@/lib/analytics';
import { prisma } from '@/shared/db/prismaClient';

export interface BusinessMetrics {
  // Conversion metrics
  checkoutStarted: number;
  checkoutCompleted: number;
  checkoutCanceled: number;
  
  // Subscription metrics
  activeSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  mrr: number; // Monthly Recurring Revenue
  
  // Usage metrics
  totalApiCalls: number;
  apiCallsByService: Record<string, number>;
  
  // Churn metrics
  cancellations: number;
  upgrades: number;
  downgrades: number;
}

/**
 * Track business event
 */
export function trackBusinessEvent(
  event: string,
  properties: Record<string, unknown> = {}
): void {
  analytics.track(event, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get business metrics snapshot
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
    const service = event.eventType.split(':')[0];
    apiCallsByService[service] = (apiCallsByService[service] || 0) + (event.quantity || 0);
    totalApiCalls += event.quantity || 0;
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

/**
 * Track conversion funnel event
 */
export function trackConversionFunnel(
  stage: 'viewed_pricing' | 'clicked_checkout' | 'started_checkout' | 'completed_checkout',
  properties: Record<string, unknown> = {}
): void {
  trackBusinessEvent(`funnel_${stage}`, properties);
}

/**
 * Track revenue event
 */
export function trackRevenue(
  amount: number,
  currency: string,
  planCode: string,
  billingCycle: 'monthly' | 'annual'
): void {
  trackBusinessEvent('revenue', {
    amount,
    currency,
    planCode,
    billingCycle,
  });
}
