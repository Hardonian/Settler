import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock experiments (in production, fetch from experiments table)
    const experiments = [
      {
        id: "exp-1",
        name: "Pricing Page A/B Test",
        variant: "Variant A: $99/month",
        traffic: 50,
        conversionRate: 3.2,
        revenue: 15840,
        status: "active",
      },
      {
        id: "exp-2",
        name: "Annual Discount Test",
        variant: "20% Annual Discount",
        traffic: 30,
        conversionRate: 4.5,
        revenue: 10800,
        status: "active",
      },
    ];

    return NextResponse.json({ experiments });
  } catch (_error) {
    appLogger.error("Error in experiments GET", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
