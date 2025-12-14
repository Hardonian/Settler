/**
 * Revenue Recognition Automation
 * 
 * Automates revenue recognition for usage-based billing.
 */

import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';

export interface RevenueRecognition {
  billingAccountId: string;
  period: {
    start: Date;
    end: Date;
  };
  subscriptionRevenue: number; // Recurring subscription revenue
  usageRevenue: number; // Usage-based revenue
  totalRevenue: number;
  recognizedAt: Date;
}

/**
 * Calculate revenue for a billing account for a period
 */
export async function calculateRevenue(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueRecognition | null> {
  try {
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      include: {
        subscriptions: {
          where: {
            status: 'active',
          },
          take: 1,
        },
      },
    });

    if (!billingAccount) {
      return null;
    }

    // Subscription revenue (recurring)
    const subscription = billingAccount.subscriptions[0];
    let subscriptionRevenue = 0;

    if (subscription) {
      // Calculate prorated subscription revenue for the period
      const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysInMonth = 30; // Simplified
      // Simplified pricing: pro = $49, enterprise = $299
      const planId = subscription.planId?.toLowerCase() || '';
      const monthlyPrice = planId.includes('enterprise') ? 299 : planId.includes('pro') ? 49 : 0;
      subscriptionRevenue = (monthlyPrice / daysInMonth) * daysInPeriod;
    }

    // Usage-based revenue (simplified - would need actual usage pricing)
    // const usage = await getCurrentUsage(billingAccountId, 'reconcile');
    const usageRevenue = 0; // Would calculate based on usage pricing

    const totalRevenue = subscriptionRevenue + usageRevenue;

    return {
      billingAccountId,
      period: {
        start: startDate,
        end: endDate,
      },
      subscriptionRevenue,
      usageRevenue,
      totalRevenue,
      recognizedAt: new Date(),
    };
  } catch (error) {
    console.error('[Revenue Recognition] Error calculating revenue:', error);
    return null;
  }
}

/**
 * Recognize revenue for all active billing accounts
 */
export async function recognizeRevenueForPeriod(
  startDate: Date,
  endDate: Date
): Promise<RevenueRecognition[]> {
  try {
    const billingAccounts = await prisma.billingAccount.findMany({
      where: {
        subscriptions: {
          some: {
            status: { in: ['active', 'trialing'] },
          },
        },
      },
    });

    const recognitions: RevenueRecognition[] = [];

    for (const account of billingAccounts) {
      const recognition = await calculateRevenue(account.id, startDate, endDate);
      if (recognition) {
        recognitions.push(recognition);
      }
    }

    return recognitions;
  } catch (error) {
    console.error('[Revenue Recognition] Error recognizing revenue:', error);
    return [];
  }
}

/**
 * Get revenue recognition for current period
 */
export async function getCurrentPeriodRevenue(billingAccountId: string): Promise<RevenueRecognition | null> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return calculateRevenue(billingAccountId, periodStart, periodEnd);
}
