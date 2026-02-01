/**
 * Metrics Service
 * 
 * Provides executive dashboard metrics and KPIs.
 */

import { prisma } from '@/shared/db/prismaClient';
import { getCurrentUsage } from '@/lib/usage/tracking';

export interface ExecutiveMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number; // Active in last 30 days
  newUsers: number; // New in last 7 days
  paidUsers: number;
  
  // Revenue metrics
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  averageRevenuePerUser: number;
  
  // Usage metrics
  totalApiCalls: number; // Last 30 days
  totalReconciliations: number; // Last 30 days
  totalReceiptsParsed: number; // Last 30 days
  
  // Growth metrics
  userGrowthRate: number; // % growth month-over-month
  revenueGrowthRate: number; // % growth month-over-month
  
  // Health metrics
  churnRate: number; // % churned in last 30 days
  conversionRate: number; // % free -> paid
  averageSessionDuration: number; // minutes
  
  // Period info
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

/**
 * Get executive metrics for a billing account or all accounts
 */
export async function getExecutiveMetrics(
  billingAccountId?: string
): Promise<ExecutiveMetrics> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // User metrics - use billing accounts as proxy for users
    const [totalUsers, activeUsers, newUsers, paidUsers] = await Promise.all([
      prisma.billingAccount.count({
        where: billingAccountId ? { id: billingAccountId } : undefined,
      }),
      prisma.billingAccount.count({
        where: {
          ...(billingAccountId ? { id: billingAccountId } : {}),
          updatedAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.billingAccount.count({
        where: {
          ...(billingAccountId ? { id: billingAccountId } : {}),
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.billingAccount.count({
        where: {
          ...(billingAccountId ? { id: billingAccountId } : {}),
          subscriptions: {
            some: {
              planId: { in: ['pro', 'enterprise'] },
              status: { in: ['active', 'trialing'] },
            },
          },
        },
      }),
    ]);

    // Revenue metrics
    const billingAccounts = await prisma.billingAccount.findMany({
      where: billingAccountId ? { id: billingAccountId } : {},
      include: {
        subscriptions: {
          where: {
            status: { in: ['active', 'trialing'] },
          },
          take: 1,
        },
      },
    });

    const mrr = billingAccounts
      .filter((ba: typeof billingAccounts[0]) => {
        const planId = ba.subscriptions[0]?.planId?.toLowerCase() || '';
        return planId.includes('pro') || planId.includes('enterprise');
      })
      .reduce((sum: number, ba: typeof billingAccounts[0]) => {
        // Simplified: pro = $49/month, enterprise = $299/month
        const planId = ba.subscriptions[0]?.planId?.toLowerCase() || '';
        const monthlyPrice = planId.includes('enterprise') ? 299 : 49;
        return sum + monthlyPrice;
      }, 0);

    const arr = mrr * 12;
    const totalRevenue = mrr; // Simplified - would need payment history
    const averageRevenuePerUser = paidUsers > 0 ? totalRevenue / paidUsers : 0;

    // Usage metrics (last 30 days)
    const usageCounters = await prisma.usageCounter.findMany({
      where: {
        ...(billingAccountId ? { billingAccountId } : {}),
        periodStart: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        service: true,
        count: true,
      },
    });

    const totalApiCalls = usageCounters
      .filter((uc: typeof usageCounters[0]) => uc.service === 'api')
      .reduce((sum: number, uc: typeof usageCounters[0]) => sum + uc.count, 0);
    
    const totalReconciliations = usageCounters
      .filter((uc: typeof usageCounters[0]) => uc.service === 'reconciliation')
      .reduce((sum: number, uc: typeof usageCounters[0]) => sum + uc.count, 0);
    
    const totalReceiptsParsed = usageCounters
      .filter((uc: typeof usageCounters[0]) => uc.service === 'receipt_parsing')
      .reduce((sum: number, uc: typeof usageCounters[0]) => sum + uc.count, 0);

    // Growth metrics
    const lastPeriodUsers = await prisma.billingAccount.count({
      where: {
        ...(billingAccountId ? { id: billingAccountId } : {}),
        createdAt: {
          gte: lastPeriodStart,
          lte: lastPeriodEnd,
        },
      },
    });

    const userGrowthRate =
      lastPeriodUsers > 0
        ? ((newUsers - lastPeriodUsers) / lastPeriodUsers) * 100
        : 0;
    const revenueGrowthRate = 0; // Would need historical revenue data

    // Health metrics
    const churnedAccounts = await prisma.billingAccount.count({
      where: {
        ...(billingAccountId ? { id: billingAccountId } : {}),
        subscriptions: {
          some: {
            status: 'cancelled',
            cancelledAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    const churnRate = paidUsers > 0 ? (churnedAccounts / paidUsers) * 100 : 0;
    
    const freeAccounts = await prisma.billingAccount.count({
      where: {
        ...(billingAccountId ? { id: billingAccountId } : {}),
        subscriptions: {
          none: {
            planId: { in: ['pro', 'enterprise'] },
            status: { in: ['active', 'trialing'] },
          },
        },
      },
    });
    
    const conversionRate =
      freeAccounts + paidUsers > 0
        ? (paidUsers / (freeAccounts + paidUsers)) * 100
        : 0;

    // Average session duration (simplified - would need analytics)
    const averageSessionDuration = 15; // minutes

    return {
      totalUsers,
      activeUsers,
      newUsers,
      paidUsers,
      mrr,
      arr,
      totalRevenue,
      averageRevenuePerUser,
      totalApiCalls,
      totalReconciliations,
      totalReceiptsParsed,
      userGrowthRate,
      revenueGrowthRate,
      churnRate,
      conversionRate,
      averageSessionDuration,
      periodStart,
      periodEnd,
      calculatedAt: now,
    };
  } catch (_error) {
    console.error('[Metrics] Error calculating metrics:', error);
    // Return zero metrics on error
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      paidUsers: 0,
      mrr: 0,
      arr: 0,
      totalRevenue: 0,
      averageRevenuePerUser: 0,
      totalApiCalls: 0,
      totalReconciliations: 0,
      totalReceiptsParsed: 0,
      userGrowthRate: 0,
      revenueGrowthRate: 0,
      churnRate: 0,
      conversionRate: 0,
      averageSessionDuration: 0,
      periodStart,
      periodEnd,
      calculatedAt: now,
    };
  }
}

/**
 * Get usage metrics for a specific billing account
 */
export async function getBillingAccountMetrics(billingAccountId: string) {
  try {
    const metrics = await getExecutiveMetrics(billingAccountId);
    const usage = await getCurrentUsage(billingAccountId, 'reconcile');
    
    return {
      ...metrics,
      currentUsage: usage,
    };
  } catch (_error) {
    console.error('[Metrics] Error getting billing account metrics:', error);
    return null;
  }
}
