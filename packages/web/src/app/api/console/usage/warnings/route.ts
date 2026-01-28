/**
 * API Route: Usage Warnings
 * Returns usage warnings when approaching limits
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';
import { appLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const typedProfile = profile as { plan_type: string };
    // Get plan limits
    const planLimits = getPlanLimits(typedProfile.plan_type);

    // Get current usage (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabase
      .from("usage_events")
      .select("event_type, quantity")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    // Calculate usage by type
    const usageByType = new Map<string, number>();
    const typedUsage = (usage || []) as Array<{ event_type: string | null; quantity: number | null }>;
    typedUsage.forEach((event) => {
      const eventType = event.event_type || "unknown";
      const current = usageByType.get(eventType) || 0;
      usageByType.set(eventType, current + (event.quantity || 0));
    });

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

    return NextResponse.json({
      warnings,
      usage: {
        reconciliation: usageByType.get("reconciliation") || 0,
        receipt_parse: usageByType.get("receipt_parse") || 0,
        feature_flag: usageByType.get("feature_flag") || 0,
      },
      limits: planLimits,
    });
  } catch (error) {
    appLogger.error("Usage warnings error", error);
    // Return 200 with empty warnings instead of 500 to prevent UI crash
    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
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
