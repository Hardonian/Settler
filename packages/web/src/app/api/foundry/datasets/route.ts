import { NextRequest, NextResponse } from "next/server";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryDatasets } from "@/lib/foundry/store";

function problem(status: number, title: string, detail: string, traceId: string): NextResponse {
  return new NextResponse(
    JSON.stringify({ type: "about:blank", title, status, detail, trace_id: traceId }),
    { status, headers: { "content-type": "application/problem+json" } }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const traceId = await getTraceId(request);
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return problem(401, "Unauthorized", "Authentication required", traceId);
  }

  try {
    const datasets = getFoundryDatasets(auth.user?.id);
    return NextResponse.json({ datasets, trace_id: traceId });
  } catch (error) {
    return problem(
      500,
      "Foundry read failed",
      error instanceof Error ? error.message : "Unknown error",
      traceId
    );
  }
}
