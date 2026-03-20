/**
 * API Route: Usage Warnings
 * Returns usage warnings when approaching limits
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";
import { getBillingAccountOptimized } from "@/lib/db/query-optimizer";
import { parseUsageEventType } from "@/lib/console/usage-aggregation";
import { executeWithRetry } from "@/lib/db/connection-pool";
import { prisma } from "@/shared/db/prismaClient";
import {
  estimateJsonPayloadBytes,
  recordUsageEndpointMetrics,
} from "@/lib/console/usage-observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest) {
      const startedAt = Date.now();
      let statusCode = 500;
      let queryRows = 0;
      let payloadBytes = 0;
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          statusCode = 401;
          const unauthorizedPayload = { error: "Unauthorized" };
          payloadBytes = estimateJsonPayloadBytes(unauthorizedPayload);
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_type")
          .eq("id", user.id)
          .single();

        if (!profile) {
          statusCode = 404;
          const missingProfilePayload = { error: "Profile not found" };
          payloadBytes = estimateJsonPayloadBytes(missingProfilePayload);
          return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const typedProfile = profile as { plan_type: string };
        // Get plan limits
        const planLimits = getPlanLimits(typedProfile.plan_type);

        // Get current usage (this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Calculate usage by type via grouped DB query (no raw-row materialization).
        const usageByType = new Map<string, number>();
        const billingAccount = await getBillingAccountOptimized(user.id, true);
        if (billingAccount?.id) {
          const groupedUsage = (await executeWithRetry(() =>
            prisma.usageEvent.groupBy({
              by: ["eventType"],
              where: {
                billingAccountId: billingAccount.id,
                timestamp: {
                  gte: startOfMonth,
                },
              },
              _sum: {
                quantity: true,
              },
              _count: {
                _all: true,
              },
            })
          )) as Array<{
            eventType: string;
            _sum: { quantity: number | string | null };
            _count: { _all: number };
          }>;
          queryRows = groupedUsage.reduce((sum: number, row) => sum + row._count._all, 0);

          for (const row of groupedUsage) {
            const quantity = Number(row._sum.quantity || 0);
            const currentEventTypeTotal = usageByType.get(row.eventType) || 0;
            usageByType.set(row.eventType, currentEventTypeTotal + quantity);

            const { service } = parseUsageEventType(row.eventType);
            const currentServiceTotal = usageByType.get(service) || 0;
            usageByType.set(service, currentServiceTotal + quantity);
          }
        }

        // Generate warnings
        const warnings: Array<{
          type: string;
          current: number;
          limit: number | "unlimited";
          percentage: number;
          severity: "info" | "warning" | "critical";
          message: string;
        }> = [];

        // Reconciliation warnings
        if (planLimits.reconciliationsPerMonth !== "unlimited") {
          const current = usageByType.get("reconciliation") || 0;
          const limit = planLimits.reconciliationsPerMonth;
          const percentage = (current / limit) * 100;

          if (percentage >= 100) {
            warnings.push({
              type: "reconciliation",
              current,
              limit,
              percentage,
              severity: "critical",
              message: `You've reached your reconciliation limit (${current}/${limit}). Upgrade to continue.`,
            });
          } else if (percentage >= 90) {
            warnings.push({
              type: "reconciliation",
              current,
              limit,
              percentage,
              severity: "critical",
              message: `You're at ${Math.round(percentage)}% of your reconciliation limit (${current}/${limit}).`,
            });
          } else if (percentage >= 80) {
            warnings.push({
              type: "reconciliation",
              current,
              limit,
              percentage,
              severity: "warning",
              message: `You're at ${Math.round(percentage)}% of your reconciliation limit (${current}/${limit}).`,
            });
          }
        }

        // Receipt parsing warnings
        if (planLimits.receiptParsesPerMonth !== "unlimited") {
          const current = usageByType.get("receipt_parse") || 0;
          const limit = planLimits.receiptParsesPerMonth;
          const percentage = (current / limit) * 100;

          if (percentage >= 100) {
            warnings.push({
              type: "receipt_parse",
              current,
              limit,
              percentage,
              severity: "critical",
              message: `You've reached your receipt parsing limit (${current}/${limit}). Upgrade to continue.`,
            });
          } else if (percentage >= 90) {
            warnings.push({
              type: "receipt_parse",
              current,
              limit,
              percentage,
              severity: "critical",
              message: `You're at ${Math.round(percentage)}% of your receipt parsing limit (${current}/${limit}).`,
            });
          } else if (percentage >= 80) {
            warnings.push({
              type: "receipt_parse",
              current,
              limit,
              percentage,
              severity: "warning",
              message: `You're at ${Math.round(percentage)}% of your receipt parsing limit (${current}/${limit}).`,
            });
          }
        }

        const responsePayload = {
          warnings,
          usage: {
            reconciliation: usageByType.get("reconciliation") || 0,
            receipt_parse: usageByType.get("receipt_parse") || 0,
            feature_flag: usageByType.get("feature_flag") || 0,
          },
          limits: planLimits,
        };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(responsePayload);
        return NextResponse.json(responsePayload);
      } catch (error) {
        appLogger.error("Usage warnings error", error);
        // Return 200 with empty warnings instead of 500 to prevent UI crash
        const fallbackPayload = {
          warnings: [],
          usage: {
            reconciliation: 0,
            receipt_parse: 0,
            feature_flag: 0,
          },
          limits: {
            reconciliationsPerMonth: 1000,
            receiptParsesPerMonth: 100,
            featureFlagEvaluationsPerMonth: 100000,
          },
        };
        statusCode = 200;
        payloadBytes = estimateJsonPayloadBytes(fallbackPayload);
        return NextResponse.json(fallbackPayload, { status: 200 });
      } finally {
        await recordUsageEndpointMetrics({
          endpoint: "/api/console/usage/warnings",
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

function getPlanLimits(planType: string) {
  switch (planType) {
    case "free":
      return {
        reconciliationsPerMonth: 1000,
        receiptParsesPerMonth: 100,
        featureFlagEvaluationsPerMonth: 100000,
      };
    case "trial":
      return {
        reconciliationsPerMonth: "unlimited" as const,
        receiptParsesPerMonth: "unlimited" as const,
        featureFlagEvaluationsPerMonth: "unlimited" as const,
      };
    case "commercial":
      return {
        reconciliationsPerMonth: 100000,
        receiptParsesPerMonth: 10000,
        featureFlagEvaluationsPerMonth: 1000000,
      };
    case "enterprise":
      return {
        reconciliationsPerMonth: "unlimited" as const,
        receiptParsesPerMonth: "unlimited" as const,
        featureFlagEvaluationsPerMonth: "unlimited" as const,
      };
    default:
      return {
        reconciliationsPerMonth: 1000,
        receiptParsesPerMonth: 100,
        featureFlagEvaluationsPerMonth: 100000,
      };
  }
}
