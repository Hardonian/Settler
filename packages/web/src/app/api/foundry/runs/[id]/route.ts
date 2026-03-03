import { NextRequest, NextResponse } from "next/server";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryRuns } from "@/lib/foundry/store";

function problem(status: number, title: string, detail: string, traceId: string): NextResponse {
  return new NextResponse(
    JSON.stringify({ type: "about:blank", title, status, detail, trace_id: traceId }),
    { status, headers: { "content-type": "application/problem+json" } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const traceId = await getTraceId(request);
  const auth = await requireAuth(request);
  if (!auth.authenticated) return problem(401, "Unauthorized", "Authentication required", traceId);

  const { id } = await params;
  try {
    const run = getFoundryRuns().find((entry) => entry.dataset_run_id === id);
    if (!run) return problem(404, "Not found", "Run not found", traceId);
    return NextResponse.json({ run, trace_id: traceId });
  } catch (error) {
    return problem(
      500,
      "Foundry read failed",
      error instanceof Error ? error.message : "Unknown error",
      traceId
    );
  }
}
