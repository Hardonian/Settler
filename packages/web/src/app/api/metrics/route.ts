/**
 * Metrics Endpoint
 *
 * Returns performance metrics (dev only)
 * Protected endpoint - requires authentication in production
 */

import { NextRequest, NextResponse } from "next/server";
import { metricsCollector } from "@/lib/observability/metrics";
import { getTraceId } from "@/lib/observability/trace";
import { logger } from "@/lib/observability/logger";
import { requireAuth } from "@/lib/api/auth-gate";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  const traceId = await getTraceId(request);

  // Require authentication for metrics endpoint
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }

  // Only allow in development or with auth token
  const isDev = process.env.NODE_ENV === "development";
  const authToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedToken = process.env.METRICS_AUTH_TOKEN;

  if (!isDev && (!expectedToken || authToken !== expectedToken)) {
    await logger.warn("Unauthorized metrics access attempt", {
      trace_id: traceId,
      user_id: authResult.user?.id,
    });
    return NextResponse.json({ error: "Unauthorized", trace_id: traceId }, { status: 401 });
  }

  const summary = metricsCollector.getMetricsSummary();
  const recentMetrics = metricsCollector.getMetrics().slice(-100); // Last 100 metrics

  const response = NextResponse.json(
    {
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      summary,
      recent_metrics: recentMetrics,
    },
    { status: 200 }
  );

  response.headers.set("x-trace-id", traceId);
  return response;
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
