/**
 * Usage Data Export API Route
 * 
 * Exports usage data in CSV or JSON format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!billingAccount) {
      return NextResponse.json({ error: 'Billing account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    
    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json({ error: 'Format must be csv or json' }, { status: 400 });
    }

    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam, 10);
    
    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Limit to prevent huge exports
    const maxEvents = 10000;
    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId: billingAccount.id,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'desc' },
      take: maxEvents,
    });

    if (events.length >= maxEvents) {
      appLogger.warn(`[Usage Export] Limited to ${maxEvents} events for export`, { maxEvents, eventCount: events.length });
    }

    if (format === 'csv') {
      const csv = [
        'Timestamp,Service,Operation,Quantity,Status',
        ...events.map((event) => {
          const [service, operation] = event.eventType.split('-');
          const status = event.metadata && typeof event.metadata === 'object' && 'error' in event.metadata
            ? 'error'
            : 'success';
          return `${event.timestamp.toISOString()},${service || 'unknown'},${operation || 'unknown'},${event.quantity},${status}`;
        }),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="settler-usage-${days}d.csv"`,
        },
      });
    } else {
      const json = JSON.stringify(
        events.map((event) => {
          const [service, operation] = event.eventType.split('-');
          return {
            timestamp: event.timestamp.toISOString(),
            service: service || 'unknown',
            operation: operation || 'unknown',
            quantity: Number(event.quantity),
            metadata: event.metadata,
          };
        }),
        null,
        2
      );

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="settler-usage-${days}d.json"`,
        },
      });
    }
  } catch {
    appLogger.error('[Usage Export] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export data',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);
