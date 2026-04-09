/**
 * POST /api/v1/support/intake
 *
 * Canonical tenant-scoped support intake (Next BFF): Prisma audit + operator runtime signal
 * via @settler/support-intake, with run and exception intelligence when identifiers are provided.
 *
 * ROUTE_CLASS: session-service
 */

import { NextRequest, NextResponse } from "next/server";
import { supportIntakeSubmissionSchema, SUPPORT_ISSUE_CATEGORY_LABELS } from "@settler/types";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import {
  buildSupportIntakeExceptionContext,
  buildSupportIntakeRunContext,
} from "@settler/reconciliation-core";
import { submitSupportIntake } from "@settler/support-intake";
import { getCorrelationId, addCorrelationHeaders } from "@/lib/monitoring/correlation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = supportIntakeSubmissionSchema.omit({ tenant_id: true });

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      const correlationId = await getCorrelationId();

      let userId: string;
      let tenantId: string;
      try {
        const ctx = await requireTenantRequestContext(request);
        userId = ctx.userId;
        tenantId = ctx.tenantId;
      } catch (error) {
        return addCorrelationHeaders(buildTenantContextErrorResponse(error), correlationId);
      }

      let json: unknown;
      try {
        json = await request.json();
      } catch {
        const res = NextResponse.json(
          {
            code: "INVALID_JSON",
            message: "Request body must be JSON.",
            correlation_id: correlationId,
          },
          { status: 400 }
        );
        return addCorrelationHeaders(res, correlationId);
      }

      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        const res = NextResponse.json(
          {
            code: "INVALID_SUPPORT_INTAKE",
            message: "Support intake request is invalid.",
            issues: parsed.error.flatten(),
            categories: SUPPORT_ISSUE_CATEGORY_LABELS,
            correlation_id: correlationId,
          },
          { status: 400 }
        );
        return addCorrelationHeaders(res, correlationId);
      }

      try {
        const intakePrisma = prisma as unknown as Parameters<
          typeof submitSupportIntake
        >[0]["prisma"];
        const stored = await submitSupportIntake({
          prisma: intakePrisma,
          userId,
          tenantId,
          path: request.nextUrl.pathname,
          body: { ...parsed.data, tenant_id: tenantId },
          resolveRunContext: (tid, runId) => buildSupportIntakeRunContext(prisma, tid, runId),
          resolveExceptionContext: (tid, exceptionId) =>
            buildSupportIntakeExceptionContext(prisma, tid, exceptionId),
        });

        const res = NextResponse.json(
          {
            accepted: true,
            submission_id: stored.submissionId,
            tenant_id: stored.tenantId,
            created_at: stored.createdAt,
            correlation_id: correlationId,
          },
          { status: 202 }
        );
        return addCorrelationHeaders(res, correlationId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Support intake failed";
        const res = NextResponse.json(
          {
            code: "SUPPORT_INTAKE_FAILED",
            message,
            correlation_id: correlationId,
            retryable: true,
          },
          { status: 503 }
        );
        return addCorrelationHeaders(res, correlationId);
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);
