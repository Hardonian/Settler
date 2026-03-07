import { NextRequest, NextResponse } from "next/server";
import { apiProblem, okJson } from "@/lib/api/problem";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/auth-gate";
import { getFoundryDatasets } from "@/lib/foundry/store";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const traceId = await getTraceId(request);
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return apiProblem({
      type: "https://settler.dev/problems/authentication",
      title: "Unauthorized",
      status: 401,
      detail: "Authentication required",
      traceId,
    });
  }

  try {
    const datasets = getFoundryDatasets(auth.user?.id);
    return okJson({ datasets }, traceId);
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
