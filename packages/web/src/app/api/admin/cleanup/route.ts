/**
 * Data Cleanup API Route
 * 
 * POST /api/admin/cleanup - Trigger data retention cleanup
 * GET /api/admin/cleanup/summary - Get retention summary
 */

import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { cleanupAllExpiredData, getRetentionSummary } from '@/lib/data-retention/policies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup
 */
export async function POST() {
  try {
    // CRITICAL: Require super admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
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
    // CRITICAL: Require super admin access
    const adminCheck = await isSuperAdmin();
    if (!adminCheck) {
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
