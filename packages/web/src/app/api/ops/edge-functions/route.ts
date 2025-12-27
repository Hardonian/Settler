import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withUniversalBillingGate(async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock edge function health (in production, fetch from Supabase Edge Functions monitoring)
    const functions = [
      {
        name: "integration-sync-stripe",
        status: "healthy",
        invocations: 1250,
        errors: 2,
        avgDuration: 145,
      },
      {
        name: "integration-sync-shopify",
        status: "healthy",
        invocations: 980,
        errors: 0,
        avgDuration: 132,
      },
      {
        name: "compute-bill",
        status: "healthy",
        invocations: 450,
        errors: 1,
        avgDuration: 89,
      },
      {
        name: "sync-usage-to-stripe",
        status: "degraded",
        invocations: 320,
        errors: 8,
        avgDuration: 245,
      },
    ];

    return NextResponse.json({ functions });
  } catch (error) {
    console.error("Error in edge-functions GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' });
