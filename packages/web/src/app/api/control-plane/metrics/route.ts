import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import { getMetricsSummary } from "@/lib/metrics/repository";
import { isValidAuth } from "@/lib/type-safety/route-helpers";

export const runtime = "nodejs";

type ControlPlaneMetrics = {
  requestCount: number;
  errorRate: number;
  p95Latency: number;
  period: "day" | "week" | "month";
  trace_id: string;
  timestamp: string;
  component: "control-plane-metrics";
  event_type: "metrics_snapshot";
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function resolveTenantId(request: NextRequest): Promise<string | null> {
  const apiKeyAuth = await authenticateApiKey(request);
  if (isValidAuth(apiKeyAuth) && apiKeyAuth.tenantId) {
    return apiKeyAuth.tenantId;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const account = await prisma.billingAccount.findFirst({
    where: { userId: user.id },
    select: { tenantId: true },
  });

  return account?.tenantId ?? null;
}

export const GET = withSecurity(async (request: NextRequest) => {
  try {
    const tenantId = await resolveTenantId(request);
    if (!tenantId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Tenant context is required to read metrics",
        },
        { status: 401 }
      );
    }

    const summary = (await getMetricsSummary(tenantId, "7d")) as Record<string, unknown>;
    const requests = toNumber(summary["runs_total"]);
    const errors = toNumber(summary["errors"]);

    const payload: ControlPlaneMetrics = {
      requestCount: requests,
      errorRate: requests > 0 ? errors / requests : 0,
      p95Latency: Math.round(toNumber(summary["avg_latency"])),
      period: "week",
      trace_id: request.headers.get("x-request-id") ?? randomUUID(),
      timestamp: new Date().toISOString(),
      component: "control-plane-metrics",
      event_type: "metrics_snapshot",
    };

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: "MetricsUnavailable",
        message: "Unable to load control-plane metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
});
