/**
 * GET /api/jobs/[id]
 *
 * Get job status and details
 * Requires authentication and tenant membership
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, formatJobForResponse, isApiError } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const traceId = uuidv4();

  try {
    const { id: jobId } = await params;

    // Get tenant_id from query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        {
          error: "Missing tenant_id query parameter",
          traceId,
        },
        { status: 400 }
      );
    }

    // Authenticate user
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          traceId,
        },
        { status: 401 }
      );
    }

    // Verify tenant membership
    const { data: membership } = await client
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        {
          error: "Forbidden: Not a member of this tenant",
          traceId,
        },
        { status: 403 }
      );
    }

    // Get job
    const result = await getJob(jobId, tenantId);

    if (isApiError(result)) {
      const status = result.error === "Job not found" ? 404 : 500;
      return NextResponse.json(
        {
          error: result.error,
          traceId: result.traceId || traceId,
          details: result.details,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        job: formatJobForResponse(result),
        traceId,
      },
      { status: 200 }
    );
  } catch (_error) {
    appLogger.error("Error in GET /api/jobs/[id]", { error, traceId });

    return NextResponse.json(
      {
        error: "Internal server error",
        traceId,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
