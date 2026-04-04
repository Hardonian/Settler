/**
 * Console support — POST forwards to canonical intake; GET lists operator inbox (same rows as /api/support/tickets).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth-gate";
import { requireActiveSubscription } from "@/lib/security/billing-enforcement";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { buildSupportIntakeRunContext } from "@settler/reconciliation-core";
import {
  submitSupportIntake,
  SUPPORT_ISSUE_CATEGORY,
  SUPPORT_INTAKE_RESOURCE_TYPE,
  SUPPORT_CATEGORY_LABELS,
  type SupportIssueCategory,
} from "@settler/support-intake";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SupportInboxAuditRow = {
  id: string;
  tenantId: string | null;
  userId: string | null;
  createdAt: Date;
  changes: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
};

const postBodySchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum(["technical", "billing", "feature_request", "bug", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type IntakeChanges = {
  submission_id?: string;
  category?: string;
  description?: string;
  operator_triage_priority?: string | null;
  run_id?: string | null;
  route?: string | null;
  module?: string | null;
  path?: string;
  run_context?: Record<string, unknown> | null;
};

function mapRowsToInboxItems(rows: SupportInboxAuditRow[]) {
  return rows.map((row) => {
    const c = (row.changes ?? {}) as IntakeChanges;
    const category = (c.category ?? "docs_other") as SupportIssueCategory;
    const label = SUPPORT_CATEGORY_LABELS[category] ?? category;
    const desc = typeof c.description === "string" ? c.description : "";
    const firstLine = desc.split("\n")[0] ?? "";
    const preview = firstLine.length > 100 ? `${firstLine.slice(0, 97)}…` : firstLine;
    const runCtx = c.run_context;
    const runState =
      runCtx && typeof runCtx === "object" && "state" in runCtx ? String(runCtx.state) : null;

    return {
      id: row.id,
      submissionId: c.submission_id ?? row.id,
      ticketNumber: c.submission_id ? c.submission_id.slice(0, 8) : row.id.slice(0, 8),
      tenantId: row.tenantId,
      userId: row.userId,
      subject: preview || "(no subject)",
      category: label,
      categoryKey: category,
      priority: c.operator_triage_priority ?? "medium",
      status: "submitted" as const,
      createdAt: row.createdAt.toISOString(),
      runId: c.run_id ?? null,
      runContextState: runState,
      route: c.route ?? null,
      module: c.module ?? null,
      categoryLabel: label,
      operatorTriagePriority: c.operator_triage_priority ?? "medium",
      descriptionPreview: desc.length > 120 ? `${desc.slice(0, 117)}…` : desc,
      fullDescription: desc,
      sourcePath: typeof c.path === "string" ? c.path : null,
    };
  });
}

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const subscriptionCheck = await requireActiveSubscription(request);
    if (!subscriptionCheck.allowed) {
      return (
        subscriptionCheck.error ||
        NextResponse.json(
          {
            error: "Subscription Required",
            message: "This feature requires an active subscription",
          },
          { status: 403 }
        )
      );
    }

    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return adminCheck.error!;
    }

    try {
      const rows: SupportInboxAuditRow[] = await prisma.auditLog.findMany({
        where: { resourceType: SUPPORT_INTAKE_RESOURCE_TYPE },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          createdAt: true,
          changes: true,
          metadata: true,
        },
      });

      const items = mapRowsToInboxItems(rows);

      return NextResponse.json({
        items,
        tickets: items,
        count: items.length,
        source: "support_intake_audit_logs",
      });
    } catch {
      return NextResponse.json(
        {
          items: [],
          tickets: [],
          count: 0,
          source: "support_intake_audit_logs",
          degraded: true,
          error: "Support inbox temporarily unavailable",
        },
        { status: 503 }
      );
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const subscriptionCheck = await requireActiveSubscription(request);
    if (!subscriptionCheck.allowed) {
      return (
        subscriptionCheck.error ||
        NextResponse.json(
          {
            error: "Subscription Required",
            message: "This feature requires an active subscription",
          },
          { status: 403 }
        )
      );
    }

    try {
      const { userId, tenantId } = await requireTenantRequestContext(request);
      const raw = await request.json();
      const parsed = postBodySchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid request",
            code: "INVALID_CONSOLE_SUPPORT",
            details: parsed.error.flatten(),
          },
          { status: 400 }
        );
      }

      const { subject, description, category, priority } = parsed.data;
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

      const stored = await submitSupportIntake({
        prisma,
        userId,
        tenantId,
        path: request.nextUrl.pathname,
        body: {
          category: categoryMap[category],
          description: `${subject.trim()}\n\n${description.trim()}`,
          operator_triage_priority: priority,
          module: category,
        },
        resolveRunContext: (tid, runId) => buildSupportIntakeRunContext(prisma, tid, runId),
      });

      return NextResponse.json(
        {
          accepted: true,
          submission_id: stored.submissionId,
          tenant_id: stored.tenantId,
          created_at: stored.createdAt,
        },
        { status: 202 }
      );
    } catch (error) {
      return buildTenantContextErrorResponse(error);
    }
  },
  { rateLimit: { windowMs: 60_000, maxRequests: 30 }, requireAuth: true }
);
