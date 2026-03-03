import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildContext, fail, ok, applyRateLimit } from "@/lib/api/v1/recon/core";
import { getMetricsTimeseries } from "@/lib/metrics/repository";

const QuerySchema = z.object({
  metric: z.enum(["runs", "latency_p95", "compute_units"]).default("runs"),
  bucket: z.enum(["hour", "day"]).default("hour"),
  window: z.enum(["24h", "7d", "30d"]).optional(),
  group_by: z.enum(["status", "route", "policy"]).default("status"),
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const parsed = QuerySchema.parse({
      metric: request.nextUrl.searchParams.get("metric") ?? undefined,
      bucket: request.nextUrl.searchParams.get("bucket") ?? undefined,
      window: request.nextUrl.searchParams.get("window") ?? undefined,
      group_by: request.nextUrl.searchParams.get("group_by") ?? undefined,
    });
    const series = await getMetricsTimeseries(ctx.tenantId, {
      metric: parsed.metric,
      bucket: parsed.bucket,
      window: parsed.window ?? null,
      groupBy: parsed.group_by,
    });
    return ok(NextResponse.json({ series }), ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
