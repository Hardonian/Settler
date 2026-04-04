/**
 * POST /api/v1/support/intake
 *
 * Canonical support intake for the console: persists audit + operator runtime signal
 * and embeds tenant-scoped run intelligence when run_id is provided.
 *
 * ROUTE_CLASS: session-service
 */

import { NextRequest, NextResponse } from "next/server";
import {
  supportIntakeSubmissionSchema,
  SUPPORT_ISSUE_CATEGORY_LABELS,
} from "@settler/types";
import { authenticateRequest } from "@/lib/api/unified-auth";
import { withSecurity } from "@/lib/middleware/api-security";
import { getCorrelationId, addCorrelationHeaders } from "@/lib/monitoring/correlation";
import { submitSupportIntake } from "@/lib/services/support-intake-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = supportIntakeSubmissionSchema.omit({ tenant_id: true });

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const correlationId = await getCorrelationId();
    const auth = await authenticateRequest(request);
    if (!auth?.userId) {
      const res = NextResponse.json(
        {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
          correlation_id: correlationId,
        },
        { status: 401 }
      );
      return addCorrelationHeaders(res, correlationId);
    }

    if (!auth.tenantId) {
      const res = NextResponse.json(
        {
          code: "TENANT_CONTEXT_REQUIRED",
          message:
            "No tenant scope on this session. Open Settings or complete workspace setup so support intake can be attributed to a single tenant.",
          correlation_id: correlationId,
        },
        { status: 403 }
      );
      return addCorrelationHeaders(res, correlationId);
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
      const stored = await submitSupportIntake({
        userId: auth.userId,
        tenantId: auth.tenantId,
        path: request.nextUrl.pathname,
        body: { ...parsed.data, tenant_id: auth.tenantId },
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
  { rateLimit: { windowMs: 60_000, maxRequests: 10 }, requireAuth: false }
);
