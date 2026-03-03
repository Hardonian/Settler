import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimit,
  buildContext,
  fail,
  getLatestResult,
  getRun,
  ok,
} from "@/lib/api/v1/recon/core";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const { id } = await params;
    const run = await getRun(ctx, id);
    if (!run)
      return NextResponse.json(
        { code: "SETTLER_NOT_FOUND", error: "Run not found" },
        { status: 404 }
      );
    const result = await getLatestResult(ctx, run.id);
    return ok(
      NextResponse.json({
        id: run.id,
        status: result?.status || run.status,
        metadata: { sourceAdapter: run.sourceAdapter, targetAdapter: run.targetAdapter },
        created_at: run.createdAt.toISOString(),
      }),
      ctx.requestId
    );
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
