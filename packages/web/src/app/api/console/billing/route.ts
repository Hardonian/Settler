/**
 * Console Billing API Route
 * 
 * Returns billing account, subscription, and usage data for the console UI.
 * Includes proper error handling and input validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getAccountUsage } from '@/domain/billing/usageService';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';
import { withApiWrapper } from '@/middleware/api-wrapper';
import { redisRateLimiters } from '@/lib/security/rate-limiter-redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

async function getBillingHandler(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get billing account with optimized query
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!billingAccount) {
      // Return empty state instead of 404 to prevent UI errors
      return NextResponse.json({
        billingAccount: null,
        subscription: null,
        usage: {
          reconcile: { current: 0, limit: 0 },
          receipts: { current: 0, limit: 0 },
          featureFlags: { current: 0, limit: 0 },
        },
      });
    }

    // Get active subscription with optimized query
    const subscription = await prisma.subscription.findFirst({
      where: {
        billingAccountId: billingAccount.id,
        status: {
          in: ['active', 'trialing'],
        },
      },
      select: {
        id: true,
        planId: true,
        planName: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get plan code
    let planCode: string;
    try {
      planCode = await getAccountPlanCode(billingAccount.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Console Billing] Error getting plan code:', {
        billingAccountId: billingAccount.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      planCode = 'free';
    }

    const planConfig = getPlanConfig(planCode);

    // Get usage with error handling
    let usage;
    try {
      usage = await getAccountUsage(billingAccount.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Console Billing] Error getting account usage:', {
        billingAccountId: billingAccount.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Return zero usage on error
      usage = {
        billingAccountId: billingAccount.id,
        periodStart: new Date(),
        periodEnd: new Date(),
        services: {
          reconcile: 0,
          receipts: 0,
          featureFlags: 0,
        },
      };
    }

    // Map usage to limits
    const usageWithLimits = {
      reconcile: {
        current: usage.services.reconcile,
        limit: planConfig?.limits.reconcile.monthlyCalls || 0,
      },
      receipts: {
        current: usage.services.receipts,
        limit: planConfig?.limits.receipts.monthlyCalls || 0,
      },
      featureFlags: {
        current: usage.services.featureFlags,
        limit: planConfig?.limits.featureFlags.monthlyEvaluations || 0,
      },
    };

    return NextResponse.json({
      billingAccount: {
        id: billingAccount.id,
        email: billingAccount.email,
        status: billingAccount.status,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            planName: subscription.planName,
            planCode,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      usage: usageWithLimits,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Console Billing] Error fetching billing data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

export const GET = withApiWrapper(getBillingHandler, {
  rateLimiter: redisRateLimiters.billing,
  requireAuth: true,
});
