/**
 * Usage Alerts API Route
 * 
 * Returns usage limit alerts for the authenticated user.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserUsageAlerts } from '@/lib/alerts/usage-alerts';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await getCurrentUserUsageAlerts();

    return NextResponse.json({ alerts });
  } catch {
    appLogger.error('[Usage Alerts API] Error', error);
    return NextResponse.json({ alerts: [] });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
