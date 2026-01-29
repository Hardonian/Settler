/**
 * Usage Tracking Service
 *
 * Tracks and enforces usage limits for billing accounts.
 * Provides real-time usage tracking with Redis caching and PostgreSQL persistence.
 */

import { prisma } from "@/shared/db/prismaClient";
import { getRedisClient } from "@/lib/redis/client";
import type { SubscriptionTier } from "@/lib/console/subscription";

export type ServiceCode =
  | "reconcile"
  | "exceptions"
  | "playground"
  | "api"
  | "reconciliation"
  | "receipts"
  | "featureFlags"
  | "receipt_parsing";
export type Period = "daily" | "monthly";

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  reason?: string;
  tier?: SubscriptionTier;
}

/**
 * Get period start date for a given period type
 */
function getPeriodStart(period: Period, date: Date = new Date()): Date {
  const start = new Date(date);

  if (period === "daily") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  return start;
}

/**
 * Get period end date for a given period type
 */
function getPeriodEnd(period: Period, date: Date = new Date()): Date {
  const end = new Date(date);

  if (period === "daily") {
    end.setHours(23, 59, 59, 999);
  } else if (period === "monthly") {
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Last day of current month
    end.setHours(23, 59, 59, 999);
  }

  return end;
}

/**
 * Get usage limit for a service based on subscription tier
 */
function getUsageLimit(tier: SubscriptionTier, service: ServiceCode, period: Period): number {
  // Limits from subscription.ts
  // Updated to match new pricing model: only reconcile and exceptions are tracked
  const limits: Record<
    SubscriptionTier,
    Record<ServiceCode, { daily?: number; monthly?: number }>
  > = {
    unauthenticated: {
      reconcile: { daily: 0, monthly: 0 },
      exceptions: { daily: 0, monthly: 0 },
      playground: { daily: 10, monthly: 0 },
      api: { daily: 0, monthly: 0 },
      reconciliation: { daily: 0, monthly: 0 },
      receipts: { daily: 0, monthly: 0 },
      featureFlags: { daily: 0, monthly: 0 },
      receipt_parsing: { daily: 0, monthly: 0 },
    },
    free: {
      reconcile: { daily: 333, monthly: 10000 }, // Starter: 10k/month = ~333/day
      exceptions: { daily: -1, monthly: -1 }, // Calculated as percentage of reconciliation volume
      playground: { daily: 50, monthly: 0 },
      api: { daily: 333, monthly: 10000 },
      reconciliation: { daily: 333, monthly: 10000 },
      receipts: { daily: 333, monthly: 10000 },
      featureFlags: { daily: -1, monthly: -1 }, // Unlimited for feature flags
      receipt_parsing: { daily: 333, monthly: 10000 },
    },
    pro: {
      reconcile: { daily: 3333, monthly: 100000 }, // Growth: 100k/month = ~3333/day
      exceptions: { daily: -1, monthly: -1 }, // Calculated as percentage of reconciliation volume
      playground: { daily: 500, monthly: 0 },
      api: { daily: 3333, monthly: 100000 },
      reconciliation: { daily: 3333, monthly: 100000 },
      receipts: { daily: 3333, monthly: 100000 },
      featureFlags: { daily: -1, monthly: -1 }, // Unlimited for feature flags
      receipt_parsing: { daily: 3333, monthly: 100000 },
    },
    enterprise: {
      reconcile: { daily: -1, monthly: -1 }, // Unlimited
      exceptions: { daily: -1, monthly: -1 }, // Calculated as percentage of reconciliation volume
      playground: { daily: -1, monthly: -1 },
      api: { daily: -1, monthly: -1 },
      reconciliation: { daily: -1, monthly: -1 },
      receipts: { daily: -1, monthly: -1 },
      featureFlags: { daily: -1, monthly: -1 },
      receipt_parsing: { daily: -1, monthly: -1 },
    },
  };

  const serviceLimits = limits[tier]?.[service];
  if (!serviceLimits) return 0;

  const limit = period === "daily" ? serviceLimits.daily : serviceLimits.monthly;
  return limit ?? -1; // -1 means unlimited
}

/**
 * Get Redis key for usage counter
 */
