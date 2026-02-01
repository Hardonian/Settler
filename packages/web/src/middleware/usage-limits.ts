/**
 * Usage Limit Enforcement Middleware
 * 
 * Enforces usage limits before API execution to prevent free tier abuse.
 * Checks usage_counters table and returns 429 if limit exceeded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { getCorrelationId, createLogger } from '@/lib/monitoring/correlation';

export type ServiceType = 'reconcile' | 'exceptions';

interface UsageLimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date | null;
}

/**
 * Check if usage limit is exceeded for a service
 */
export async function checkUsageLimit(
  billingAccountId: string,
  service: ServiceType,
  period: 'daily' | 'monthly' = 'monthly'
): Promise<UsageLimitCheck> {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: 'usage-limits', method: 'check' });

  try {
    // Get current period start
    const now = new Date();
    const periodStart = period === 'daily'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Get or create usage counter
    let counter = await prisma.usageCounter.findUnique({
      where: {
        billingAccountId_service_period_periodStart: {
          billingAccountId,
          service,
          period,
          periodStart,
        },
      },
    });

    // If counter doesn't exist, create it with default limit
    if (!counter) {
      // Get subscription to determine limit
      const subscription = await prisma.subscription.findFirst({
        where: {
          billingAccountId,
          status: 'active',
        },
        select: {
          planId: true,
        },
      });

      // Default limits based on plan (starter tier)
      const defaultLimits: Record<ServiceType, number> = {
        reconcile: 10000, // Starter plan: 10k reconciliations included
        exceptions: -1, // Exception limits calculated dynamically as percentage of reconciliation volume
      };

      // Get plan code to determine limit
      const planId = subscription?.planId || 'base';
      const isPaidPlan = planId !== 'base';
      const limit = isPaidPlan ? -1 : defaultLimits[service]; // -1 = unlimited for paid plans

      counter = await prisma.usageCounter.create({
        data: {
          billingAccountId,
          service,
          period,
          periodStart,
          count: 0,
          limit,
        },
      });
    }

    const current = counter.count;
    const limit = counter.limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - current);
    const allowed = limit === -1 || current < limit;

    // Calculate reset time
    const resetAt = period === 'daily'
      ? new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
      : new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);

    logger.info('Usage limit checked', {
      correlationId,
      billingAccountId,
      service,
      period,
      current,
      limit,
      remaining,
      allowed,
    });

    return {
      allowed,
      current,
      limit,
      remaining,
      resetAt,
    };
  } catch (_error) {
    logger.error('Error checking usage limit', {
      correlationId,
      billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // On error, allow request (fail open) but log
    return {
      allowed: true,
      current: 0,
      limit: -1,
      remaining: -1,
      resetAt: null,
    };
  }
}

/**
 * Increment usage counter
 */
export async function incrementUsageCounter(
  billingAccountId: string,
  service: ServiceType,
  period: 'daily' | 'monthly' = 'monthly',
  amount: number = 1
): Promise<void> {
  try {
    const now = new Date();
    const periodStart = period === 'daily'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth(), 1);

    await prisma.usageCounter.upsert({
      where: {
        billingAccountId_service_period_periodStart: {
          billingAccountId,
          service,
          period,
          periodStart,
        },
      },
      update: {
        count: {
          increment: amount,
        },
      },
      create: {
        billingAccountId,
        service,
        period,
        periodStart,
        count: amount,
        limit: -1, // Will be set by checkUsageLimit if needed
      },
    });
  } catch (_error) {
    console.error('[Usage Limits] Error incrementing counter:', {
      billingAccountId,
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - usage tracking is non-critical
  }
}

/**
 * Middleware to enforce usage limits
 * Returns 429 if limit exceeded
 */
export async function enforceUsageLimit(
  _request: NextRequest,
  billingAccountId: string,
  service: ServiceType
): Promise<NextResponse | null> {
  const check = await checkUsageLimit(billingAccountId, service);

  if (!check.allowed) {
    const correlationId = await getCorrelationId();
    const logger = await createLogger({ route: 'usage-limits', method: 'enforce' });
    
    logger.warn('Usage limit exceeded', {
      correlationId,
      billingAccountId,
      service,
      current: check.current,
      limit: check.limit,
    });

    return NextResponse.json(
      {
        error: 'Usage limit exceeded',
        service,
        current: check.current,
        limit: check.limit,
        remaining: check.remaining,
        resetAt: check.resetAt?.toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': check.resetAt
            ? Math.ceil((check.resetAt.getTime() - Date.now()) / 1000).toString()
            : '3600',
          'X-RateLimit-Limit': check.limit === -1 ? 'unlimited' : check.limit.toString(),
          'X-RateLimit-Remaining': check.remaining === -1 ? 'unlimited' : check.remaining.toString(),
          'X-RateLimit-Reset': check.resetAt?.toISOString() || '',
        },
      }
    );
  }

  return null; // Limit not exceeded, continue
}
