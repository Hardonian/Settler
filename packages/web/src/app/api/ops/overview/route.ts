/**
 * Ops Overview API
 * 
 * Returns health status and key metrics for ops dashboard
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    // Calculate health status
    const [totalCustomers, activeCustomers, recentErrors, pendingJobs, failedWebhooks] =
      await Promise.all([
        prisma.billingAccount.count(),
        prisma.billingAccount.count({
          where: {
            status: 'active',
          },
        }),
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM ops_errors
          WHERE created_at > NOW() - INTERVAL '24 hours'
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM ops_jobs
          WHERE status = 'pending'
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM ops_webhooks
          WHERE status = 'failed'
          AND created_at > NOW() - INTERVAL '24 hours'
        `,
      ]);

    // Get usage from ops_usage_aggregates (will be created in migration)
    const usageResult = await prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COALESCE(SUM(usage_count), 0) as total
      FROM ops_usage_aggregates
      WHERE date >= CURRENT_DATE - INTERVAL '1 day'
    `;

    const totalUsage = Number(usageResult[0]?.total || 0);
    const errorCount = Number(recentErrors[0]?.count || 0);
    const totalRequests = totalUsage || 1; // Avoid division by zero
    const errorRate = (errorCount / totalRequests) * 100;

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    let healthMessage = 'All systems operational';

    const failedWebhookCount = failedWebhooks?.[0] ? Number(failedWebhooks[0].count) : 0;
    const pendingJobCount = pendingJobs?.[0] ? Number(pendingJobs[0].count) : 0;

    if (errorRate > 5 || failedWebhookCount > 10) {
      healthStatus = 'critical';
      healthMessage = 'High error rate or webhook failures detected';
    } else if (errorRate > 1 || pendingJobCount > 50) {
      healthStatus = 'warning';
      healthMessage = 'Elevated error rate or job queue backlog';
    }

    return NextResponse.json({
      health: {
        status: healthStatus,
        message: healthMessage,
      },
      totalCustomers,
      activeCustomers,
      totalUsage,
      errorRate: Math.min(errorRate, 100), // Cap at 100%
      pendingJobs: pendingJobCount,
      failedWebhooks: failedWebhookCount,
    });
  } catch (error) {
    console.error('Ops overview error:', error);
    return NextResponse.json(
      {
        health: {
          status: 'critical' as const,
          message: 'Failed to load overview data',
        },
        totalCustomers: 0,
        activeCustomers: 0,
        totalUsage: 0,
        errorRate: 0,
        pendingJobs: 0,
        failedWebhooks: 0,
      },
      { status: 500 }
    );
  }
}
