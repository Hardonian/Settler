/**
 * Operator support inbox — lists canonical support intake records from Prisma audit_logs.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth-gate";
import { prisma } from "@/shared/db/prismaClient";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_INTAKE_RESOURCE_TYPE,
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

type IntakeChanges = {
  submission_id?: string;
  category?: string;
  run_id?: string | null;
  exception_id?: string | null;
  route?: string | null;
  module?: string | null;
  description?: string;
  operator_triage_priority?: string | null;
  path?: string;
  run_context?: Record<string, unknown> | null;
  exception_context?: Record<string, unknown> | null;
};

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: Request) {
      const adminCheck = await requireAdmin(request as never);
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

        const tickets = rows.map((row) => {
          const c = (row.changes ?? {}) as IntakeChanges;
          const category = (c.category ?? "docs_other") as SupportIssueCategory;
          const label = SUPPORT_CATEGORY_LABELS[category] ?? category;
          const desc = typeof c.description === "string" ? c.description : "";
          const preview = desc.length > 120 ? `${desc.slice(0, 117)}…` : desc;
          const runCtx = c.run_context;
          const exceptionCtx = c.exception_context;
          const runState =
            runCtx && typeof runCtx === "object" && "state" in runCtx ? String(runCtx.state) : null;
          const exceptionState =
            exceptionCtx && typeof exceptionCtx === "object" && "state" in exceptionCtx
              ? String(exceptionCtx.state)
              : null;
          const familySummary =
            exceptionCtx &&
            typeof exceptionCtx === "object" &&
            "familySummary" in exceptionCtx &&
            exceptionCtx.familySummary &&
            typeof exceptionCtx.familySummary === "object"
              ? (exceptionCtx.familySummary as Record<string, unknown>)
              : null;
          const operatorSummary =
            exceptionCtx &&
            typeof exceptionCtx === "object" &&
            "operatorSummary" in exceptionCtx &&
            exceptionCtx.operatorSummary &&
            typeof exceptionCtx.operatorSummary === "object"
              ? (exceptionCtx.operatorSummary as Record<string, unknown>)
              : null;

          return {
            id: row.id,
            submissionId: c.submission_id ?? row.id,
            ticketNumber: c.submission_id ? c.submission_id.slice(0, 8) : row.id.slice(0, 8),
            tenantId: row.tenantId,
            userId: row.userId,
            category,
            categoryLabel: label,
            operatorTriagePriority: c.operator_triage_priority ?? "medium",
            route: c.route ?? null,
            module: c.module ?? null,
            runId: c.run_id ?? null,
            runContextState: runState,
            exceptionId: c.exception_id ?? null,
            exceptionContextState: exceptionState,
            familyLabel:
              (typeof familySummary?.familyLabel === "string" && familySummary.familyLabel) ||
              (typeof operatorSummary?.familyLabel === "string" && operatorSummary.familyLabel) ||
              null,
            familyState:
              (typeof familySummary?.state === "string" && familySummary.state) ||
              (typeof operatorSummary?.familyState === "string" && operatorSummary.familyState) ||
              null,
            descriptionPreview: preview,
            fullDescription: desc,
            createdAt: row.createdAt.toISOString(),
            sourcePath: typeof c.path === "string" ? c.path : null,
          };
        });

        return NextResponse.json({ tickets, source: "support_intake_audit_logs" });
      } catch (error) {
        appLogger.error("Failed to fetch support intake inbox", error);
        return NextResponse.json(
          {
            tickets: [],
            source: "support_intake_audit_logs",
            error: "Unable to fetch support intake records",
            degraded: true,
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 100 }, requireAuth: true }
);
