/**
 * Data Cleanup API Route
 * 
 * POST /api/admin/cleanup - Trigger data retention cleanup
 * GET /api/admin/cleanup/summary - Get retention summary
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cleanupAllExpiredData, getRetentionSummary } from '@/lib/data-retention/policies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified - would use proper role check)
    const isAdmin = user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const results = await cleanupAllExpiredData();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cleanup API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup/summary
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (simplified - would use proper role check)
    const isAdmin = user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const summary = await getRetentionSummary();

    return NextResponse.json({
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cleanup API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get retention summary' },
      { status: 500 }
    );
  }
}
