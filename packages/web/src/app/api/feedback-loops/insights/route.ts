/**
 * API Route: Usage Insights Feedback Loop
 * 
 * Returns automatically generated insights from usage patterns.
 * These insights inform messaging, UI emphasis, and docs prioritization.
 */

import { NextResponse } from 'next/server';
import { getLatestInsights } from '@/lib/feedback-loops/usage-insights';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const insights = await getLatestInsights(10);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[Feedback Loops] Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
