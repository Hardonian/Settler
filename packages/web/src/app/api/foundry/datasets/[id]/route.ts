import { NextRequest, NextResponse } from "next/server";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryDatasets, getFoundryItems, getFoundryRuns } from "@/lib/foundry/store";

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
    const dataset = getFoundryDatasets(auth.user?.id).find((entry) => entry.dataset_id === id);
    if (!dataset) return problem(404, "Not found", "Dataset not found", traceId);
    return NextResponse.json({
      dataset,
      items: getFoundryItems(id),
      runs: getFoundryRuns(id),
      trace_id: traceId,
    });
  } catch (error) {
    return problem(
      500,
      "Foundry read failed",
      error instanceof Error ? error.message : "Unknown error",
      traceId
    );
  }
}
