/**
 * Funnel Stage API Route
 * 
 * Returns current user's funnel stage.
 */

import { NextResponse } from 'next/server';
import { getCurrentFunnelStage } from '@/lib/gtm/funnels';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;

    const stage = await getCurrentFunnelStage(userId);

    return NextResponse.json({ stage });
  } catch (error) {
    console.error('[Funnel Stage API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get funnel stage' },
      { status: 500 }
    );
  }
}
