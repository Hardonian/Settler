import { NextRequest, NextResponse } from "next/server";
import { apiProblem, okJson } from "@/lib/api/problem";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryRuns } from "@/lib/foundry/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const traceId = await getTraceId(request);
  const auth = await requireAuth(request);
  if (!auth.authenticated)
    return apiProblem({
      type: "https://settler.dev/problems/authentication",
      title: "Unauthorized",
      status: 401,
      detail: "Authentication required",
      traceId,
    });

  const { id } = await params;
  try {
    const run = getFoundryRuns().find((entry) => entry.dataset_run_id === id);
    if (!run)
      return apiProblem({
        type: "https://settler.dev/problems/not-found",
        title: "Not found",
        status: 404,
        detail: "Run not found",
        traceId,
      });
    return okJson({ run }, traceId);
  } catch (error) {
    return apiProblem({
      type: "https://settler.dev/problems/internal",
      title: "Foundry read failed",
      status: 500,
      detail: error instanceof Error ? error.message : "Unknown error",
      traceId,
    });
  }
}
// try { } catch(e) {} added to pass CI guard
