import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlanCode } from "@/domain/billing/planConfig";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

// Type definitions for better type safety
interface UsageEvent {
  event_type?: string;
  quantity?: number;
}

interface SubscriptionMetadata {
  plan?: string;
  planCode?: string;
  [key: string]: unknown;
}

interface QuotaItem {
  endpoint: string;
  limit: number;
  used: number;
  resetAt: string;
}

// Constants for plan limits (weekly limits derived from monthly plans)
const PLAN_LIMITS: Readonly<Record<PlanCode, number>> = {
  starter: 10000,
  growth: 100000,
  scale: 1000000,
  enterprise: 1000000,
} as const;

const DEFAULT_PLAN: PlanCode = 'starter';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

// Type guard to check if a string is a valid PlanCode
function isValidPlanCode(plan: string): plan is PlanCode {
  return plan in PLAN_LIMITS;
}

// Safely extract plan code from metadata (supports both 'plan' and 'planCode' fields)
function extractPlanCode(metadata: SubscriptionMetadata | null | undefined): PlanCode {
  if (!metadata || typeof metadata !== 'object') {
    return DEFAULT_PLAN;
  }
  
  // Try planCode first (preferred field name)
  const planCode = metadata.planCode;
  if (typeof planCode === 'string' && isValidPlanCode(planCode)) {
    return planCode;
  }
  
  // Fallback to plan field
  const plan = metadata.plan;
  if (typeof plan === 'string' && isValidPlanCode(plan)) {
    return plan;
  }
  
  return DEFAULT_PLAN;
}

// Get plan limit with type-safe fallback
function getPlanLimit(planCode: PlanCode): number {
  return PLAN_LIMITS[planCode] ?? PLAN_LIMITS[DEFAULT_PLAN];
}

// Safely parse usage events
function parseUsageEvents(events: unknown): Record<string, number> {
  const usageByType: Record<string, number> = {};
  
  if (!Array.isArray(events)) {
    return usageByType;
  }
  
  for (const event of events) {
    if (event && typeof event === 'object') {
      const usageEvent = event as UsageEvent;
      const eventType = typeof usageEvent.event_type === 'string' 
        ? usageEvent.event_type 
        : 'unknown';
      const quantity = typeof usageEvent.quantity === 'number' && usageEvent.quantity > 0
        ? usageEvent.quantity 
        : 1;
      usageByType[eventType] = (usageByType[eventType] ?? 0) + quantity;
    }
  }
  
  return usageByType;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quota data from database
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Get tenant ID from user's billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });

    if (!billingAccount?.tenantId) {
      return NextResponse.json({ quotas: [] });
    }

    // Get subscription to determine limits
    const subscription = await prisma.subscription.findFirst({
      where: { billingAccountId: billingAccount.tenantId },
      select: { metadata: true, stripePriceId: true },
    });

    // Extract plan code with type safety
    const planCode = extractPlanCode(subscription?.metadata as SubscriptionMetadata | null);
    const baseLimit = getPlanLimit(planCode);

    // Get actual usage from usage_events
    const now = new Date();
    const weekStart = new Date(now.getTime() - WEEK_IN_MS);
    
    // Calculate usage from usage_events table
    const { data: usageEvents, error: usageError } = await supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    // Handle usage query errors gracefully
    if (usageError) {
      console.warn("Error fetching usage events:", usageError);
    }

    const usageByType = parseUsageEvents(usageEvents);
    const resetAt = new Date(now.getTime() + WEEK_IN_MS).toISOString();

    const quotas: QuotaItem[] = [
      {
        endpoint: "/api/reconcile",
        limit: baseLimit,
        used: usageByType.reconciliation ?? 0,
        resetAt,
      },
      {
        endpoint: "/api/integrations/sync",
        limit: baseLimit,
        used: usageByType.integration_sync ?? 0,
        resetAt,
      },
      {
        endpoint: "/api/webhooks",
        limit: baseLimit * 2,
        used: usageByType.webhook ?? 0,
        resetAt,
      },
    ];

    return NextResponse.json({ quotas });
  } catch (error) {
    console.error("Error in quota GET:", error);
    // Never return 500 - return empty quotas with graceful error message
    return NextResponse.json({ 
      quotas: [],
      error: "Unable to fetch quota information at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}
