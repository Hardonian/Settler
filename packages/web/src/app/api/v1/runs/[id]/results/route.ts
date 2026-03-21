import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimit,
  buildContext,
  checkConditionalGet,
  fail,
  getLatestResult,
  ok,
  setCachingHeaders,
} from "@/lib/api/v1/recon/core";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await buildContext(request);
  if (ctx instanceof NextResponse) return ctx;
  const limited = await applyRateLimit(ctx, "read");
  if (limited) return limited;

  try {
    const { id } = await params;
    const result = await getLatestResult(ctx, id);
    if (!result)
      return NextResponse.json(
        { code: "SETTLER_NOT_FOUND", error: "Results not found" },
        { status: 404 }
      );
    const payload = {
      run_id: id,
      status: result.status,
      summary: result.summary,
      counts: {
        matched: result.matchedCount,
        unmatched_source: result.unmatchedSourceCount,
        unmatched_target: result.unmatchedTargetCount,
      },
    };
    const notModified = checkConditionalGet(request, payload);
    if (notModified) return ok(notModified, ctx.requestId);
    const response = NextResponse.json(payload);
    setCachingHeaders(response, payload, true);
    return ok(response, ctx.requestId);
  } catch (error) {
    return fail(error, request, ctx.requestId);
  }
}
