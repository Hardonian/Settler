/**
 * Exception Detail API Route (Workspace-scoped)
 *
 * GET /api/exceptions/[exceptionId] - Get a single exception by ID
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

// Route params schema
const paramsSchema = z.object({
  exceptionId: z.string().uuid("Invalid exception ID format"),
});

/**
 * GET /api/exceptions/[exceptionId] - Get a single exception by ID
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(
      request: NextRequest,
      { params }: { params: Promise<{ exceptionId: string }> }
    ) {
      const traceId = await getTraceId(request);

      try {
        // Validate route params
        const parsedParams = paramsSchema.safeParse(await params);
        if (!parsedParams.success) {
          return NextResponse.json(
            {
              error: "Invalid exception ID",
              details: parsedParams.error.issues,
              trace_id: traceId,
            },
            { status: 400 }
          );
        }

        const { exceptionId } = parsedParams.data;

        // Authenticate and get workspace context
        const auth = await requireAuth(request);
        const tenantId = auth.tenantId;

        if (!tenantId) {
          return NextResponse.json(
            { error: "No workspace found", trace_id: traceId },
            { status: 401 }
          );
        }

        // Fetch exception - workspace scoped
        const exception = await prisma.driftEvent.findFirst({
          where: {
            id: exceptionId,
            tenantId,
          },
          select: {
            id: true,
            tenantId: true,
            driftType: true,
            severity: true,
            acknowledged: true,
            acknowledgedBy: true,
            acknowledgedAt: true,
            createdAt: true,
            updatedAt: true,
            reconJobId: true,
            fieldPath: true,
            expectedValue: true,
            actualValue: true,
            metadata: true,
          },
        });

        if (!exception) {
          return NextResponse.json(
            { error: "Exception not found", trace_id: traceId },
            { status: 404 }
          );
        }

        // Transform to frontend format
        const status = exception.acknowledged ? "resolved" : "pending";

        const result = {
          id: exception.id,
          type: exception.driftType || "unknown",
          status: status as "pending" | "investigating" | "resolved" | "ignored",
          severity: (exception.severity || "low") as "low" | "medium" | "high" | "critical",
          detectedAt: exception.createdAt,
          description: exception.fieldPath
            ? `Field mismatch: ${exception.fieldPath}`
            : "Drift detected",
          amount: (exception.metadata as Record<string, unknown>)?.amount as number | undefined,
          currency: (exception.metadata as Record<string, unknown>)?.currency as string | undefined,
          sourceTransactionId: (exception.metadata as Record<string, unknown>)
            ?.sourceTransactionId as string | undefined,
          targetTransactionId: (exception.metadata as Record<string, unknown>)
            ?.targetTransactionId as string | undefined,
          // Additional details
          runId: exception.reconJobId,
          expectedValue: exception.expectedValue,
          actualValue: exception.actualValue,
          fieldPath: exception.fieldPath,
          acknowledgedBy: exception.acknowledgedBy,
          acknowledgedAt: exception.acknowledgedAt?.toISOString() || null,
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt?.toISOString() || exception.createdAt.toISOString(),
        };

        return NextResponse.json({
          exception: result,
          trace_id: traceId,
        });
      } catch (error) {
        appLogger.error("[Exception Detail API] Error fetching exception", error);

        // Never return 500 - return graceful error response
        return NextResponse.json(
          {
            exception: null,
            error: "Failed to fetch exception",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET Exception Detail" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