function getRedisKey(
  billingAccountId: string,
  service: ServiceCode,
  period: Period,
  periodStart: Date
): string {
  const dateStr = periodStart.toISOString().split("T")[0];
  return `usage:${billingAccountId}:${service}:${period}:${dateStr}`;
}

/**
 * Get current usage for a billing account and service
 */
export async function getCurrentUsage(
  billingAccountId: string,
  service: ServiceCode,
  period: Period = "monthly"
): Promise<UsageCheckResult> {
  try {
    // Get subscription tier from billing account
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      include: {
        subscriptions: {
          where: {
            status: { in: ["active", "trialing"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!billingAccount) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetAt: getPeriodEnd(period),
        reason: "Billing account not found",
        tier: "unauthenticated",
      };
    }

    // Determine tier from subscription
    let tier: SubscriptionTier = "free";
    if (billingAccount.subscriptions.length > 0) {
      const planId = billingAccount.subscriptions[0]?.planId?.toLowerCase() || "base";
      if (planId.includes("enterprise") || planId.includes("custom")) {
        tier = "enterprise";
      } else if (planId.includes("pro") || planId.includes("paid")) {
        tier = "pro";
      }
    }

    const limit = getUsageLimit(tier, service, period);

    // Unlimited tier
    if (limit === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
        resetAt: getPeriodEnd(period),
        tier,
      };
    }

    const periodStart = getPeriodStart(period);

    // Try Redis first for fast reads
    const redis = getRedisClient();
    const redisKey = getRedisKey(billingAccountId, service, period, periodStart);

    let current = 0;
    if (redis) {
      try {
        const cached = await redis.get(redisKey);
        if (cached !== null && typeof cached === "string") {
          current = parseInt(cached, 10);
        }
      } catch (error) {
        // Redis error - fall back to database
        console.warn("[Usage Tracking] Redis read error, falling back to database:", error);
      }
    }

    // Fallback to database if Redis miss
    if (current === 0) {
      const counter = await prisma.usageCounter.findUnique({
        where: {
          billingAccountId_service_period_periodStart: {
            billingAccountId,
            service,
            period,
            periodStart,
          },
        },
      });

      current = counter?.count ?? 0;

      // Cache in Redis
      if (redis && counter) {
        try {
          await redis.set(redisKey, current.toString(), {
            ex: period === "daily" ? 86400 : 2592000,
          });
        } catch (error) {
          // Redis error - continue without caching
          console.warn("[Usage Tracking] Redis cache error:", error);
        }
      }
    }

    const remaining = Math.max(0, limit - current);
    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      remaining,
      resetAt: getPeriodEnd(period),
      tier,
      ...(!allowed && { reason: `Usage limit exceeded: ${current}/${limit}` }),
    };
  } catch (error) {
    console.error("[Usage Tracking] Error getting current usage:", error);
    // Fail open - allow request if tracking fails
    return {
      allowed: true,
      current: 0,
      limit: -1,
      remaining: -1,
      resetAt: getPeriodEnd(period),
      reason: "Tracking unavailable",
    };
  }
}

/**
 * Check if usage is allowed and increment if so
 * This is atomic - either increments and returns allowed, or returns not allowed
 */
