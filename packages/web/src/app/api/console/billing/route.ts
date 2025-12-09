/**
 * Console Billing API Route
 * 
 * Returns billing account, subscription, and usage data for the console UI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getAccountUsage } from '@/domain/billing/usageService';
import { getAccountPlanCode } from '@/domain/billing/entitlements';
import { getPlanConfig } from '@/domain/billing/planConfig';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        billingAccountId: billingAccount.id,
        status: {
          in: ['active', 'trialing'],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        planId: true,
        planName: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    // Get plan code
    const planCode = await getAccountPlanCode(billingAccount.id);
    const planConfig = getPlanConfig(planCode);

    // Get usage
    const usage = await getAccountUsage(billingAccount.id);

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
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}
