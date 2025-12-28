/**
 * Entitlement Checks using Billing Hardening
 * 
 * Uses the new billing hardening functions for granular entitlement checks.
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Import billing hardening functions - handle both direct import and dynamic import
let checkEntitlements: any;
let getBillingStatus: any;

try {
  // Try direct import first
  const billingHardening = require('@settler/api/src/ops/billing-hardening');
  checkEntitlements = billingHardening.checkEntitlements;
  getBillingStatus = billingHardening.getBillingStatus;
} catch {
  // Fallback: implement inline if import fails
  // This ensures the code works even if the API package isn't built
  console.warn('Could not import billing hardening functions, using fallback implementation');
  
  // Fallback implementation
  checkEntitlements = async (billingAccountId: string, _options?: any) => {
    // Skip Prisma operations during build time if DATABASE_URL is not available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning default entitlements');
      return {
        canRunRecon: true,
        canCreateRecon: true,
        canExport: true,
        canViewReports: true,
        canUseAPI: true,
      };
    }
    
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
  };

  getBillingStatus = async (billingAccountId: string) => {
    // Skip Prisma operations during build time if DATABASE_URL is not available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning default billing status');
      return 'free';
    }
    
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
  };
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
    const entitlements = await checkEntitlements(billingAccountId, {
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
    console.error('Entitlement check failed:', error);
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
          message: 'Unable to verify access permissions',
          code: 'ENTITLEMENT_CHECK_FAILED',
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Get billing status for a billing account
 */
export async function getUserBillingStatus(billingAccountId: string): Promise<string> {
  try {
    return await getBillingStatus(billingAccountId);
  } catch (error) {
    console.error('Billing status check failed:', error);
    return 'unknown';
  }
}
