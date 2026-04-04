/**
 * Legacy compatibility route.
 *
 * Canonical owner is POST /api/v1/support/intake.
 * This route translates old report-issue payloads into canonical support intake.
 */

import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";
import { authenticateRequest } from "@/lib/api/unified-auth";
import { submitSupportIntake } from "@/lib/services/support-intake-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (!auth?.userId || !auth.tenantId) {
      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
          message: "Authentication and tenant context are required.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      subject?: string;
      description?: string;
      category?: string;
      context?: { route?: string; module?: string };
    };

    const description = [body.subject?.trim(), body.description?.trim()].filter(Boolean).join("\n\n");
    if (description.length < 20) {
      return NextResponse.json(
        {
          code: "INVALID_SUPPORT_INTAKE",
          message: "Description must be at least 20 characters when routed through report-issue.",
        },
        { status: 400 }
      );
    }

    const stored = await submitSupportIntake({
      userId: auth.userId,
      tenantId: auth.tenantId,
      path: request.nextUrl.pathname,
      body: {
        tenant_id: auth.tenantId,
        category: body.category ?? "docs_other",
        description,
        route: body.context?.route ?? "/console/report-issue",
        module: body.context?.module ?? "legacy_report_issue_route",
      },
    });

    return NextResponse.json(
      {
        accepted: true,
        submission_id: stored.submissionId,
        tenant_id: stored.tenantId,
        created_at: stored.createdAt,
        deprecated_route: true,
        canonical_route: "/api/v1/support/intake",
        trust_state: "degraded",
        degraded_reason_code: "legacy_report_issue_route_translated",
      },
      { status: 202 }
    );
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);
