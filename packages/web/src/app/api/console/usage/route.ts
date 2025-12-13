/**
 * Console Usage API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { getUsageEvents, getUsageSummary } from '@/domain/console/usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [summary, events] = await Promise.all([
      getUsageSummary(billingAccount.id, startDate, endDate),
      getUsageEvents(billingAccount.id, {
        startDate,
        endDate,
        limit: 100,
      }),
    ]);

    return NextResponse.json({ summary, events });
  } catch (error) {
    console.error('[Console Usage] Error:', error);
    // Return 200 with empty data instead of 500
    return NextResponse.json({
      summary: {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: { start: new Date(), end: new Date() },
      },
      events: [],
    });
  }
}
