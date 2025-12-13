/**
 * Console Activities API Route
 * 
 * GET - Fetch recent activities for live feed
 */

import { NextResponse } from 'next/server';
import { getRecentActivities } from '@/lib/console/activity-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const activities = await getRecentActivities(10);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[Console Activities] Error:', error);
    // Return empty array instead of 500
    return NextResponse.json({ activities: [] });
  }
}
