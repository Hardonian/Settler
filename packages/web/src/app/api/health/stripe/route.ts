/**
 * Stripe Webhook Health Check
 * 
 * Checks the health of Stripe webhook processing system.
 * Always returns 200 with status details (never 500).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { getCorrelationId, addCorrelationHeaders, createLogger } from '@/lib/monitoring/correlation';
import { publicRoute } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    env: {
      status: 'ok' | 'missing';
      stripeWebhookSecret: boolean;
    };
    database: {
      status: 'ok' | 'error';
      canConnect: boolean;
      canQuery: boolean;
    };
    webhookProcessing: {
      status: 'ok' | 'degraded' | 'error';
      recentEvents: number;
      failedEvents: number;
      lastProcessedAt: string | null;
    };
  };
  timestamp: string;
}

export const GET = withSecurity(
  publicRoute(async function GET() {
  const correlationId = await getCorrelationId();
  const logger = await createLogger({ route: '/api/health/stripe', method: 'GET' });
  
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {
      env: {
        status: 'ok',
        stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      database: {
        status: 'ok',
        canConnect: false,
        canQuery: false,
      },
      webhookProcessing: {
        status: 'ok',
        recentEvents: 0,
        failedEvents: 0,
        lastProcessedAt: null,
      },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    logger.info('Stripe health check started', { correlationId });

    // Check environment variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      result.checks.env.status = 'missing';
      result.status = 'degraded';
      logger.warn('Stripe webhook secret not configured', { correlationId });
    }

    // Check database connectivity
    try {
      // Try to connect and query
      await prisma.$queryRaw`SELECT 1`;
      result.checks.database.canConnect = true;
      
      // Try to query stripe_events table
      try {
        // Test query to verify table exists and is accessible
        await prisma.stripeEvent.count({
          take: 1,
        });
        result.checks.database.canQuery = true;
        
        // Get recent webhook processing stats
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentEvents = await prisma.stripeEvent.count({
          where: {
            receivedAt: {
              gte: oneHourAgo,
            },
          },
        });
        
        const failedEvents = await prisma.stripeEvent.count({
          where: {
            status: 'failed',
            receivedAt: {
              gte: oneHourAgo,
            },
          },
        });
        
        const lastProcessed = await prisma.stripeEvent.findFirst({
          where: {
            status: 'processed',
          },
          orderBy: {
            processedAt: 'desc',
          },
          select: {
            processedAt: true,
          },
        });
        
        result.checks.webhookProcessing.recentEvents = recentEvents;
        result.checks.webhookProcessing.failedEvents = failedEvents;
        result.checks.webhookProcessing.lastProcessedAt = lastProcessed?.processedAt?.toISOString() || null;
        
        // Determine webhook processing status
        if (failedEvents > 0 && recentEvents > 0) {
          const failureRate = failedEvents / recentEvents;
          if (failureRate > 0.1) {
            result.checks.webhookProcessing.status = 'error';
            result.status = 'unhealthy';
          } else if (failureRate > 0.05) {
            result.checks.webhookProcessing.status = 'degraded';
            if (result.status === 'healthy') {
              result.status = 'degraded';
            }
          }
        }
        
        logger.info('Stripe health check completed', {
          correlationId,
          status: result.status,
          recentEvents,
          failedEvents,
        });
      } catch (queryError) {
        result.checks.database.canQuery = false;
        result.checks.database.status = 'error';
        result.status = 'degraded';
        logger.warn('Cannot query stripe_events table', {
          correlationId,
          error: queryError instanceof Error ? queryError.message : 'Unknown error',
        });
      }
    } catch (dbError) {
      result.checks.database.canConnect = false;
      result.checks.database.status = 'error';
      result.status = 'unhealthy';
      logger.error('Database connection failed', {
        correlationId,
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
    }
  } catch (_error) {
    // Never throw - always return health check result
    logger.error('Health check error', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    result.status = 'unhealthy';
  }

  // Always return 200 with status details
  const response = NextResponse.json(result, { status: 200 });
  return addCorrelationHeaders(response, correlationId);
}),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);
