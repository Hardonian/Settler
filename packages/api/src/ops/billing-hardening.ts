/**
 * Billing Ops Hardening
 *
 * Implements dunning state, usage-based gating, and entitlement checks.
 */

import { prisma } from "../infrastructure/db/prisma";

export type BillingStatus = "active" | "past_due" | "unpaid" | "canceled" | "trialing" | "free";

export interface EntitlementCheck {
  canRunRecon: boolean;
  canCreateRecon: boolean;
  canExport: boolean;
  canViewReports: boolean;
  canUseAPI: boolean;
  message?: string;
  upgradeUrl?: string;
}

/**
 * Derive billing status from subscription and billing account
 */
export async function getBillingStatus(billingAccountId: string): Promise<BillingStatus> {
  const account = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    include: {
      subscriptions: {
        where: {
          status: {
            in: ["active", "past_due", "trialing", "canceled"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!account) {
    return "free";
  }

  const subscription = account.subscriptions[0];
  if (!subscription) {
    return "free";
  }

  // Check if subscription is past due
  if (subscription.status === "past_due") {
    // Check if past due date has passed
    if (subscription.currentPeriodEnd < new Date()) {
      return "unpaid";
    }
    return "past_due";
  }

  return subscription.status as BillingStatus;
}

/**
 * Check entitlements based on billing status and usage
 */
export async function checkEntitlements(
  billingAccountId: string,
  options: {
    requestedUsage?: {
      service: string;
      quantity: number;
    };
  } = {}
): Promise<EntitlementCheck> {
  const status = await getBillingStatus(billingAccountId);

  // Free tier: read-only access
  if (status === "free") {
    return {
      canRunRecon: false,
      canCreateRecon: false,
      canExport: true, // Allow export for free users
      canViewReports: true,
      canUseAPI: false,
      message: "Upgrade to run reconciliations",
      upgradeUrl: "/pricing",
    };
  }

  // Past due: allow read-only, block new operations
  if (status === "past_due" || status === "unpaid") {
    return {
      canRunRecon: false,
      canCreateRecon: false,
      canExport: true,
      canViewReports: true,
      canUseAPI: false,
      message: "Payment required. Please update your payment method.",
      upgradeUrl: "/console/billing",
    };
  }

  // Canceled: read-only
  if (status === "canceled") {
    return {
      canRunRecon: false,
      canCreateRecon: false,
      canExport: true,
      canViewReports: true,
      canUseAPI: false,
      message: "Subscription canceled. Reactivate to continue using the service.",
      upgradeUrl: "/console/billing",
    };
  }

  // Active/trialing: check usage limits
  if (status === "active" || status === "trialing") {
    if (options.requestedUsage) {
      const { service, quantity } = options.requestedUsage;

      // Check usage counter for the current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Monthly period

      const usageCounter = await prisma.usageCounter.findUnique({
        where: {
          billingAccountId_service_period_periodStart: {
            billingAccountId,
            service,
            period: "monthly",
            periodStart,
          },
        },
      });

      if (usageCounter) {
        const newCount = usageCounter.count + quantity;
        if (newCount > usageCounter.limit && usageCounter.limit > 0) {
          return {
            canRunRecon: false,
            canCreateRecon: false,
            canExport: true,
            canViewReports: true,
            canUseAPI: false,
            message: `Usage limit exceeded for ${service}. Upgrade to increase limits.`,
            upgradeUrl: "/console/billing",
          };
        }
      }
    }

    // All checks passed
    return {
      canRunRecon: true,
      canCreateRecon: true,
      canExport: true,
      canViewReports: true,
      canUseAPI: true,
    };
  }

  // Default: allow everything (shouldn't reach here)
  return {
    canRunRecon: true,
    canCreateRecon: true,
    canExport: true,
    canViewReports: true,
    canUseAPI: true,
  };
}

/**
 * Get Stripe customer portal URL for billing management
 */
export async function getBillingPortalUrl(billingAccountId: string): Promise<string | null> {
  const account = await prisma.billingAccount.findUnique({
    where: { id: billingAccountId },
    select: { stripeCustomerId: true },
  });

  if (!account?.stripeCustomerId) {
    return null;
  }

  // In production, this would call Stripe API to create a portal session
  // For now, return a placeholder URL
  return `/console/billing?customer=${account.stripeCustomerId}`;
}