export async function checkAndIncrementUsage(
  billingAccountId: string,
  service: ServiceCode,
  quantity: number = 1,
  period: Period = "monthly"
): Promise<UsageCheckResult> {
  try {
    // Get subscription tier from billing account
    const billingAccount = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      include: {
        subscriptions: {
          where: {
            status: { in: ["active", "trialing"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!billingAccount) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetAt: getPeriodEnd(period),
        reason: "Billing account not found",
        tier: "unauthenticated",
      };
    }

    // Determine tier from subscription
    let tier: SubscriptionTier = "free";
    if (billingAccount.subscriptions.length > 0) {
      const planId = billingAccount.subscriptions[0]?.planId?.toLowerCase() || "base";
      if (planId.includes("enterprise") || planId.includes("custom")) {
        tier = "enterprise";
      } else if (planId.includes("pro") || planId.includes("paid")) {
        tier = "pro";
      }
    }

    const limit = getUsageLimit(tier, service, period);

    // Unlimited tier - no tracking needed
    if (limit === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
        resetAt: getPeriodEnd(period),
        tier,
      };
    }

    const periodStart = getPeriodStart(period);
    const redis = getRedisClient();
    const redisKey = getRedisKey(billingAccountId, service, period, periodStart);

    // Try atomic increment in Redis first
    if (redis) {
      try {
        const newCount = await redis.incrby(redisKey, quantity);

        // Set expiration if this is a new key
        if (newCount === quantity) {
          await redis.expire(redisKey, period === "daily" ? 86400 : 2592000);
        }

        // Check limit
        if (newCount > limit) {
          // Rollback increment
          await redis.incrby(redisKey, -quantity);
          return {
            allowed: false,
            current: newCount - quantity,
            limit,
            remaining: 0,
            resetAt: getPeriodEnd(period),
            tier,
            reason: `Usage limit exceeded: ${newCount - quantity}/${limit}`,
          };
        }

        // Persist to database asynchronously (don't block request)
        persistUsageToDatabase(billingAccountId, service, period, periodStart, newCount).catch(
          (error) => console.error("[Usage Tracking] Error persisting to database:", error)
        );

        return {
          allowed: true,
          current: newCount,
          limit,
          remaining: Math.max(0, limit - newCount),
          resetAt: getPeriodEnd(period),
          tier,
        };
      } catch (error) {
        // Redis error - fall back to database
        console.warn("[Usage Tracking] Redis increment error, falling back to database:", error);
      }
    }

    // Fallback to database if Redis unavailable
    return await checkAndIncrementUsageDatabase(
      billingAccountId,
      service,
      quantity,
      period,
      limit,
      periodStart,
      tier
    );
  } catch (error) {
    console.error("[Usage Tracking] Error checking and incrementing usage:", error);
    // Fail open - allow request if tracking fails
    return {
      allowed: true,
      current: 0,
      limit: -1,
      remaining: -1,
      resetAt: getPeriodEnd(period),
      reason: "Tracking unavailable",
    };
  }
}

/**
 * Persist usage counter to database (async, non-blocking)
 */
async function persistUsageToDatabase(
  billingAccountId: string,
  service: ServiceCode,
  period: Period,
  periodStart: Date,
  count: number
): Promise<void> {
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
      count,
      updatedAt: new Date(),
    },
    create: {
      billingAccountId,
      service,
      period,
      periodStart,
      count,
      limit: 0, // Will be updated based on subscription
    },
  });
}

/**
 * Database fallback for usage checking and incrementing
 */
async function checkAndIncrementUsageDatabase(
  billingAccountId: string,
  service: ServiceCode,
  quantity: number,
  period: Period,
  limit: number,
  periodStart: Date,
  tier: SubscriptionTier
): Promise<UsageCheckResult> {
  // Use database transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.usageCounter.upsert({
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
          increment: quantity,
        },
        updatedAt: new Date(),
      },
      create: {
        billingAccountId,
        service,
        period,
        periodStart,
        count: quantity,
        limit,
      },
    });

    if (counter.count > limit) {
      // Rollback increment
      await tx.usageCounter.update({
        where: { id: counter.id },
        data: {
          count: {
            decrement: quantity,
          },
        },
      });
      throw new Error("Usage limit exceeded");
    }

    return counter;
  });

  return {
    allowed: true,
    current: result.count,
    limit,
    remaining: Math.max(0, limit - result.count),
    resetAt: getPeriodEnd(period),
    tier,
  };
}

/**
 * Record usage event for analytics (non-blocking)
 */
export async function recordUsageEvent(
  billingAccountId: string,
  service: ServiceCode,
  operation: string,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Map service code to eventType for UsageEvent model
    const eventTypeMap: Record<ServiceCode, string> = {
      reconcile: "settler-reconcile",
      exceptions: "settler-exceptions",
      receipts: "settler-receipts",
      featureFlags: "settler-feature-flags",
      playground: "settler-playground",
      api: "settler-api",
      reconciliation: "settler-reconcile",
      receipt_parsing: "settler-receipts",
    };

    const eventType = `${eventTypeMap[service]}-${operation}`;

    await prisma.usageEvent.create({
      data: {
        billingAccountId,
        eventType,
        quantity,
        metadata: (metadata ?? {}) as never,
      },
    });
  } catch (error) {
    // Don't block request if event recording fails
    console.error("[Usage Tracking] Error recording usage event:", error);
  }
}
