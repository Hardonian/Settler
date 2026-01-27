/**
 * Console Usage API Route
 * 
 * Returns usage statistics for the current user's billing account.
 * Includes real-time usage tracking and limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { getBillingAccountOptimized } from '@/lib/db/query-optimizer';
import { executeWithRetry } from '@/lib/db/connection-pool';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface UsageSummary {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: { start: Date; end: Date };
  limits: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
    playground?: { current: number; limit: number; remaining: number };
  };
}

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/console/usage', method: 'GET' });
  
  try {
    logger.info('Console usage request started', { correlationId });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          period: { start: new Date(), end: new Date() },
          limits: {},
        },
        { status: 200 }
      );
    }

    // Get billing account with optimized query and caching
    const billingAccount = await getBillingAccountOptimized(user.id, true);

    if (!billingAccount) {
      return NextResponse.json(
        {
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          period: { start: new Date(), end: new Date() },
          limits: {},
        },
        { status: 200 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Get subscription info for limits (not used but kept for future use)
    // const subscription = await getSubscriptionInfo();

    // Get usage events from database with connection pooling and retry
    const usageEvents = await executeWithRetry(() =>
      prisma.usageEvent.findMany({
        where: {
          billingAccountId: billingAccount.id,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          eventType: true,
          quantity: true,
          metadata: true,
        },
      })
    );

    // Aggregate usage by service
    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};
    let totalCalls = 0;
    let errorCount = 0;

    for (const event of usageEvents) {
      const service = event.eventType.split('-')[0] || 'unknown';
      const operation = event.eventType.split('-').slice(1).join('-') || 'unknown';
      const quantity = Number(event.quantity) || 1;

      byService[service] = (byService[service] || 0) + quantity;
      byOperation[operation] = (byOperation[operation] || 0) + quantity;
      totalCalls += quantity;

      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        errorCount += quantity;
      }
    }

    const errorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

    // Get real-time usage limits
    const limits: UsageSummary['limits'] = {};

    if (billingAccount.id) {
      const services: Array<'reconcile' | 'receipts' | 'featureFlags' | 'playground'> = ['reconcile', 'receipts', 'featureFlags', 'playground'];
      
      for (const service of services) {
        try {
          const usage = await getCurrentUsage(billingAccount.id, service, 'monthly');
          limits[service] = {
            current: usage.current,
            limit: usage.limit === -1 ? 0 : usage.limit, // -1 means unlimited, show as 0 for UI
            remaining: usage.remaining === -1 ? -1 : usage.remaining,
          };
        } catch {
          appLogger.error(`[Usage API] Error getting usage for ${service}`, error);
          // Continue with other services
        }
      }
    }

    const summary: UsageSummary = {
      totalCalls,
      byService,
      byOperation,
      errorRate,
      period: { start: startDate, end: endDate },
      limits,
    };

    logger.info('Usage summary generated successfully', { correlationId, totalCalls, errorRate });
    const response = NextResponse.json(summary, { status: 200 });
    return addCorrelationHeaders(response, correlationId);
  } catch {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching usage summary', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Never return 500 - return empty summary
    const response = NextResponse.json(
      {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: { start: new Date(), end: new Date() },
        limits: {},
      },
      { status: 200 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}, { feature: 'Usage API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
