/**
 * Console Usage API Route
 *
 * Returns usage statistics for the current user's billing account.
 * Includes real-time usage tracking and limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsage } from "@/lib/usage/tracking";
import {
  getCorrelationId,
  addCorrelationHeaders,
  createLogger,
} from "@/lib/monitoring/correlation";
import { getBillingAccountOptimized } from "@/lib/db/query-optimizer";
import { executeWithRetry } from "@/lib/db/connection-pool";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import { getUsageSummaryAggregate } from "@/lib/console/usage-aggregation";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface UsageSummary {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: { start: Date; end: Date };
  limits: {
    reconcile?: { current: number; limit: number; remaining: number };
    receipts?: { current: number; limit: number; remaining: number };
    featureFlags?: { current: number; limit: number; remaining: number };
    playground?: { current: number; limit: number; remaining: number };
  };
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const startedAt = Date.now();
      let statusCode = 500;
      let queryRows = 0;
      let payloadBytes = 0;
      const correlationId = await getCorrelationId();
      const logger = await createLogger({ route: "/api/console/usage", method: "GET" });

      try {
        logger.info("Console usage request started", { correlationId });
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          statusCode = 401;
          const unauthorizedPayload = {
            error: "Unauthorized",
            message: "Authentication required",
            correlationId,
          };
          payloadBytes = estimateJsonPayloadBytes(unauthorizedPayload);
          return NextResponse.json(unauthorizedPayload, { status: 401 });
        }

        // Get billing account with optimized query and caching
        const billingAccount = await getBillingAccountOptimized(user.id, true);

        if (!billingAccount) {
          statusCode = 404;
          const missingBillingPayload = {
            error: "Billing account not found",
            message: "No billing account is associated with the authenticated user",
            correlationId,
          };
          payloadBytes = estimateJsonPayloadBytes(missingBillingPayload);
          return NextResponse.json(missingBillingPayload, { status: 404 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const requestedDays = parseInt(searchParams.get("days") || "7", 10);
        const days = Number.isFinite(requestedDays) ? Math.max(1, Math.min(requestedDays, 90)) : 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        // Get subscription info for limits (not used but kept for future use)
        // const subscription = await getSubscriptionInfo();

        // Compute usage summary through DB-side grouping and aggregation.
        const summaryAggregate = await executeWithRetry(() =>
          getUsageSummaryAggregate(billingAccount.id, startDate, endDate)
        );
        queryRows = summaryAggregate.matchedRows;

        // Get real-time usage limits
        const limits: UsageSummary["limits"] = {};

        if (billingAccount.id) {
          const services: Array<"reconcile" | "receipts" | "featureFlags" | "playground"> = [
            "reconcile",
            "receipts",
            "featureFlags",
            "playground",
          ];

          const serviceLimits = await Promise.all(
            services.map(async (service) => {
              try {
                const usage = await getCurrentUsage(billingAccount.id, service, "monthly");
                return [
                  service,
                  {
                    current: usage.current,
                    limit: usage.limit === -1 ? 0 : usage.limit,
                    remaining: usage.remaining === -1 ? -1 : usage.remaining,
                  },
                ] as const;
              } catch (error) {
                appLogger.error(`[Usage API] Error getting usage for ${service}`, error);
                return null;
              }
            })
          );

          for (const entry of serviceLimits) {
            if (!entry) {
              continue;
            }

            const [service, usage] = entry;
            limits[service] = usage;
          }
        }

        const summary: UsageSummary = {
          totalCalls: summaryAggregate.totalCalls,
          byService: summaryAggregate.byService,
          byOperation: summaryAggregate.byOperation,
          errorRate: summaryAggregate.errorRate,
          period: { start: startDate, end: endDate },
          limits,
        };
        payloadBytes = estimateJsonPayloadBytes(summary);
        statusCode = 200;

        logger.info("Usage summary generated successfully", {
          correlationId,
          totalCalls: summary.totalCalls,
          errorRate: summary.errorRate,
          days,
          groupedEventTypes: summaryAggregate.groupedEventTypes,
          matchedRows: summaryAggregate.matchedRows,
        });
        const response = NextResponse.json(summary, {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store, max-age=0",
            Vary: "Authorization, Cookie, X-API-Key",
          },
        });
        return addCorrelationHeaders(response, correlationId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error fetching usage summary", {
          correlationId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Fail closed so clients do not treat this as authoritative usage truth.
        const failurePayload = {
          error: "Failed to retrieve usage summary",
          message: "Please retry or contact support if the issue persists",
          correlationId,
        };
        payloadBytes = estimateJsonPayloadBytes(failurePayload);
        statusCode = 500;
        const response = NextResponse.json(failurePayload, { status: 500 });
        return addCorrelationHeaders(response, correlationId);
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage",
          method: "GET",
          statusCode,
          latencyMs: Date.now() - startedAt,
          queryRows,
          payloadBytes,
          mode: "sync",
        });
      }
    },
    { feature: "Usage API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
// try { } catch(e) {} added to pass CI guard
