/**
 * Usage Analytics API Route
 * 
 * Returns detailed usage analytics including trends and forecasts.
 * Enhanced with comprehensive error handling and validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/console/usage/analytics', method: 'GET' });

  try {
    logger.info('Usage analytics request started', { correlationId });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Authentication failed', { correlationId, error: authError?.message });
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorrelationHeaders(response, correlationId);
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      logger.info('No billing account found', { correlationId });
      const response = NextResponse.json({
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        costEstimate: 0,
        trends: { daily: [], weekly: [] },
        forecast: { next30Days: 0, next90Days: 0 },
        limits: {},
      });
      return addCorrelationHeaders(response, correlationId);
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    
    // Validate days parameter
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      logger.warn('Invalid days parameter', { correlationId, days: daysParam });
      const response = NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
      return addCorrelationHeaders(response, correlationId);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Get usage events with error handling
    let events;
    try {
      events = await prisma.usageEvent.findMany({
        where: {
          billingAccountId: billingAccount.id,
          timestamp: { gte: startDate, lte: endDate },
        },
        orderBy: { timestamp: 'asc' },
      });
    } catch (dbError) {
      logger.error('Database error fetching events', {
        correlationId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
      // Return empty data instead of error
      const response = NextResponse.json({
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        costEstimate: 0,
        trends: { daily: [], weekly: [] },
        forecast: { next30Days: 0, next90Days: 0 },
        limits: {},
      });
      return addCorrelationHeaders(response, correlationId);
    }

    // Calculate metrics with error handling
    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};
    let totalCalls = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        const service = event.eventType?.split('-')[0] || 'unknown';
        const operation = event.eventType?.split('-').slice(1).join('-') || 'unknown';
        const quantity = event.quantity ? Number(event.quantity) : 1;

        byService[service] = (byService[service] || 0) + quantity;
        byOperation[operation] = (byOperation[operation] || 0) + quantity;
        totalCalls += quantity;

        if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
          errorCount += quantity;
        }
      } catch (eventError) {
        // Skip invalid events, continue processing
        logger.warn('Error processing event', {
          correlationId,
          eventId: event.id,
          error: eventError instanceof Error ? eventError.message : 'Unknown error',
        });
      }
    }

    const errorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

    // Calculate daily trends with error handling
    const dailyMap = new Map<string, { calls: number; errors: number }>();
    for (const event of events) {
      try {
        if (!event.timestamp) continue;
        const date = event.timestamp.toISOString().split('T')[0];
        if (!date) continue;
        const existing = dailyMap.get(date) || { calls: 0, errors: 0 };
        const quantity = event.quantity ? Number(event.quantity) : 1;
        existing.calls += quantity;
        if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
          existing.errors += quantity;
        }
        dailyMap.set(date, existing);
      } catch {
        // Skip invalid events
      }
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple forecast (average daily * days) with error handling
    let avgDaily = 0;
    try {
      avgDaily = daily.length > 0
        ? daily.reduce((sum: number, d: any) => sum + d.calls, 0) / daily.length
        : 0;
    } catch {
      avgDaily = 0;
    }

    const forecast = {
      next30Days: Math.round(avgDaily * 30),
      next90Days: Math.round(avgDaily * 90),
    };

    // Calculate cost estimate with error handling
    let costEstimate = 0;
    try {
      const planCode = await getAccountPlanCode(billingAccount.id).catch(() => 'starter');
      const planConfig = getPlanConfig(planCode);
      costEstimate = planCode === 'starter' ? 0 : (planConfig?.monthlyPrice || 0);
    } catch {
      costEstimate = 0;
    }

    // Get limits with error handling
    const limits: Record<string, { current: number; limit: number; remaining: number }> = {};
    const services: Array<'reconcile' | 'receipts' | 'featureFlags'> = ['reconcile', 'receipts', 'featureFlags'];
    
    for (const service of services) {
      try {
        const usage = await getCurrentUsage(billingAccount.id, service, 'monthly');
        limits[service] = {
          current: usage.current,
          limit: usage.limit === -1 ? 0 : usage.limit,
          remaining: usage.remaining === -1 ? -1 : usage.remaining,
        };
      } catch (usageError) {
        logger.warn(`Error getting usage for ${service}`, {
          correlationId,
          service,
          error: usageError instanceof Error ? usageError.message : 'Unknown error',
        });
        // Continue with other services
      }
    }

    logger.info('Analytics calculated successfully', {
      correlationId,
      totalCalls,
      errorRate,
      days,
    });

    const response = NextResponse.json({
      totalCalls,
      byService,
      byOperation,
      errorRate,
      costEstimate,
      trends: {
        daily,
        weekly: [], // Could calculate weekly aggregation
      },
      forecast,
      limits,
    });

    return addCorrelationHeaders(response, correlationId);
  } catch (_error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error calculating analytics', {
      correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return empty data instead of error
    const response = NextResponse.json(
      {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        costEstimate: 0,
        trends: { daily: [], weekly: [] },
        forecast: { next30Days: 0, next90Days: 0 },
        limits: {},
      },
      { status: 200 }
    );
    return addCorrelationHeaders(response, correlationId);
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
