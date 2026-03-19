/**
 * GET /api/jobs/[id]/result
 *
 * Get job result
 * Requires authentication and tenant membership
 */

import { NextRequest, NextResponse } from "next/server";
import { getJobResult, formatJobResultForResponse, isApiError } from "@/lib/jobs";
import {
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const JobIdSchema = z.string().uuid();
interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withSecurity(
  async function GET(request: NextRequest, { params }: RouteParams) {
    const traceId = uuidv4();

    try {
      const { id: jobId } = await params;
      if (!JobIdSchema.safeParse(jobId).success) {
        return NextResponse.json(
          {
            error: "Invalid job ID",
            traceId,
          },
          { status: 400 }
        );
      }

      const { tenantIds } = await resolveTenantMembershipScope();

      // Optional tenant hint from query params (validated against memberships)
      const { searchParams } = new URL(request.url);
      const requestedTenantId = searchParams.get("tenant_id")?.trim() || null;
      if (requestedTenantId && !tenantIds.includes(requestedTenantId)) {
        return NextResponse.json(
          {
            error: "Job result not found",
            traceId,
          },
          { status: 404 }
        );
      }

      const candidateTenantIds = requestedTenantId ? [requestedTenantId] : tenantIds;
      let foundResult: ReturnType<typeof formatJobResultForResponse> | null = null;
      let lastError: { error: string; traceId?: string; details?: unknown } | null = null;

      for (const tenantId of candidateTenantIds) {
        const result = await getJobResult(jobId, tenantId);

        if (!isApiError(result)) {
          foundResult = formatJobResultForResponse(result);
          break;
        }

        if (!result.error.includes("not found")) {
          lastError = result;
          break;
        }
      }

      if (!foundResult) {
        // Determine appropriate status code
        let status = 404;
        if (lastError?.error.includes("not yet available")) {
          status = 202;
        } else if (lastError) {
          status = 500;
        }

        return NextResponse.json(
          {
            error: lastError?.error || "Job result not found",
            traceId: lastError?.traceId || traceId,
            details: lastError?.details,
          },
          { status }
        );
      }

      return NextResponse.json(
        {
          result: foundResult,
          traceId,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store, max-age=0",
            Vary: "Authorization, Cookie, X-API-Key",
          },
        }
      );
    } catch (error) {
      if (error instanceof TenantMembershipError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            traceId,
          },
          { status: error.status }
        );
      }

      appLogger.error("Error in GET /api/jobs/[id]/result", { error, traceId });

      return NextResponse.json(
        {
          error: "Internal server error",
          traceId,
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 90 }, requireAuth: false }
);
