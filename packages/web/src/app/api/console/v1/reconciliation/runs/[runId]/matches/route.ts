import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prismaClient";
import { requireConsoleTenantContext } from "@/lib/server/console-tenant";
import { TenantMembershipError } from "@/lib/supabase/tenant-membership";
import {
  capabilitiesForRunKind,
  resolveReconciliationRunForTenant,
} from "@settler/reconciliation-core";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
      try {
        const { tenantId } = await requireConsoleTenantContext(request);
        const { runId } = await context.params;

        const resolution = await resolveReconciliationRunForTenant(prisma, tenantId, runId);

        if (resolution.kind === "ambiguous_uuid_collision") {
          return NextResponse.json(
            {
              type: "https://docs.settler.dev/problems/reconciliation_uuid_collision",
              title: "UUID collision",
              status: 409,
              detail:
                "The same UUID exists as both a recon job and an ingestion-scoped reconciliation run.",
              code: "RECONCILIATION_UUID_COLLISION",
            },
            { status: 409, headers: { "Content-Type": "application/problem+json" } }
          );
        }

        if (resolution.kind === "not_found") {
          return NextResponse.json(
            { error: "Not Found", message: "Reconciliation run not found" },
            { status: 404 }
          );
        }

        const runKind =
          resolution.kind === "recon_job"
            ? "recon_job"
            : resolution.kind === "ingestion_run"
              ? "ingestion_run"
              : null;

        if (!runKind) {
          return NextResponse.json(
            { error: "Not Found", message: "Reconciliation run not found" },
            { status: 404 }
          );
        }

        const caps = capabilitiesForRunKind(runKind);
        if (!caps.matches) {
          return NextResponse.json(
            {
              type: "https://docs.settler.dev/problems/reconciliation_wrong_run_kind",
              title: "Wrong run kind",
              status: 409,
              detail: "Matches are only available for ingestion reconciliation runs.",
              code: "RECONCILIATION_WRONG_RUN_KIND",
            },
            { status: 409, headers: { "Content-Type": "application/problem+json" } }
          );
        }

        const limitRaw = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
        const offsetRaw = parseInt(request.nextUrl.searchParams.get("offset") || "0", 10);
        const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
        const matchType = request.nextUrl.searchParams.get("matchType") ?? undefined;
        const reviewedParam = request.nextUrl.searchParams.get("reviewed");

        const where: {
          runId: string;
          tenantId: string;
          matchType?: string;
          reviewed?: boolean;
        } = {
          runId,
          tenantId,
          ...(matchType ? { matchType } : {}),
          ...(reviewedParam !== null && reviewedParam !== undefined && reviewedParam !== ""
            ? { reviewed: reviewedParam === "true" }
            : {}),
        };

        const [rows, total] = await Promise.all([
          prisma.reconciliationMatch.findMany({
            where,
            include: { sourceTransaction: true },
            orderBy: [{ confidence: "desc" }, { sourceTransaction: { date: "desc" } }],
            take: limit,
            skip: offset,
          }),
          prisma.reconciliationMatch.count({ where }),
        ]);

        const targetIds = Array.from(
          new Set(
            rows
              .map((m: (typeof rows)[number]) => m.targetTransactionId)
              .filter((id: string | null): id is string => Boolean(id))
          )
        );
        const targets =
          targetIds.length > 0
            ? await prisma.normalizedTransaction.findMany({
                where: { id: { in: targetIds }, tenantId },
              })
            : [];
        type TargetTx = (typeof targets)[number];
        const targetById = new Map<string, TargetTx>(targets.map((t: TargetTx) => [t.id, t]));

        const matches = rows.map((m: (typeof rows)[number]) => {
          const targetTx = m.targetTransactionId
            ? targetById.get(m.targetTransactionId)
            : undefined;
          return {
            id: m.id,
            matchType: m.matchType,
            confidence: Number(m.confidence),
            matchReason: m.matchReason,
            amountDiff: m.amountDiff !== null ? Number(m.amountDiff) : null,
            dateDiff: m.dateDiff,
            reviewed: m.reviewed,
            reviewedAt: m.reviewedAt,
            source: {
              id: m.sourceTransaction.id,
              amount: Number(m.sourceTransaction.amount),
              currency: m.sourceTransaction.currency,
              date: m.sourceTransaction.date,
              description: m.sourceTransaction.description,
              externalId: m.sourceTransaction.externalId,
            },
            target: targetTx
              ? {
                  id: targetTx.id,
                  amount: Number(targetTx.amount),
                  currency: targetTx.currency,
                  date: targetTx.date,
                  description: targetTx.description,
                  externalId: targetTx.externalId,
                }
              : null,
          };
        });

        return NextResponse.json({
          contract_version: 1,
          run_kind: "ingestion_run",
          matches,
          pagination: { limit, offset, total },
        });
      } catch (err) {
        if (err instanceof TenantMembershipError) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
        }
        appLogger.error("Console reconciliation matches failed", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 120 }, requireAuth: true }
);
