/**
 * Error Alerts API Route
 * 
 * Returns active error alerts for the authenticated user.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAlerts } from '@/lib/monitoring/error-alerts';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await getActiveAlerts(user.id);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('[Alerts API] Error:', error);
    return NextResponse.json({ alerts: [] });
  }
}, { feature: 'GET API' });
