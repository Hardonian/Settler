/**
 * Entitlement Checks using Billing Hardening
 * 
 * Uses the new billing hardening functions for granular entitlement checks.
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { safeLogger } from '@/lib/observability/safe-logger';

type BillingHardeningModule = {
  checkEntitlements: (billingAccountId: string, options?: any) => Promise<EntitlementCheck>;
  getBillingStatus: (billingAccountId: string) => Promise<string>;
};

let cachedBilling: BillingHardeningModule | null = null;

async function getBillingHardening(): Promise<BillingHardeningModule> {
  if (cachedBilling) return cachedBilling;

  try {
    const mod: any = await import('@settler/api/dist/ops/billing-hardening');
    cachedBilling = {
      checkEntitlements: mod.checkEntitlements,
      getBillingStatus: mod.getBillingStatus,
    };
    return cachedBilling;
  } catch {
    cachedBilling = {
      checkEntitlements: async (billingAccountId: string, _options?: any) => {
        const prisma = new PrismaClient();
        try {
          const account = await prisma.billingAccount.findUnique({
            where: { id: billingAccountId },
            include: {
              subscriptions: {
                where: { status: { in: ['active', 'trialing'] } },
                take: 1,
              },
            },
          });

          if (!account || !account.subscriptions[0]) {
            return {
              canRunRecon: false,
              canCreateRecon: false,
              canExport: true,
              canViewReports: true,
              canUseAPI: false,
              message: 'Active subscription required',
              upgradeUrl: '/pricing',
            };
          }

          const sub = account.subscriptions[0];
          if (sub.status === 'past_due' || sub.status === 'unpaid') {
            return {
              canRunRecon: false,
              canCreateRecon: false,
              canExport: true,
              canViewReports: true,
              canUseAPI: false,
              message: 'Payment required. Please update your payment method.',
              upgradeUrl: '/console/billing',
            };
          }

          return {
            canRunRecon: true,
            canCreateRecon: true,
            canExport: true,
            canViewReports: true,
            canUseAPI: true,
          };
        } finally {
          await prisma.$disconnect();
        }
      },
      getBillingStatus: async (billingAccountId: string) => {
        const prisma = new PrismaClient();
        try {
          const account = await prisma.billingAccount.findUnique({
            where: { id: billingAccountId },
            include: {
              subscriptions: {
                where: { status: { in: ['active', 'past_due', 'trialing', 'canceled'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          });

          if (!account || !account.subscriptions[0]) {
            return 'free';
          }

          const sub = account.subscriptions[0];
          if (sub.status === 'past_due' && sub.currentPeriodEnd < new Date()) {
            return 'unpaid';
          }
          return sub.status as string;
        } finally {
          await prisma.$disconnect();
        }
      },
    };

    return cachedBilling;
  }
}

type EntitlementCheck = {
  canRunRecon: boolean;
  canCreateRecon: boolean;
  canExport: boolean;
  canViewReports: boolean;
  canUseAPI: boolean;
  message?: string;
  upgradeUrl?: string;
};

export interface EntitlementCheckResult {
  allowed: boolean;
  entitlements: EntitlementCheck;
  error?: NextResponse;
}

/**
 * Check entitlements for a billing account
 */
export async function checkUserEntitlements(
  billingAccountId: string,
  _requestedUsage?: {
    service: string;
    quantity: number;
  }
): Promise<EntitlementCheckResult> {
  try {
    const billing = await getBillingHardening();
    const entitlements = await billing.checkEntitlements(billingAccountId, {
      requestedUsage: _requestedUsage,
    });

    if (!entitlements.canUseAPI) {
      return {
        allowed: false,
        entitlements,
        error: NextResponse.json(
          {
            error: 'Access Denied',
            message: entitlements.message || 'This feature is not available with your current plan',
            code: 'ENTITLEMENT_CHECK_FAILED',
            upgrade_required: true,
            upgrade_url: entitlements.upgradeUrl,
          },
          { status: 403 }
        ),
      };
    }

    return {
      allowed: true,
      entitlements,
    };
  } catch (error) {
    await safeLogger.error('[Entitlement Checks] Entitlement check failed', {
      billingAccountId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Fail closed - deny access on error
    return {
      allowed: false,
      entitlements: {
        canRunRecon: false,
        canCreateRecon: false,
        canExport: false,
        canViewReports: false,
        canUseAPI: false,
        message: 'Unable to verify entitlements',
      },
      error: NextResponse.json(
        {
          error: 'Entitlement Check Failed',
          message: 'Unable to verify access permissions. Please try again or contact support.',
          code: 'ENTITLEMENT_CHECK_FAILED',
          retryable: true,
        },
        { status: 403 }
      ),
    };
  }
  // Note: Using shared Prisma singleton - don't disconnect
}

/**
 * Get billing status for a billing account
 */
export async function getUserBillingStatus(billingAccountId: string): Promise<string> {
  try {
    const billing = await getBillingHardening();
    return await billing.getBillingStatus(billingAccountId);
  } catch (error) {
    await safeLogger.error('[Entitlement Checks] Billing status check failed', {
      billingAccountId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return 'unknown';
  }
  // Note: Using shared Prisma singleton - don't disconnect
}
