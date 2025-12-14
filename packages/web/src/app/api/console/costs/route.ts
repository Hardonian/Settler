/**
 * Cost Visibility API Route
 * 
 * GET /api/console/costs - Get cost breakdown for billing account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPeriodCosts } from '@/lib/cost/visibility';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/console/costs
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

    // Get user's billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!billingAccount) {
      return NextResponse.json(
        { error: 'Billing account not found' },
        { status: 404 }
      );
    }

    const costs = await getCurrentPeriodCosts(billingAccount.id);

    if (!costs) {
      return NextResponse.json(
        { error: 'Failed to calculate costs' },
        { status: 500 }
      );
    }

    return NextResponse.json(costs);
  } catch (error) {
    console.error('[Costs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costs' },
      { status: 500 }
    );
  }
}
