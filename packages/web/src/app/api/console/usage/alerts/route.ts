/**
 * Usage Alerts API Route
 * 
 * Returns usage limit alerts for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserUsageAlerts } from '@/lib/alerts/usage-alerts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await getCurrentUserUsageAlerts();

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[Usage Alerts API] Error:', error);
    return NextResponse.json({ alerts: [] });
  }
}
