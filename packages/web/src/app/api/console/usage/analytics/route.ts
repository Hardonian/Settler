/**
 * Usage Analytics API Route
 *
 * Returns detailed usage analytics including trends and forecasts.
 * Enhanced with comprehensive error handling and validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import { getCurrentUsage } from "@/lib/usage/tracking";
import { getAccountPlanCode } from "@/domain/billing/entitlements";
import { getPlanConfig } from "@/domain/billing/planConfig";
import {
  getCorrelationId,
  addCorrelationHeaders,
  createLogger,
} from "@/lib/monitoring/correlation";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { executeWithRetry } from "@/lib/db/connection-pool";
import { getUsageDailyBuckets, getUsageSummaryAggregate } from "@/lib/console/usage-aggregation";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const startedAt = Date.now();
      let statusCode = 500;
      let queryRows = 0;
      let payloadBytes = 0;
      const correlationId = await getCorrelationId();
      const logger = await createLogger({ route: "/api/console/usage/analytics", method: "GET" });

      try {
        logger.info("Usage analytics request started", { correlationId });

        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          logger.warn("Authentication failed", { correlationId, error: authError?.message });
          statusCode = 401;
          const unauthorizedPayload = { error: "Unauthorized" };
          payloadBytes = estimateJsonPayloadBytes(unauthorizedPayload);
          const response = NextResponse.json(unauthorizedPayload, { status: 401 });
          return addCorrelationHeaders(response, correlationId);
        }

        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });

        if (!billingAccount) {
          logger.info("No billing account found", { correlationId });
          const emptyPayload = {
            totalCalls: 0,
            byService: {},
            byOperation: {},
            errorRate: 0,
            costEstimate: 0,
            trends: { daily: [], weekly: [] },
            forecast: { next30Days: 0, next90Days: 0 },
            limits: {},
          };
          statusCode = 200;
          payloadBytes = estimateJsonPayloadBytes(emptyPayload);
          const response = NextResponse.json(emptyPayload);
          return addCorrelationHeaders(response, correlationId);
        }

        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get("days");

        // Validate days parameter
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        if (isNaN(days) || days < 1 || days > 365) {
          logger.warn("Invalid days parameter", { correlationId, days: daysParam });
          statusCode = 400;
          const badRequestPayload = { error: "Days parameter must be between 1 and 365" };
          payloadBytes = estimateJsonPayloadBytes(badRequestPayload);
          const response = NextResponse.json(badRequestPayload, { status: 400 });
          return addCorrelationHeaders(response, correlationId);
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        // Aggregate usage and trend buckets server-side.
        let summaryAggregate;
        let daily;
        try {
          [summaryAggregate, daily] = await executeWithRetry(() =>
            Promise.all([
              getUsageSummaryAggregate(billingAccount.id, startDate, endDate),
              getUsageDailyBuckets(billingAccount.id, startDate, endDate),
            ])
          );
          queryRows = summaryAggregate.matchedRows;
        } catch (dbError) {
          logger.error("Database error fetching events", {
            correlationId,
            error: dbError instanceof Error ? dbError.message : "Unknown error",
          });
          // Return empty data instead of error
          const emptyPayload = {
            totalCalls: 0,
            byService: {},
            byOperation: {},
            errorRate: 0,
            costEstimate: 0,
            trends: { daily: [], weekly: [] },
            forecast: { next30Days: 0, next90Days: 0 },
            limits: {},
          };
          statusCode = 200;
          payloadBytes = estimateJsonPayloadBytes(emptyPayload);
          const response = NextResponse.json(emptyPayload);
          return addCorrelationHeaders(response, correlationId);
        }

        // Simple forecast (average daily * days) with error handling
        let avgDaily = 0;
        try {
          avgDaily =
            daily.length > 0
              ? daily.reduce((sum: number, d: { calls: number }) => sum + d.calls, 0) / daily.length
              : 0;
        } catch {
          avgDaily = 0;
        }

        const forecast = {
          next30Days: Math.round(avgDaily * 30),
          next90Days: Math.round(avgDaily * 90),
        };

        // Calculate cost estimate with error handling
        let costEstimate = 0;
        try {
          const planCode = await getAccountPlanCode(billingAccount.id).catch(() => "starter");
          const planConfig = getPlanConfig(planCode);
          costEstimate = planCode === "starter" ? 0 : planConfig?.monthlyPrice || 0;
        } catch {
          costEstimate = 0;
        }

        // Get limits with error handling
        const limits: Record<string, { current: number; limit: number; remaining: number }> = {};
        const services: Array<"reconcile" | "receipts" | "featureFlags"> = [
          "reconcile",
          "receipts",
          "featureFlags",
        ];

        for (const service of services) {
          try {
            const usage = await getCurrentUsage(billingAccount.id, service, "monthly");
            limits[service] = {
              current: usage.current,
              limit: usage.limit === -1 ? 0 : usage.limit,
              remaining: usage.remaining === -1 ? -1 : usage.remaining,
            };
          } catch (usageError) {
            logger.warn(`Error getting usage for ${service}`, {
              correlationId,
              service,
              error: usageError instanceof Error ? usageError.message : "Unknown error",
            });
            // Continue with other services
          }
        }

        logger.info("Analytics calculated successfully", {
          correlationId,
          totalCalls: summaryAggregate.totalCalls,
          errorRate: summaryAggregate.errorRate,
          days,
          groupedEventTypes: summaryAggregate.groupedEventTypes,
          matchedRows: summaryAggregate.matchedRows,
        });

        const payload = {
          totalCalls: summaryAggregate.totalCalls,
          byService: summaryAggregate.byService,
          byOperation: summaryAggregate.byOperation,
          errorRate: summaryAggregate.errorRate,
          costEstimate,
          trends: {
            daily,
            weekly: [], // Could calculate weekly aggregation
          },
          forecast,
          limits,
        };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(payload);
        const response = NextResponse.json(payload);

        return addCorrelationHeaders(response, correlationId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error calculating analytics", {
          correlationId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Return empty data instead of error
        const emptyPayload = {
          totalCalls: 0,
          byService: {},
          byOperation: {},
          errorRate: 0,
          costEstimate: 0,
          trends: { daily: [], weekly: [] },
          forecast: { next30Days: 0, next90Days: 0 },
          limits: {},
        };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(emptyPayload);
        const response = NextResponse.json(emptyPayload, { status: 200 });
        return addCorrelationHeaders(response, correlationId);
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage/analytics",
          method: "GET",
          statusCode,
          latencyMs: Date.now() - startedAt,
          queryRows,
          payloadBytes,
          mode: "sync",
        });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
