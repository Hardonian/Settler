import { NextRequest, NextResponse } from "next/server";
import { getExecutionGraph, verifyProofChain } from "@/lib/trust-graph/explorer";
import { withTrustRun } from "../_shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTrustRun(request, params, async (ctx) => {
    const graph = getExecutionGraph(ctx);
    const verification = verifyProofChain(ctx);

    return NextResponse.json({
      run_id: ctx.runId,
      verification,
      proof_capsule: {
        ...(ctx.proofCapsule || {}),
        graphHash: graph.graphHash,
        proofNodeRefs: verification.proofNodeRefs,
      },
    });
  });
}
