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
import { getExecutionGraph, verifyProofChain } from "@/lib/trust-graph/explorer";

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
        { code: "SETTLER_NOT_FOUND", error: "Evidence not found" },
        { status: 404 }
      );
    const payload = {
      run_id: id,
      evidence: {
        proof_capsule: result.proofCapsule || {},
        artifact_path: `/tenant/${ctx.tenantId}/runs/${id}/evidence.json`,
      },
    };
    const graph = getExecutionGraph({
      tenantId: ctx.tenantId,
      runId: id,
      metadata: (result.metadata as Record<string, unknown> | null) || null,
      summary: (result.summary as Record<string, unknown> | null) || null,
      proofCapsule:
        (result.proofCapsule as import("@settler/protocol").ReconciliationProofCapsule | null) ||
        null,
    });
    const verification = verifyProofChain({
      tenantId: ctx.tenantId,
      runId: id,
      metadata: (result.metadata as Record<string, unknown> | null) || null,
      summary: (result.summary as Record<string, unknown> | null) || null,
      proofCapsule:
        (result.proofCapsule as import("@settler/protocol").ReconciliationProofCapsule | null) ||
        null,
    });
    payload.evidence.proof_capsule = {
      ...(payload.evidence.proof_capsule as Record<string, unknown>),
      graphHash: graph.graphHash,
      proofNodeRefs: verification.proofNodeRefs,
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
