import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildContext, fail, ok, applyRateLimit } from "@/lib/api/v1/recon/core";
import { getMetricsSummary } from "@/lib/metrics/repository";

const QuerySchema = z.object({ window: z.enum(["24h", "7d", "30d"]).optional() });

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const parsed = QuerySchema.parse({
      window: request.nextUrl.searchParams.get("window") ?? undefined,
    });
    const summary = await getMetricsSummary(ctx.tenantId, parsed.window ?? null);
    return ok(NextResponse.json(summary), ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
