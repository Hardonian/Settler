/**
 * Internal Admin Health Endpoint
 * 
 * Provides detailed health metrics for admin/internal use.
 * Requires authentication and admin access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Lazy PrismaClient initialization to avoid build-time errors
function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  return new PrismaClient();
}

export async function GET(_request: NextRequest) {
  const prisma = getPrisma();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get webhook failures (last 24h)
    const webhookFailures = await prisma.stripeEvent.count({
      where: {
        status: 'failed',
        receivedAt: {
          gte: last24h,
        },
      },
    });

    // Get reconciliation error counts (last 24h)
    const reconErrors = await prisma.reconResult.count({
      where: {
        status: 'failed',
        startedAt: {
          gte: last24h,
        },
      },
    });

    // Get retry backlog (failed webhook deliveries)
    const retryBacklog = await prisma.webhookDelivery.count({
      where: {
        status: 'failed',
        nextRetryAt: {
          not: null,
        },
      },
    });

    // Get queue lag (simplified - would need actual queue metrics)
    const queueLag = {
      webhooks: retryBacklog,
      reconciliations: await prisma.reconciliationRun.count({
        where: {
          status: 'pending',
        },
      }),
    };

    // Get recent error spikes
    const errorSpikes = await prisma.reconResult.count({
      where: {
        status: 'failed',
        startedAt: {
          gte: last7d,
        },
      },
    });

    // Get system components status
    const components = {
      web: 'operational', // Would check actual web server
      api: 'operational', // Would check API server
      db: await checkDatabaseHealth(),
      stripeWebhooks: webhookFailures < 10 ? 'operational' : 'degraded',
      providerConnectors: 'operational', // Would check connector health
    };

    return NextResponse.json({
      timestamp: now.toISOString(),
      components,
      metrics: {
        webhookFailures24h: webhookFailures,
        reconErrors24h: reconErrors,
        retryBacklog,
        queueLag,
        errorSpikes7d: errorSpikes,
      },
      alerts: [
        ...(webhookFailures > 10 ? [{ type: 'webhook_failures', severity: 'high', count: webhookFailures }] : []),
        ...(reconErrors > 50 ? [{ type: 'recon_errors', severity: 'high', count: reconErrors }] : []),
        ...(retryBacklog > 100 ? [{ type: 'retry_backlog', severity: 'medium', count: retryBacklog }] : []),
      ],
    });
  } catch (error) {
    console.error('Failed to get admin health:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve health metrics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDatabaseHealth(): Promise<'operational' | 'degraded' | 'down'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'operational';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'degraded';
  }
}
