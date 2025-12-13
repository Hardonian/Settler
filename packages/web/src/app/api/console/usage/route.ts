/**
 * Console Usage API Route
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { getUsageEvents, getUsageSummary } from '@/domain/console/usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    const authContext = await requireAuth(request);

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: authContext.userId },
    });

    if (!billingAccount) {
      // Return empty data instead of 404
      return NextResponse.json({
        summary: {
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          period: { start: new Date().toISOString(), end: new Date().toISOString() },
        },
        events: [],
      });
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
