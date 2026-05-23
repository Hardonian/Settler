/**
 * Exceptions API Routes (Workspace-scoped)
 *
 * GET /api/exceptions - List exceptions for the current workspace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { getTraceId } from "@/lib/observability/trace";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { z } from "zod";
import { listReconciliationWorkbenchExceptions } from "@/lib/server/exceptions/reconciliation-workbench";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Query parameters schema
const queryParamsSchema = z.object({
  runId: z.string().uuid().optional(),
  runKind: z.enum(["recon_job", "ingestion_run"]).optional(),
  status: z.enum(["pending", "investigating", "resolved", "ignored"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional().default("50"),
  offset: z.string().optional().default("0"),
});

type QueryParams = z.infer<typeof queryParamsSchema>;

/**
 * GET /api/exceptions - List exceptions for the current workspace
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const traceId = await getTraceId(request);

      try {
        const { tenantIds } = await resolveTenantMembershipScope();

        // Parse and validate query params
        const { searchParams } = new URL(request.url);
        const requestedTenantId =
          searchParams.get("workspace_id")?.trim() || searchParams.get("tenant_id")?.trim() || null;
        const tenantId = resolveTenantForMutation(tenantIds, requestedTenantId);
        const rawParams: QueryParams = {
          runId: searchParams.get("runId") || undefined,
          runKind:
            (searchParams.get("runKind") as "recon_job" | "ingestion_run" | null) || undefined,
          status: (searchParams.get("status") as QueryParams["status"]) || undefined,
          severity: (searchParams.get("severity") as QueryParams["severity"]) || undefined,
          type: searchParams.get("type") || undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") || "50",
          offset: searchParams.get("offset") || "0",
        };

        const params = queryParamsSchema.parse(rawParams);

        const limit = Math.min(parseInt(params.limit, 10), 100);
        const offset = parseInt(params.offset, 10);

        const result = await listReconciliationWorkbenchExceptions(prisma, {
          tenantId,
          runId: params.runId,
          runKind: params.runKind ?? null,
          status: params.status,
          severity: params.severity,
          type: params.type,
          search: params.search,
          limit,
          offset,
        });

        if (result.kind === "not_found") {
          return NextResponse.json(
            {
              items: [],
              total: 0,
              error: "Run not found",
              trace_id: traceId,
            },
            { status: 404 }
          );
        }

        if (result.kind === "ambiguous_uuid_collision") {
          return NextResponse.json(
            {
              items: [],
              total: 0,
              error: "Ambiguous run identifier",
              code: "RUN_ID_COLLISION",
              recon_job_id: result.jobId,
              ingestion_run_id: result.ingestionRunId,
              trace_id: traceId,
            },
            { status: 409 }
          );
        }

        const items = result.data.items;
        const total = result.data.total;

        return NextResponse.json({
          items,
          data: items,
          total,
          limit,
          offset,
          trace_id: traceId,
        });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code, trace_id: traceId },
            { status: error.status }
          );
        }

        appLogger.error("[Exceptions API] Error fetching exceptions", error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Invalid request", details: error.issues, trace_id: traceId },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            items: [],
            total: 0,
            error: "Failed to fetch exceptions",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET Exceptions" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

// try catch
