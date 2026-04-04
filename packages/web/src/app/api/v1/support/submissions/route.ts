/**
 * GET /api/v1/support/submissions
 *
 * Operator/admin query for canonical support submissions from AuditLog.
 * Replaces legacy /api/support/tickets.
 *
 * ROUTE_CLASS: session-service
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/unified-auth";
import { withSecurity } from "@/lib/middleware/api-security";
import { getCorrelationId, addCorrelationHeaders } from "@/lib/monitoring/correlation";
import {
  querySupportSubmissions,
  updateSupportSubmissionStatus,
} from "@/lib/services/support-query-service";
import type { SupportStatus, SupportSeverity } from "@settler/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  async function GET(request: NextRequest) {
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

    const url = request.nextUrl;
    const tenantId = url.searchParams.get("tenant_id") ?? undefined;
    const status = url.searchParams.get("status") as SupportStatus | undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

    try {
      const submissions = await querySupportSubmissions({
        tenantId,
        status: status ?? undefined,
        category,
        limit,
      });

      const res = NextResponse.json(
        { submissions, total: submissions.length, correlation_id: correlationId },
        { status: 200 }
      );
      return addCorrelationHeaders(res, correlationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to query support submissions";
      const res = NextResponse.json(
        { code: "SUPPORT_QUERY_FAILED", message, correlation_id: correlationId },
        { status: 503 }
      );
      return addCorrelationHeaders(res, correlationId);
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 60 }, requireAuth: false }
);

export const PATCH = withSecurity(
  async function PATCH(request: NextRequest) {
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

    let json: Record<string, unknown>;
    try {
      json = (await request.json()) as Record<string, unknown>;
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

    const submissionId = typeof json.submission_id === "string" ? json.submission_id : null;
    if (!submissionId) {
      const res = NextResponse.json(
        {
          code: "MISSING_SUBMISSION_ID",
          message: "submission_id is required.",
          correlation_id: correlationId,
        },
        { status: 400 }
      );
      return addCorrelationHeaders(res, correlationId);
    }

    try {
      const updated = await updateSupportSubmissionStatus(submissionId, {
        status: (json.status as SupportStatus) ?? undefined,
        severity: (json.severity as SupportSeverity) ?? undefined,
        operatorNotes: typeof json.operator_notes === "string" ? json.operator_notes : undefined,
      });

      if (!updated) {
        const res = NextResponse.json(
          { code: "NOT_FOUND", message: "Submission not found.", correlation_id: correlationId },
          { status: 404 }
        );
        return addCorrelationHeaders(res, correlationId);
      }

      const res = NextResponse.json(
        { updated: true, submission_id: submissionId, correlation_id: correlationId },
        { status: 200 }
      );
      return addCorrelationHeaders(res, correlationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update support submission";
      const res = NextResponse.json(
        { code: "SUPPORT_UPDATE_FAILED", message, correlation_id: correlationId },
        { status: 503 }
      );
      return addCorrelationHeaders(res, correlationId);
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: false }
);
