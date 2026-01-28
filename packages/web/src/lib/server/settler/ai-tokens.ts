/**
 * AI Token Management Service
 *
 * Manages AI analysis token usage and limits per tier.
 */

import { createClient } from "@/lib/supabase/server";
import type { TenantId } from "@/lib/domain/types";
import type { Database } from "@/types/database.types";
import { prisma } from "@/shared/db/prismaClient";
import { determineSubscriptionTier, type SubscriptionTier } from "@/lib/subscription-access";
import { safeLogger } from "@/lib/observability/safe-logger";

export interface TokenUsage {
  used: number;
  limit: number;
  period: "day" | "week" | "month";
  resetDate: Date;
}

/**
 * Get token usage for a tenant
 */
export async function getTokenUsage(tenantId: TenantId): Promise<TokenUsage | null> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Set tenant context for RLS (optional, RLS policies handle tenant isolation)
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch (error) {
      // RPC may not exist, RLS policies handle isolation
    }

    // Get subscription tier from billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { tenantId },
      include: {
        subscriptions: {
          where: {
            status: { in: ["active", "trialing", "past_due"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const subscriptionTier = determineSubscriptionTier(
      billingAccount?.subscriptions[0] || null,
      billingAccount
    );

    // Map subscription tier to AI token limits
    // Free/unsubscribed: 1 per week, Paid: 10 per month, Enterprise: unlimited
    const tierMap: Record<SubscriptionTier, "free" | "pro" | "enterprise"> = {
      unsubscribed: "free",
      subscribed_unpaid: "free",
      subscribed_paid: "pro",
      enterprise: "enterprise",
    };

    const tier = tierMap[subscriptionTier] || "free";

    const limits: Record<"free" | "pro" | "enterprise", TokenUsage> = {
      free: {
        used: 0,
        limit: 1,
        period: "week",
        resetDate: getNextResetDate("week"),
      },
      pro: {
        used: 0,
        limit: 10,
        period: "month",
        resetDate: getNextResetDate("month"),
      },
      enterprise: {
        used: 0,
        limit: -1, // Unlimited
        period: "month",
        resetDate: getNextResetDate("month"),
      },
    };

    // Query actual usage from database
    type UsageRow = Database["public"]["Tables"]["ai_analysis_usage"]["Row"];
    const { data: usage } = (await supabase
      .from("ai_analysis_usage")
      .select("tokens_used, period_start")
      .eq("tenant_id", tenantId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: UsageRow | null };

    const selectedLimit = limits[tier];
    if (!selectedLimit) {
      throw new Error(`Unknown tier: ${tier}`);
    }
    const tokenUsage: TokenUsage = { ...selectedLimit };

    if (usage && typeof usage.tokens_used === "number") {
      tokenUsage.used = usage.tokens_used;
    }

    return tokenUsage;
  } catch (error) {
    await safeLogger.error("[getTokenUsage] Error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Check if tenant has available tokens
 */
export async function checkTokenUsage(tenantId: TenantId): Promise<{
  hasTokens: boolean;
  usage: TokenUsage | null;
}> {
  const usage = await getTokenUsage(tenantId);

  if (!usage) {
    return { hasTokens: false, usage: null };
  }

  // Unlimited
  if (usage.limit === -1) {
    return { hasTokens: true, usage };
  }

  // Check if used < limit
  return {
    hasTokens: usage.used < usage.limit,
    usage,
  };
}

/**
 * Consume tokens for an analysis
 */
export async function consumeTokens(tenantId: TenantId, tokens: number): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    // Set tenant context for RLS (optional, RLS policies handle tenant isolation)
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch (error) {
      // RPC may not exist, RLS policies handle isolation
    }

    // Get current period
    const usage = await getTokenUsage(tenantId);
    if (!usage) {
      return false;
    }

    // Check if tokens available
    const check = await checkTokenUsage(tenantId);
    if (!check.hasTokens) {
      return false;
    }

    // Record usage
    const periodStart = getPeriodStart(usage.period);
    type UsageInsert = Database["public"]["Tables"]["ai_analysis_usage"]["Insert"];
    await (supabase.from("ai_analysis_usage") as any).upsert(
      {
        tenant_id: tenantId,
        period_start: periodStart.toISOString(),
        tokens_used: (usage.used || 0) + tokens,
        updated_at: new Date().toISOString(),
      } as UsageInsert,
      {
        onConflict: "tenant_id,period_start",
      }
    );

    return true;
  } catch (error) {
    await safeLogger.error("[consumeTokens] Error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

function getNextResetDate(period: "day" | "week" | "month"): Date {
  const now = new Date();
  const reset = new Date(now);

  switch (period) {
    case "day":
      reset.setDate(reset.getDate() + 1);
      reset.setHours(0, 0, 0, 0);
      break;
    case "week":
      reset.setDate(reset.getDate() + (7 - reset.getDay()));
      reset.setHours(0, 0, 0, 0);
      break;
    case "month":
      reset.setMonth(reset.getMonth() + 1);
      reset.setDate(1);
      reset.setHours(0, 0, 0, 0);
      break;
  }

  return reset;
}

function getPeriodStart(period: "day" | "week" | "month"): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return start;
}
