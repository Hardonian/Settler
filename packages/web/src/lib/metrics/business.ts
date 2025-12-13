/**
 * Business Metrics Tracking (Client-Safe)
 * 
 * Tracks key business events for analytics and reporting.
 * All events are sent to analytics service and can be queried for dashboards.
 * 
 * NOTE: This file is client-safe and can be imported in client components.
 * It does NOT import Prisma or any server-only dependencies.
 * 
 * For server-only metrics queries, see business-server.ts
 */

'use client';

import { analytics } from '@/lib/analytics';

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
 * Track business event (CLIENT-SAFE)
 * 
 * Can be called from client components or server components.
 */
export function trackBusinessEvent(
  event: string,
  properties: Record<string, unknown> = {}
): void {
  // Only track on client side to avoid SSR issues
  if (typeof window !== 'undefined') {
    analytics.trackEvent(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track conversion funnel event (CLIENT-SAFE)
 */
export function trackConversionFunnel(
  stage: 'viewed_pricing' | 'clicked_checkout' | 'started_checkout' | 'completed_checkout',
  properties: Record<string, unknown> = {}
): void {
  trackBusinessEvent(`funnel_${stage}`, properties);
}

/**
 * Track revenue event (CLIENT-SAFE)
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

// Note: getBusinessMetrics moved to business-server.ts (server-only)
// Import it from '@/lib/metrics/business-server' in API routes
