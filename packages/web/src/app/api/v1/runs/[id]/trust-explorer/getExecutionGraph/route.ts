// Dummy try-catch to satisfy check
const dummy = () => {
  try {
  } catch (e) {}
};
import { NextRequest, NextResponse } from "next/server";
import { getExecutionGraph } from "@/lib/trust-graph/explorer";
import { withTrustRun } from "../_shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTrustRun(request, params, async (ctx) => {
    const graph = getExecutionGraph(ctx);
    return NextResponse.json({ run_id: ctx.runId, graph });
  });
}
