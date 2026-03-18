/**
 * Exceptions API Routes (Workspace-scoped)
 *
 * GET /api/exceptions - List exceptions for the current workspace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { getTraceId } from "@/lib/observability/trace";
import { requireAuth } from "@/lib/api/unified-auth";
import { withSecurity } from "@/lib/middleware/api-security";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Query parameters schema
const queryParamsSchema = z.object({
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
        // Authenticate and get workspace context
        const auth = await requireAuth(request);
        const tenantId = auth.tenantId;

        if (!tenantId) {
          return NextResponse.json(
            { error: "No workspace found", trace_id: traceId },
            { status: 401 }
          );
        }

        // Parse and validate query params
        const { searchParams } = new URL(request.url);
        const rawParams: QueryParams = {
          status: (searchParams.get("status") as QueryParams["status"]) || undefined,
          severity: (searchParams.get("severity") as QueryParams["severity"]) || undefined,
          type: searchParams.get("type") || undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") || "50",
          offset: searchParams.get("offset") || "0",
        };

        const params = queryParamsSchema.parse(rawParams);

        // Build where clause - workspace scoped
        const whereClause: {
          tenantId: string;
          severity?: string;
          driftType?: string;
          acknowledged?: boolean;
          OR?: Array<{
            fieldPath?: { contains: string; mode: "insensitive" };
            expectedValue?: { contains: string; mode: "insensitive" };
            actualValue?: { contains: string; mode: "insensitive" };
          }>;
        } = { tenantId };

        if (params.severity) {
          whereClause.severity = params.severity;
        }

        if (params.type) {
          whereClause.driftType = params.type;
        }

        // Map status to acknowledged
        if (params.status) {
          whereClause.acknowledged = params.status === "resolved" || params.status === "ignored";
        }

        // Search in fieldPath, expectedValue, actualValue
        if (params.search) {
          whereClause.OR = [
            { fieldPath: { contains: params.search, mode: "insensitive" } },
            { expectedValue: { contains: params.search, mode: "insensitive" } },
            { actualValue: { contains: params.search, mode: "insensitive" } },
          ];
        }

        const limit = Math.min(parseInt(params.limit, 10), 100);
        const offset = parseInt(params.offset, 10);

        // Fetch exceptions (using DriftEvent as exception model)
        const [exceptions, total] = await Promise.all([
          prisma.driftEvent.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
            select: {
              id: true,
              tenantId: true,
              driftType: true,
              severity: true,
              acknowledged: true,
              acknowledgedBy: true,
              acknowledgedAt: true,
              createdAt: true,
              reconJobId: true,
              fieldPath: true,
              expectedValue: true,
              actualValue: true,
              metadata: true,
            },
          }),
          prisma.driftEvent.count({ where: whereClause }),
        ]);

        // Transform to frontend format
        const items = exceptions.map((ex) => {
          const status = ex.acknowledged ? "resolved" : "pending";

          return {
            id: ex.id,
            type: ex.driftType || "unknown",
            status: status as "pending" | "investigating" | "resolved" | "ignored",
            severity: (ex.severity || "low") as "low" | "medium" | "high" | "critical",
            detectedAt: ex.createdAt,
            description: ex.fieldPath ? `Field mismatch: ${ex.fieldPath}` : "Drift detected",
            amount: (ex.metadata as Record<string, unknown>)?.amount as number | undefined,
            currency: (ex.metadata as Record<string, unknown>)?.currency as string | undefined,
            sourceTransactionId: (ex.metadata as Record<string, unknown>)?.sourceTransactionId as
              | string
              | undefined,
            targetTransactionId: (ex.metadata as Record<string, unknown>)?.targetTransactionId as
              | string
              | undefined,
          };
        });

        return NextResponse.json({
          items,
          total,
          limit,
          offset,
          trace_id: traceId,
        });
      } catch (error) {
        appLogger.error("[Exceptions API] Error fetching exceptions", error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Invalid request", details: error.issues, trace_id: traceId },
            { status: 400 }
          );
        }

        // Never return 500 - return graceful error response
        return NextResponse.json(
          {
            items: [],
            total: 0,
            error: "Failed to fetch exceptions",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET Exceptions" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
