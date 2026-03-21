/**
 * Reconciliation API Route
 *
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, UnifiedAuthContext } from "@/lib/api/unified-auth";
import { triggerInternalReconciliationRun } from "@/lib/server/internal-api";
import {
  getReconciliationSummary,
  listReconciliationItems,
} from "@/lib/server/settler/reconciliation";
import {
  assertTenantMembership,
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import type { CanonicalReconciliationListItem } from "@settler/reconciliation-core";
import {
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage,
  MergedRunsCursorError,
} from "@settler/reconciliation-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const RunReconciliationSchema = z.object({
  sourceId: z.string().min(1),
  targetAdapter: z.string().optional(),
  amountTolerance: z.number().min(0).optional(),
  dateWindowDays: z.number().min(0).optional(),
  fuzzyDescriptionThreshold: z.number().min(0).max(1).optional(),
  requireExactAmount: z.boolean().optional(),
  rules: z
    .array(
      z.object({
        field: z.string(),
        tolerance: z.number().optional(),
        window: z.string().optional(),
      })
    )
    .optional(),
});

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const authContext: UnifiedAuthContext = await requireAuth(request);
        const { userId, tenantIds } = await resolveTenantMembershipScope();

        // Get tenant ID
        let tenantId: string;
        if (authContext.tenantId) {
          assertTenantMembership(tenantIds, authContext.tenantId);
          tenantId = authContext.tenantId;
        } else {
          tenantId = resolveTenantForMutation(tenantIds);
        }

        // Parse and validate body
        const body = await request.json();
        const params = RunReconciliationSchema.parse(body);

        const normalizedConfig: Record<string, unknown> = {};
        if (typeof params.amountTolerance === "number") {
          normalizedConfig.amountTolerance = params.amountTolerance;
        }
        if (typeof params.dateWindowDays === "number") {
          normalizedConfig.dateWindowDays = params.dateWindowDays;
        }
        if (typeof params.fuzzyDescriptionThreshold === "number") {
          normalizedConfig.fuzzyDescriptionThreshold = params.fuzzyDescriptionThreshold;
        }
        if (typeof params.requireExactAmount === "boolean") {
          normalizedConfig.requireExactAmount = params.requireExactAmount;
        }

        // Backward compatibility for callers still sending tolerance/window in rules[] payload.
        if (Array.isArray(params.rules) && params.rules.length > 0) {
          const amountRule = params.rules.find(
            (rule) =>
              rule.field.toLowerCase().includes("amount") && typeof rule.tolerance === "number"
          );
          if (
            amountRule &&
            typeof normalizedConfig.amountTolerance !== "number" &&
            typeof amountRule.tolerance === "number"
          ) {
            normalizedConfig.amountTolerance = amountRule.tolerance;
          }

          const dateRule = params.rules.find(
            (rule) =>
              rule.field.toLowerCase().includes("date") &&
              typeof rule.tolerance === "number" &&
              Number.isFinite(rule.tolerance)
          );
          if (
            dateRule &&
            typeof normalizedConfig.dateWindowDays !== "number" &&
            typeof dateRule.tolerance === "number"
          ) {
            normalizedConfig.dateWindowDays = dateRule.tolerance;
          }
        }

        // Run reconciliation via the authoritative internal API
        const result = await triggerInternalReconciliationRun(tenantId, userId, {
          ingestionId: params.sourceId,
          config: normalizedConfig,
        });

        if (!result || !result.runId) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create reconciliation",
              message: "Please try again later or contact support if the issue persists",
            },
            { status: 500 } // Use a 500 status for a failed internal process
          );
        }

        return NextResponse.json({ runId: result.runId }, { status: 202 }); // 202 Accepted is more appropriate for an async job start
      } catch (error) {
        // Return typed error, not 500
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Invalid request", details: error.issues },
            { status: 400 }
          );
        }

        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }

        appLogger.error("[Reconciliation API] Error", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to run reconciliation",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 500 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      try {
        // Authenticate
        const authContext = await requireAuth(request);
        const { tenantIds } = await resolveTenantMembershipScope();
        let tenantId: string;
        if (authContext.tenantId) {
          assertTenantMembership(tenantIds, authContext.tenantId);
          tenantId = authContext.tenantId;
        } else {
          tenantId = resolveTenantForMutation(tenantIds);
        }

        // Get reconciliation ID from query params
        const reconciliationId = request.nextUrl.searchParams.get("id");

        if (reconciliationId) {
          // Get specific reconciliation summary
          const summary = await getReconciliationSummary(tenantId, reconciliationId);

          if (!summary) {
            return NextResponse.json({ error: "Reconciliation not found" }, { status: 404 });
          }

          // Get items
          const items = await listReconciliationItems(tenantId, reconciliationId);
          const enrichedSummary =
            items.length > 0 ? { ...summary, highestRiskItem: items[0] } : summary;

          return NextResponse.json({
            reconciliation: enrichedSummary,
            items,
          });
        }

        const cursorParam = request.nextUrl.searchParams.get("cursor") ?? undefined;
        const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 50), 500);
        const runKindRaw = request.nextUrl.searchParams.get("run_kind") ?? "recon_job";
        const runKind =
          runKindRaw === "all" || runKindRaw === "recon_job" || runKindRaw === "ingestion_run"
            ? runKindRaw
            : "recon_job";

        let cursorState = null;
        if (cursorParam) {
          try {
            cursorState = decodeMergedRunsCursor(cursorParam);
          } catch (e) {
            return NextResponse.json(
              {
                error: "Invalid cursor",
                code: "RECONCILIATION_CURSOR_INVALID",
                detail: e instanceof MergedRunsCursorError ? e.message : "Invalid cursor",
              },
              { status: 400 }
            );
          }
        }

        const page = await fetchMergedReconciliationRunsPage({
          prisma,
          tenantId,
          limit,
          cursorState,
          runKind,
          encodeCursor: encodeMergedRunsCursor,
        });

        const toLegacyReconciliation = (r: CanonicalReconciliationListItem) => ({
          id: r.id,
          name: r.name,
          status: r.lifecycle.status,
          sourceAdapter: r.adapters.sourceAdapter ?? "",
          targetAdapter: r.adapters.targetAdapter ?? "",
          createdAt: r.timestamps.createdAt,
          updatedAt: r.timestamps.updatedAt,
          latestResult: r.reconResultId
            ? {
                id: r.reconResultId,
                status: r.lifecycle.status,
                startedAt: r.timestamps.startedAt ?? r.timestamps.createdAt,
                completedAt: r.timestamps.completedAt,
                counts: {
                  source: r.summary.sourceCount,
                  target: r.summary.targetCount,
                  matched: r.summary.matched,
                  unmatchedSource: r.summary.unmatchedSourceCount,
                  unmatchedTarget: r.summary.unmatchedTargetCount,
                  conflicts: r.summary.conflicts,
                },
                errorMessage: null,
              }
            : null,
        });

        const reconciliations =
          runKind === "ingestion_run"
            ? []
            : page.runs.filter((r) => r.runKind === "recon_job").map(toLegacyReconciliation);

        const body: Record<string, unknown> = {
          contract_version: 1,
          next_cursor: page.next_cursor,
          pagination: page.pagination,
          response_meta: {
            ...page.response_meta,
            default_run_kind: "recon_job",
            requested_run_kind: runKind,
          },
        };

        if (runKind === "all") {
          body.runs = page.runs;
        }

        body.reconciliations = reconciliations;

        return NextResponse.json(body, { status: 200 });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }
        appLogger.error("[Reconciliation API] Error", error);
        return NextResponse.json(
          {
            error: "Failed to load reconciliations",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
