import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, buildContext, fail, getLatestResult, ok } from "@/lib/api/v1/recon/core";
import type { ReconciliationProofCapsule } from "@settler/protocol";

export type TrustRunContext = {
  tenantId: string;
  runId: string;
  metadata: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  proofCapsule: ReconciliationProofCapsule | null;
};

export async function withTrustRun(
  request: NextRequest,
  params: Promise<{ id: string }>,
  fn: (ctx: TrustRunContext) => Promise<NextResponse> | NextResponse
) {
  const apiCtx = await buildContext(request);
  if (apiCtx instanceof NextResponse) return apiCtx;
  const limited = applyRateLimit(apiCtx, "read");
  if (limited) return limited;

  try {
    const { id } = await params;
    const result = await getLatestResult(apiCtx, id);

    if (!result) {
      return NextResponse.json(
        { code: "SETTLER_NOT_FOUND", error: "Run evidence not found" },
        { status: 404 }
      );
    }

    const response = await fn({
      tenantId: apiCtx.tenantId,
      runId: id,
      metadata: (result.metadata as Record<string, unknown> | null) || null,
      summary: (result.summary as Record<string, unknown> | null) || null,
      proofCapsule: (result.proofCapsule as ReconciliationProofCapsule | null) || null,
    });

    return ok(response, apiCtx.requestId);
  } catch (error) {
    return fail(error, request, apiCtx.requestId);
  }
}
