/**
 * Performance Monitoring API
 *
 * Returns real performance metrics where available,
 * and explicitly marks unavailable metrics as such.
 */

// ROUTE_CLASS: admin-internal
// AUTH: session + adminRole

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { logger } from "@/lib/observability/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  async function GET(_request: NextRequest) {
    try {
      // Count recent API usage events (real data)
      const recentUsage = await prisma.usageEvent
        .findMany({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
            eventType: "api_call",
          },
          select: {
            id: true,
          },
          take: 1000,
        })
        .catch(() => []);

      // Measure real DB latency
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbQueryTime = Date.now() - dbStartTime;

      // Real system metrics from Node.js runtime
      const mem = process.memoryUsage();

      const metrics = {
        api: {
          requestsLast24h: recentUsage.length,
          requestRate: Math.round((recentUsage.length / 24) * 100) / 100,
          // Response time percentiles require APM integration (Sentry/OTLP)
          responseTimePercentilesAvailable: false,
        },
        database: {
          latencyMs: dbQueryTime,
          // Connection pool and slow query metrics require pg_stat instrumentation
          poolMetricsAvailable: false,
        },
        system: {
          uptimeSeconds: Math.round(process.uptime()),
          heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
          rssMB: Math.round(mem.rss / 1024 / 1024),
        },
        cache: {
          // Cache metrics require Redis INFO integration
          available: false,
          message: "Connect Redis and enable METRICS_ENABLED to surface cache hit/miss rates.",
        },
      };

      return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        metrics,
      });
    } catch (error) {
      await logger.error("Failed to get performance metrics", {
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        {
          status: "error",
          error: "Failed to retrieve performance metrics",
          retryable: true,
        },
        { status: 503 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
