/**
 * Exception Detail API Route (Workspace-scoped)
 *
 * GET /api/exceptions/[exceptionId] - Get a single exception by ID
 * POST /api/exceptions/[exceptionId] - Handle exception actions via query param (?action=resolve|ignore|reopen)
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Route params schema
const paramsSchema = z.object({
  exceptionId: z.string().uuid("Invalid exception ID format"),
});

// Action query param schema
const actionQuerySchema = z.object({
  action: z.enum(["resolve", "ignore", "reopen"]),
});

// Request body schema for exception actions
const ExceptionActionSchema = z.object({
  notes: z.string().optional(),
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

        const { tenantIds } = await resolveTenantMembershipScope();
        const requestedTenantId =
          request.nextUrl.searchParams.get("workspace_id")?.trim() ||
          request.nextUrl.searchParams.get("tenant_id")?.trim() ||
          null;
        const tenantId = resolveTenantForMutation(tenantIds, requestedTenantId);

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
        const metadata = (exception.metadata as Record<string, unknown>) || {};
        const resolution = metadata.resolution as Record<string, unknown> | undefined;
        const resolutionStatus = typeof resolution?.status === "string" ? resolution.status : null;
        const status =
          resolutionStatus === "ignored"
            ? "ignored"
            : exception.acknowledged
              ? "resolved"
              : "pending";

        const result = {
          id: exception.id,
          type: exception.driftType || "unknown",
          status: status as "pending" | "investigating" | "resolved" | "ignored",
          severity: (exception.severity || "low") as "low" | "medium" | "high" | "critical",
          detectedAt: exception.createdAt,
          description: exception.fieldPath
            ? `Field mismatch: ${exception.fieldPath}`
            : "Drift detected",
          amount: metadata.amount as number | undefined,
          currency: metadata.currency as string | undefined,
          sourceTransactionId: metadata.sourceTransactionId as string | undefined,
          targetTransactionId: metadata.targetTransactionId as string | undefined,
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
          ...result,
          exception: result,
          trace_id: traceId,
        });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code, trace_id: traceId },
            { status: error.status }
          );
        }

        appLogger.error("[Exception Detail API] Error fetching exception", error);

        return NextResponse.json(
          {
            exception: null,
            error: "Failed to fetch exception",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET Exception Detail" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

/**
 * POST /api/exceptions/[exceptionId] - Handle exception actions
 * Accepts action via query param: ?action=resolve|ignore|reopen
 */
export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(
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
              success: false,
              error: "Invalid exception ID",
              details: parsedParams.error.issues,
              trace_id: traceId,
            },
            { status: 400 }
          );
        }

        const { exceptionId } = parsedParams.data;

        // Get action from query param
        const action = request.nextUrl.searchParams.get("action");
        const parsedAction = actionQuerySchema.safeParse({ action });
        if (!parsedAction.success) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid action. Use ?action=resolve|ignore|reopen",
              trace_id: traceId,
            },
            { status: 400 }
          );
        }

        const actionName = parsedAction.data.action;

        const scope = await resolveTenantMembershipScope();
        const requestedTenantId =
          request.nextUrl.searchParams.get("workspace_id")?.trim() ||
          request.nextUrl.searchParams.get("tenant_id")?.trim() ||
          null;
        const tenantId = resolveTenantForMutation(scope.tenantIds, requestedTenantId);
        const userId = scope.userId;

        // Parse optional notes from body
        let notes: string | undefined;
        try {
          const body = await request.json();
          const parsed = ExceptionActionSchema.safeParse(body);
          if (parsed.success) {
            notes = parsed.data.notes;
          }
        } catch {
          // Ignore parse errors for body - notes are optional
        }

        // Execute the appropriate action
        let result: { success: boolean; error?: string };

        switch (actionName) {
          case "resolve":
            result = await handleResolve(exceptionId, tenantId, userId, notes);
            break;
          case "ignore":
            result = await handleIgnore(exceptionId, tenantId, userId, notes);
            break;
          case "reopen":
            result = await handleReopen(exceptionId, tenantId, userId, notes);
            break;
          default:
            result = { success: false, error: "Unknown action" };
        }

        if (!result.success) {
          const status = result.error === "Exception not found" ? 404 : 422;
          return NextResponse.json(
            {
              success: false,
              error: result.error || `Failed to ${actionName} exception`,
              trace_id: traceId,
            },
            { status }
          );
        }

        appLogger.info(`[Exception API] Exception ${actionName}ed`, {
          exceptionId,
          tenantId,
          userId,
          action: actionName,
        });

        return NextResponse.json({
          success: true,
          message: `Exception ${actionName}ed successfully`,
          trace_id: traceId,
        });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: error.code,
              trace_id: traceId,
            },
            { status: error.status }
          );
        }

        appLogger.error("[Exception API] Error performing exception action", error);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to perform exception action",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 500 }
        );
      }
    },
    { feature: "POST Exception Action" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 50 }, requireAuth: true }
);

// Action handlers
async function handleResolve(
  exceptionId: string,
  tenantId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const exception = await prisma.driftEvent.findFirst({
    where: { id: exceptionId, tenantId },
  });

  if (!exception) {
    return { success: false, error: "Exception not found" };
  }

  await prisma.driftEvent.update({
    where: { id: exceptionId },
    data: {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      metadata: {
        ...((exception.metadata as Record<string, unknown>) || {}),
        resolution: {
          status: "resolved",
          resolvedBy: userId,
          resolvedAt: new Date().toISOString(),
          notes,
        },
      },
    },
  });

  return { success: true };
}

async function handleIgnore(
  exceptionId: string,
  tenantId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const exception = await prisma.driftEvent.findFirst({
    where: { id: exceptionId, tenantId },
  });

  if (!exception) {
    return { success: false, error: "Exception not found" };
  }

  await prisma.driftEvent.update({
    where: { id: exceptionId },
    data: {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      metadata: {
        ...((exception.metadata as Record<string, unknown>) || {}),
        resolution: {
          status: "ignored",
          ignoredBy: userId,
          ignoredAt: new Date().toISOString(),
          notes,
        },
      },
    },
  });

  return { success: true };
}

async function handleReopen(
  exceptionId: string,
  tenantId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const exception = await prisma.driftEvent.findFirst({
    where: { id: exceptionId, tenantId },
  });

  if (!exception) {
    return { success: false, error: "Exception not found" };
  }

  // Reopen the exception - reset acknowledgment
  await prisma.driftEvent.update({
    where: { id: exceptionId },
    data: {
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      metadata: {
        ...((exception.metadata as Record<string, unknown>) || {}),
        reopen: {
          reopenedBy: userId,
          reopenedAt: new Date().toISOString(),
          notes,
        },
      },
    },
  });

  return { success: true };
}
