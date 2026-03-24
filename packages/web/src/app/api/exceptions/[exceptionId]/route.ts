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
import {
  buildExceptionAuditTrail,
  buildExceptionDescription,
  buildExceptionReasonTags,
  buildExceptionStatusDetail,
  buildSuggestedActions,
  getExceptionWorkflowState,
} from "@/lib/exceptions/presentation";
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

        // Fetch exception - workspace scoped (DriftEvent = console "exception")
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
            driftMetrics: true,
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
        const driftMetricsObj = (exception.driftMetrics as Record<string, unknown>) || {};
        const status = getExceptionWorkflowState({
          acknowledged: exception.acknowledged,
          metadata,
        });
        const statusDetail = buildExceptionStatusDetail({
          driftType: exception.driftType,
          fieldPath: exception.fieldPath,
          expectedValue: exception.expectedValue,
          actualValue: exception.actualValue,
          metadata,
          createdAt: exception.createdAt,
          acknowledged: exception.acknowledged,
          acknowledgedBy: exception.acknowledgedBy,
          acknowledgedAt: exception.acknowledgedAt,
        });

        /**
         * DriftEvent.reconJobId is the UUID of the reconciliation run that produced this drift
         * (ReconciliationRun.id). It is not a batch/workflow job id; match review uses a separate
         * API and route model (ReconciliationMatch under /api/jobs/...).
         */
        let provenanceRun:
          | {
              id: string;
              name: string | null;
              status: string | null;
              createdAt: string | null;
              startedAt: string | null;
              completedAt: string | null;
              ingestionId: string | null;
              href: string;
              recordFound: boolean;
            }
          | null = null;

        if (exception.reconJobId) {
          const runRow = await prisma.reconciliationRun.findFirst({
            where: { id: exception.reconJobId, tenantId },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              startedAt: true,
              completedAt: true,
              ingestionId: true,
            },
          });

          if (runRow) {
            provenanceRun = {
              id: runRow.id,
              name: runRow.name ?? null,
              status: runRow.status ?? null,
              createdAt: runRow.createdAt.toISOString(),
              startedAt: runRow.startedAt.toISOString(),
              completedAt: runRow.completedAt?.toISOString() ?? null,
              ingestionId: runRow.ingestionId,
              href: `/console/runs/${runRow.id}`,
              recordFound: true,
            };
          } else {
            provenanceRun = {
              id: exception.reconJobId,
              name: null,
              status: null,
              createdAt: null,
              startedAt: null,
              completedAt: null,
              ingestionId: null,
              href: `/console/runs/${exception.reconJobId}`,
              recordFound: false,
            };
          }
        }
        const suggestedActions = buildSuggestedActions({
          driftType: exception.driftType,
          fieldPath: exception.fieldPath,
          status,
        });
        const resolution = (metadata.resolution as Record<string, unknown> | undefined) || {};
        const auditTrail = buildExceptionAuditTrail({
          driftType: exception.driftType,
          fieldPath: exception.fieldPath,
          expectedValue: exception.expectedValue,
          actualValue: exception.actualValue,
          metadata,
          createdAt: exception.createdAt,
          acknowledged: exception.acknowledged,
          acknowledgedBy: exception.acknowledgedBy,
          acknowledgedAt: exception.acknowledgedAt,
        }).map((entry) => ({
          ...entry,
          timestamp: entry.timestamp,
        }));

        // Build structured provenance block — aligned with admin API contract
        const provenance = {
          runId: exception.reconJobId || null,
          run: provenanceRun,
          fieldPath: exception.fieldPath || null,
          ruleId:
            (metadata.ruleId as string | undefined) ??
            (metadata.rule_id as string | undefined) ??
            null,
          detectorId:
            (metadata.detectorId as string | undefined) ??
            (metadata.detector_id as string | undefined) ??
            null,
          sourceAdapter:
            (metadata.sourceAdapter as string | undefined) ??
            (metadata.sourceSystem as string | undefined) ??
            null,
          targetAdapter:
            (metadata.targetAdapter as string | undefined) ??
            (metadata.targetSystem as string | undefined) ??
            null,
          sourceTransactionId: (metadata.sourceTransactionId as string | undefined) ?? null,
          targetTransactionId: (metadata.targetTransactionId as string | undefined) ?? null,
          ingestionId: (metadata.ingestionId as string | undefined) ?? null,
          matchReason:
            (metadata.matchReason as string | undefined) ??
            (driftMetricsObj.matchReason as string | undefined) ??
            null,
          confidenceScore:
            typeof driftMetricsObj.confidenceScore === "number"
              ? (driftMetricsObj.confidenceScore as number)
              : typeof metadata.confidenceScore === "number"
                ? (metadata.confidenceScore as number)
                : null,
          rationale_codes: Array.isArray(metadata.rationale_codes)
            ? (metadata.rationale_codes as unknown[]).filter(
                (c): c is string => typeof c === "string"
              )
            : null,
        };

        const result = {
          id: exception.id,
          type: exception.driftType || "unknown",
          status: status as "pending" | "investigating" | "resolved" | "ignored",
          severity: (exception.severity || "low") as "low" | "medium" | "high" | "critical",
          detectedAt: exception.createdAt,
          description: buildExceptionDescription({
            driftType: exception.driftType,
            fieldPath: exception.fieldPath,
            expectedValue: exception.expectedValue,
            actualValue: exception.actualValue,
          }),
          statusDetail,
          reasonTags: buildExceptionReasonTags({
            driftType: exception.driftType,
            fieldPath: exception.fieldPath,
            metadata,
          }),
          amount: metadata.amount as number | undefined,
          currency: metadata.currency as string | undefined,
          sourceTransactionId: provenance.sourceTransactionId ?? undefined,
          targetTransactionId: provenance.targetTransactionId ?? undefined,
          sourceSystem: provenance.sourceAdapter ?? undefined,
          targetSystem: provenance.targetAdapter ?? undefined,
          // Structured provenance block — all fields explicit, null when unavailable
          provenance,
          // Additional details
          runId: exception.reconJobId,
          expectedValue: exception.expectedValue,
          actualValue: exception.actualValue,
          fieldPath: exception.fieldPath,
          acknowledgedBy: exception.acknowledgedBy,
          acknowledgedAt: exception.acknowledgedAt?.toISOString() || null,
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt?.toISOString() || exception.createdAt.toISOString(),
          resolution:
            typeof resolution.notes === "string"
              ? resolution.notes
              : status === "ignored"
                ? "Ignored by operator"
                : status === "resolved"
                  ? "Resolved by operator"
                  : undefined,
          resolvedAt:
            status === "resolved" && typeof resolution.resolvedAt === "string"
              ? resolution.resolvedAt
              : undefined,
          ignoredAt:
            status === "ignored" && typeof resolution.ignoredAt === "string"
              ? resolution.ignoredAt
              : undefined,
          ignoredBy:
            status === "ignored" && typeof resolution.ignoredBy === "string"
              ? resolution.ignoredBy
              : undefined,
          confidenceScore: provenance.confidenceScore ?? undefined,
          suggestedActions,
          playbookApplied:
            typeof metadata.playbookApplied === "string"
              ? (metadata.playbookApplied as string)
              : undefined,
          auditTrail,
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

        const actionLabel =
          actionName === "ignore" ? "ignored" : actionName === "reopen" ? "reopened" : "resolved";

        return NextResponse.json({
          success: true,
          message: `Exception ${actionLabel} successfully`,
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
        resolution: null,
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
