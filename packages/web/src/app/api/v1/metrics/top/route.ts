import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildContext, fail, ok, applyRateLimit } from "@/lib/api/v1/recon/core";
import { getTopMetrics } from "@/lib/metrics/repository";

const QuerySchema = z.object({
  kind: z.enum(["slow_routes", "expensive_runs", "denied_policies"]).default("slow_routes"),
  window: z.enum(["24h", "7d", "30d"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const parsed = QuerySchema.parse({
      kind: request.nextUrl.searchParams.get("kind") ?? undefined,
      window: request.nextUrl.searchParams.get("window") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const rows = await getTopMetrics(ctx.tenantId, { ...parsed, window: parsed.window ?? null });
    return ok(NextResponse.json({ rows }), ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
