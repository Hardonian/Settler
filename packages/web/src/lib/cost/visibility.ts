/**
 * Cost Visibility Service
 *
 * Tracks and reports infrastructure costs per billing account.
 */

import { prisma } from "@/shared/db/prismaClient";
import { getCurrentUsage } from "@/lib/usage/tracking";

export interface CostBreakdown {
  billingAccountId: string;
  period: {
    start: Date;
    end: Date;
  };
  services: {
    api: {
      requests: number;
      cost: number; // USD
    };
    reconciliation: {
      jobs: number;
      cost: number; // USD
    };
    receiptParsing: {
      receipts: number;
      cost: number; // USD
    };
    storage: {
      gb: number;
      cost: number; // USD
    };
  };
  total: number; // USD
  estimatedMonthly: number; // USD
}

// Cost per unit (simplified - would come from actual infrastructure costs)
const COST_PER_API_REQUEST = 0.0001; // $0.0001 per API call
const COST_PER_RECONCILIATION = 0.01; // $0.01 per reconciliation job
const COST_PER_RECEIPT = 0.005; // $0.005 per receipt parsed
const COST_PER_GB_STORAGE = 0.023; // $0.023 per GB/month

/**
 * Get cost breakdown for a billing account
 */
export async function getCostBreakdown(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<CostBreakdown | null> {
  try {
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
    });

    if (!billingAccount) {
      return null;
    }

    // Get usage for the period
    const [apiUsage, reconUsage, receiptUsage] = await Promise.all([
      getCurrentUsage(billingAccountId, "reconcile"), // Map 'api' to 'reconcile'
      getCurrentUsage(billingAccountId, "reconcile"),
      getCurrentUsage(billingAccountId, "receipts"),
    ]);

    // Calculate costs
    const apiCost = apiUsage.current * COST_PER_API_REQUEST;
    const reconCost = reconUsage.current * COST_PER_RECONCILIATION;
    const receiptCost = receiptUsage.current * COST_PER_RECEIPT;

    // Estimate storage (simplified - would query actual storage)
    const storageGB = 0; // Would calculate from actual storage usage
    const storageCost = storageGB * COST_PER_GB_STORAGE;

    const total = apiCost + reconCost + receiptCost + storageCost;

    // Estimate monthly cost (extrapolate from period)
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const estimatedMonthly = daysInPeriod > 0 ? (total / daysInPeriod) * 30 : 0;

    return {
      billingAccountId,
      period: {
        start: startDate,
        end: endDate,
      },
      services: {
        api: {
          requests: apiUsage.current,
          cost: apiCost,
        },
        reconciliation: {
          jobs: reconUsage.current,
          cost: reconCost,
        },
        receiptParsing: {
          receipts: receiptUsage.current,
          cost: receiptCost,
        },
        storage: {
          gb: storageGB,
          cost: storageCost,
        },
      },
      total,
      estimatedMonthly,
    };
  } catch (error) {
    console.error("[Cost Visibility] Error getting cost breakdown:", error);
    return null;
  }
}

/**
 * Get cost summary for current period
 */
export async function getCurrentPeriodCosts(
  billingAccountId: string
): Promise<CostBreakdown | null> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return getCostBreakdown(billingAccountId, periodStart, periodEnd);
}
