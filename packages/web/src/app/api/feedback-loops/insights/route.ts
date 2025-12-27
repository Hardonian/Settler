/**
 * API Route: Usage Insights Feedback Loop
 * 
 * Returns automatically generated insights from usage patterns.
 * These insights inform messaging, UI emphasis, and docs prioritization.
 */

import { NextResponse } from 'next/server';
import { getLatestInsights } from '@/lib/feedback-loops/usage-insights';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET() {
  try {
    const insights = await getLatestInsights(10);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[Feedback Loops] Error fetching insights:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insights',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' });
