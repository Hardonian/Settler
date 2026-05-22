import { NextRequest, NextResponse } from "next/server";
import { traceArtifactLineage } from "@/lib/trust-graph/explorer";
import { withTrustRun } from "../_shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTrustRun(request, params, async (ctx) => {
    const artifactNodeId = request.nextUrl.searchParams.get("artifactNodeId") || undefined;
    const lineage = traceArtifactLineage({ ...ctx, artifactNodeId });
    return NextResponse.json({ run_id: ctx.runId, lineage });
  });
}
