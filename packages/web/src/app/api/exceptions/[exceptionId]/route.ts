/**
 * Canonical reconciliation exception detail + action route.
 *
 * GET  /api/exceptions/[exceptionId]
 * POST /api/exceptions/[exceptionId]?action=resolve|ignore|reopen
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { resolveExceptionProvenanceRun } from "@/lib/exceptions/resolve-exception-run-context";
import { getReconciliationWorkbenchExceptionDetail } from "@/lib/server/exceptions/reconciliation-workbench";
import { applyReconciliationWorkbenchAction } from "@/lib/server/exceptions/reconciliation-workbench-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const paramsSchema = z.object({
  exceptionId: z.string().uuid("Invalid exception ID format"),
});

const actionQuerySchema = z.object({
  action: z.enum(["resolve", "ignore", "reopen"]),
});

const exceptionActionSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(
      request: NextRequest,
      { params }: { params: Promise<{ exceptionId: string }> }
    ) {
      const traceId = await getTraceId(request);

      try {
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

        const detail = await getReconciliationWorkbenchExceptionDetail(
          prisma,
          tenantId,
          exceptionId
        );
        if (!detail) {
          return NextResponse.json(
            { error: "Exception not found", trace_id: traceId },
            { status: 404 }
          );
        }

        const provenanceRun = await resolveExceptionProvenanceRun(prisma, tenantId, detail.runId);
        const response = {
          id: detail.id,
          type: detail.type,
          status: detail.status,
          severity: detail.severity,
          detectedAt: detail.detectedAt,
          description: detail.description,
          statusDetail: detail.statusDetail,
          reasonTags: detail.reasonTags,
          amount: detail.amount,
          currency: detail.currency,
          sourceTransactionId: detail.sourceTransactionId,
          targetTransactionId: detail.targetTransactionId,
          sourceSystem: detail.sourceSystem ?? undefined,
          targetSystem: detail.targetSystem ?? undefined,
          provenance: {
            runId: detail.runId,
            run: provenanceRun,
            fieldPath: null,
            ruleId: null,
            detectorId: null,
            sourceAdapter: detail.sourceSystem ?? null,
            targetAdapter: detail.targetSystem ?? null,
            sourceTransactionId: detail.sourceTransactionId ?? null,
            targetTransactionId: detail.targetTransactionId ?? null,
            ingestionId:
              typeof detail.runMetadata?.ingestionId === "string"
                ? detail.runMetadata.ingestionId
                : (provenanceRun?.ingestionId ?? null),
            matchReason:
              typeof detail.runMetadata?.matchReason === "string"
                ? detail.runMetadata.matchReason
                : detail.description,
            confidenceScore: detail.confidenceScore,
            rationale_codes: detail.reasonTags ?? null,
          },
          runId: detail.runId,
          expectedValue: detail.expectedValue,
          actualValue: detail.actualValue,
          fieldPath: null,
          resolution: detail.resolution ?? undefined,
          resolvedAt: detail.resolvedAt ?? undefined,
          ignoredAt: detail.ignoredAt ?? undefined,
          ignoredBy: detail.ignoredBy ?? undefined,
          confidenceScore: detail.confidenceScore ?? undefined,
          suggestedActions: detail.suggestedActions,
          playbookApplied: detail.playbookApplied ?? undefined,
          auditTrail: detail.auditTrail,
          operatorSummary: detail.operatorSummary,
          familySummary: detail.familySummary,
          adjudicationMemories: detail.adjudicationMemories,
          evidenceSummary: detail.evidenceSummary,
          proofSummary: detail.proofSummary,
          similarCases: detail.similarCases,
          whyFlagged: detail.whyFlagged,
          trace_id: traceId,
        };

        return NextResponse.json({
          data: response,
          ...response,
          exception: response,
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

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(
      request: NextRequest,
      { params }: { params: Promise<{ exceptionId: string }> }
    ) {
      const traceId = await getTraceId(request);

      try {
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

        const parsedAction = actionQuerySchema.safeParse({
          action: request.nextUrl.searchParams.get("action"),
        });
        if (!parsedAction.success) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid action",
              details: parsedAction.error.issues,
              trace_id: traceId,
            },
            { status: 400 }
          );
        }

        const parsedBody = exceptionActionSchema.safeParse(await request.json().catch(() => ({})));
        if (!parsedBody.success) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid request body",
              details: parsedBody.error.issues,
              trace_id: traceId,
            },
            { status: 400 }
          );
        }

        const { tenantIds, userId } = await resolveTenantMembershipScope();
        const requestedTenantId =
          request.nextUrl.searchParams.get("workspace_id")?.trim() ||
          request.nextUrl.searchParams.get("tenant_id")?.trim() ||
          null;
        const tenantId = resolveTenantForMutation(tenantIds, requestedTenantId);

        const result = await applyReconciliationWorkbenchAction(prisma, {
          tenantId,
          userId,
          exceptionId: parsedParams.data.exceptionId,
          action: parsedAction.data.action,
          notes: parsedBody.data.notes,
        });

        return NextResponse.json(
          {
            success: result.success,
            message: result.message,
            data: result,
            trace_id: traceId,
          },
          { status: 200 }
        );
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { success: false, error: error.message, code: error.code, trace_id: traceId },
            { status: error.status }
          );
        }

        const status =
          typeof (error as { status?: unknown })?.status === "number"
            ? (error as { status: number }).status
            : 500;
        if (status === 404) {
          return NextResponse.json(
            { success: false, error: "Exception not found", trace_id: traceId },
            { status: 404 }
          );
        }

        appLogger.error("[Exception Detail API] Error mutating exception", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to update exception",
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
