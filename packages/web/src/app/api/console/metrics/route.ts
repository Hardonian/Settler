/**
 * Executive Metrics API Route
 * 
 * GET /api/console/metrics - Get executive dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExecutiveMetrics, getBillingAccountMetrics } from '@/lib/metrics/service';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/console/metrics
 */
export async function GET(request: NextRequest) {
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
    const billingAccountId = request.nextUrl.searchParams.get('billingAccountId');

    if (billingAccountId) {
      // Get metrics for specific billing account
      const metrics = await getBillingAccountMetrics(billingAccountId);
      
      if (!metrics) {
        return NextResponse.json(
          { error: 'Billing account not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(metrics);
    }

    // Get global metrics (admin only)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const metrics = await getExecutiveMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
