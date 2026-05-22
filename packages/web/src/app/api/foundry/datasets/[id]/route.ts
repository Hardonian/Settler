import { NextRequest, NextResponse } from "next/server";
import { apiProblem, okJson } from "@/lib/api/problem";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryDatasets, getFoundryItems, getFoundryRuns } from "@/lib/foundry/store";

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
    const dataset = getFoundryDatasets(auth.user?.id).find((entry) => entry.dataset_id === id);
    if (!dataset)
      return apiProblem({
        type: "https://settler.dev/problems/not-found",
        title: "Not found",
        status: 404,
        detail: "Dataset not found",
        traceId,
      });
    return okJson(
      {
        dataset,
        items: getFoundryItems(id),
        runs: getFoundryRuns(id),
      },
      traceId
    );
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
