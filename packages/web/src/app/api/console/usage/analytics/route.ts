/**
 * Usage Analytics API Route
 * 
 * Returns detailed usage analytics including trends and forecasts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      return NextResponse.json({
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        costEstimate: 0,
        trends: { daily: [], weekly: [] },
        forecast: { next30Days: 0, next90Days: 0 },
        limits: {},
      });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Get usage events
    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId: billingAccount.id,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate metrics
    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};
    let totalCalls = 0;
    let errorCount = 0;

    for (const event of events) {
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

    // Calculate daily trends
    const dailyMap = new Map<string, { calls: number; errors: number }>();
    for (const event of events) {
      const date = event.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { calls: 0, errors: 0 };
      existing.calls += Number(event.quantity) || 1;
      if (event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata) {
        existing.errors += Number(event.quantity) || 1;
      }
      dailyMap.set(date, existing);
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple forecast (average daily * days)
    const avgDaily = daily.length > 0
      ? daily.reduce((sum, d) => sum + d.calls, 0) / daily.length
      : 0;
    const forecast = {
      next30Days: Math.round(avgDaily * 30),
      next90Days: Math.round(avgDaily * 90),
    };

    // Calculate cost estimate
    const planCode = await getAccountPlanCode(billingAccount.id).catch(() => 'free');
    const planConfig = getPlanConfig(planCode);
    const costEstimate = planCode === 'free' ? 0 : (planConfig?.pricing?.monthly || 0);

    // Get limits
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
      } catch {
        // Skip on error
      }
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('[Usage Analytics] Error:', error);
    return NextResponse.json(
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
  }
}
