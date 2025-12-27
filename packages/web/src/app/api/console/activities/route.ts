/**
 * Console Activities API Route
 * 
 * GET - Fetch recent activities for live feed
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { getRecentActivities } from '@/lib/console/activity-logger';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const activities = await getRecentActivities(10);
    return NextResponse.json({ activities });
  } catch (error) {
    // If auth error, return 401
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Console Activities] Error:', error);
    // Return empty array instead of 500
    return NextResponse.json({ activities: [] });
  }
}, { feature: 'GET API' });
