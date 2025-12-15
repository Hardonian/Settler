/**
 * AI Insights API Route
 * 
 * Returns AI-powered insights and recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserInsights } from '@/lib/ai/insights-generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const insights = await getCurrentUserInsights();

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[Insights API] Error:', error);
    return NextResponse.json({ insights: [] });
  }
}
