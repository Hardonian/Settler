import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    // Get actual usage from usage_events or ops_usage_aggregates
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate usage from usage_events table
    const { data: usageEvents } = await supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    const usageByType: Record<string, number> = {};
    if (usageEvents && Array.isArray(usageEvents)) {
      usageEvents.forEach((event: any) => {
        const eventType = event?.event_type || 'unknown';
        const quantity = event?.quantity || 1;
        usageByType[eventType] = (usageByType[eventType] || 0) + quantity;
      });
    }

    // Determine limits based on plan (default to starter plan limits)
    // Check metadata or stripePriceId to infer plan
    const planLimits: Record<string, number> = {
      starter: 10000,
      growth: 100000,
      enterprise: 1000000,
    };
    const metadata = subscription?.metadata as Record<string, any> | null;
    const plan = metadata?.plan || 'starter';
    const baseLimit: number = planLimits[plan as string] ?? planLimits.starter;

    const quotas = [
      {
        endpoint: "/api/reconcile",
        limit: baseLimit,
        used: usageByType.reconciliation || 0,
        resetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        endpoint: "/api/integrations/sync",
        limit: baseLimit,
        used: usageByType.integration_sync || 0,
        resetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        endpoint: "/api/webhooks",
        limit: baseLimit * 2,
        used: usageByType.webhook || 0,
        resetAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
