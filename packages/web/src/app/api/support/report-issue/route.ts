/**
 * POST /api/support/report-issue — legacy path; persists via canonical support intake (Prisma audit_logs).
 *
 * Canonical owner: POST /api/v1/support/intake.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { buildSupportIntakeRunContext } from "@settler/reconciliation-core";
import { submitSupportIntake, SUPPORT_ISSUE_CATEGORY } from "@settler/support-intake";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(20).max(5000),
  category: z.string().optional(),
  run_id: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const { userId, tenantId } = await requireTenantRequestContext(request);
        const raw = await request.json();
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return NextResponse.json(
            {
              error:
                "subject (title) and description are required; description must be at least 20 characters",
              code: "INVALID_REPORT_ISSUE",
              details: parsed.error.flatten(),
            },
            { status: 400 }
          );
        }

        const { subject, description, category, run_id, context } = parsed.data;
        const routeFromContext =
          context && typeof context === "object" && typeof context.route === "string"
            ? context.route
            : undefined;

        const categoryMap: Record<
          string,
          (typeof SUPPORT_ISSUE_CATEGORY)[keyof typeof SUPPORT_ISSUE_CATEGORY]
        > = {
          technical: SUPPORT_ISSUE_CATEGORY.DOCS_OTHER,
          billing: SUPPORT_ISSUE_CATEGORY.BILLING_USAGE,
          feature_request: SUPPORT_ISSUE_CATEGORY.DOCS_OTHER,
          bug: SUPPORT_ISSUE_CATEGORY.RUN_FAILURE,
          other: SUPPORT_ISSUE_CATEGORY.DOCS_OTHER,
        };

        const canonicalCategory =
          category && category in categoryMap
            ? categoryMap[category]!
            : SUPPORT_ISSUE_CATEGORY.DOCS_OTHER;

        const fullDescription = `${subject.trim()}\n\n${description.trim()}`;

        const stored = await submitSupportIntake({
          prisma,
          userId,
          tenantId,
          path: request.nextUrl.pathname,
          body: {
            category: canonicalCategory,
            description: fullDescription,
            run_id,
            route: routeFromContext,
            module: category ?? undefined,
          },
          resolveRunContext: (tid, rid) => buildSupportIntakeRunContext(prisma, tid, rid),
        });

        return NextResponse.json({
          accepted: true,
          submission_id: stored.submissionId,
          tenant_id: stored.tenantId,
          created_at: stored.createdAt,
          deprecated_route: true,
          canonical_route: "/api/v1/support/intake",
          trust_state: "degraded",
          degraded_reason_code: "legacy_report_issue_route_translated",
        });
      } catch (error) {
        return buildTenantContextErrorResponse(error);
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 20 }, requireAuth: true }
);
