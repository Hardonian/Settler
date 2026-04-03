/**
 * List reconciliation runs (merged canonical view)
 *
 * GET /api/runs
 *
 * Returns recon_jobs-backed runs and ingestion-backed reconciliation_runs in one list,
 * using the same merge + cursor semantics as reconciliation-core.
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";
import { requireAuth, type UnifiedAuthContext } from "@/lib/api/unified-auth";
import {
  assertTenantMembership,
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";
import { prisma } from "@/shared/db/prismaClient";
import {
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage,
  mapCanonicalListItemToApiRunsLegacyRow,
  MergedRunsCursorError,
  buildRunProofpackIndexByRunId,
  toRunCompactProofSummary,
  type MergedRunsCursorV1,
} from "@settler/reconciliation-core";
import {
  parseRunKindParam,
  parseRunsLimit,
  RUN_KIND_VALUES,
} from "@/lib/reconciliation/runs-query-params";

export const runtime = "nodejs";

type RunListItemWithSignals = ReturnType<typeof mapCanonicalListItemToApiRunsLegacyRow> & {
  compactProofSummary?: ReturnType<typeof toRunCompactProofSummary>;
};

function resolveTenantIdForRuns(
  authContext: UnifiedAuthContext,
  tenantIds: string[],
  tenantIdParam: string | null
): string {
  if (tenantIdParam) {
    assertTenantMembership(tenantIds, tenantIdParam);
    return tenantIdParam;
  }
  if (authContext.tenantId) {
    assertTenantMembership(tenantIds, authContext.tenantId);
    return authContext.tenantId;
  }
  return resolveTenantForMutation(tenantIds);
}

function matchesStatusFilter(statusFilter: string | undefined, status: string): boolean {
  if (!statusFilter) return true;
  return status.toLowerCase() === statusFilter;
}

function matchesSearchFilter(searchFilter: string | undefined, id: string, name: string): boolean {
  if (!searchFilter) return true;
  const haystack = `${id} ${name}`.toLowerCase();
  return haystack.includes(searchFilter);
}

const MAX_FILTER_SCAN_PAGES = 30;

async function withRunCompactProofSignals(
  tenantId: string,
  rows: import("@settler/reconciliation-core").CanonicalReconciliationListItem[]
): Promise<RunListItemWithSignals[]> {
  const indexByRun = await buildRunProofpackIndexByRunId({ prisma, tenantId, runs: rows });
  return rows.map((row) => {
    const legacy = mapCanonicalListItemToApiRunsLegacyRow(row);
    const index = indexByRun.get(row.id);
    return {
      ...legacy,
      compactProofSummary: index ? toRunCompactProofSummary(index) : undefined,
    };
  });
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const logger = createLogger({});

      try {
        const authContext = await requireAuth(request);
        const { tenantIds } = await resolveTenantMembershipScope();

        const { searchParams } = new URL(request.url);
        const tenantIdParam = searchParams.get("tenant_id") ?? searchParams.get("workspace_id");
        const tenantId = resolveTenantIdForRuns(authContext, tenantIds, tenantIdParam);

        const statusFilter = searchParams.get("status")?.trim().toLowerCase() || undefined;
        const searchFilter = searchParams.get("search")?.trim().toLowerCase() || undefined;
        const runKind = parseRunKindParam(
          searchParams.get("run_kind") ?? searchParams.get("runKind")
        );

        if (runKind === "__invalid__") {
          return NextResponse.json(
            {
              error: "Invalid run_kind",
              code: "RUNS_INVALID_RUN_KIND",
              detail: `run_kind must be one of: ${RUN_KIND_VALUES.join(", ")}`,
            },
            { status: 400 }
          );
        }

        const limit = parseRunsLimit(searchParams.get("limit"));
        const cursorParam = searchParams.get("cursor")?.trim() || undefined;
        const legacyPage = searchParams.get("page");

        let cursorState: MergedRunsCursorV1 | null = null;
        if (cursorParam) {
          try {
            cursorState = decodeMergedRunsCursor(cursorParam);
          } catch (e) {
            logger.warn("[GET /api/runs] invalid cursor", {
              code: "RUNS_CURSOR_INVALID",
              detail: e instanceof MergedRunsCursorError ? e.message : "Invalid cursor",
            });
            return NextResponse.json(
              {
                error: "Invalid cursor",
                code: "RUNS_CURSOR_INVALID",
                detail: e instanceof MergedRunsCursorError ? e.message : "Invalid cursor",
              },
              { status: 400 }
            );
          }
        }

        const filterActive = Boolean(statusFilter || searchFilter);

        if (!filterActive) {
          const page = await fetchMergedReconciliationRunsPage({
            prisma,
            tenantId,
            limit,
            cursorState,
            runKind,
            encodeCursor: encodeMergedRunsCursor,
          });

          const items = await withRunCompactProofSignals(tenantId, page.runs);

          return NextResponse.json({
            items,
            next_cursor: page.next_cursor,
            pagination: page.pagination,
            response_meta: {
              ...page.response_meta,
              contract_version: 1,
              api: "GET /api/runs",
              tenant_id: tenantId,
              requested_run_kind: runKind,
              filters_applied: {
                status: statusFilter ?? null,
                search: searchFilter ?? null,
              },
              pagination_mode: "merged_cursor",
              legacy_page_param_ignored: legacyPage ? true : false,
            },
          });
        }

        if (cursorParam) {
          return NextResponse.json(
            {
              error: "Cursor pagination is not supported together with status or search filters",
              code: "RUNS_CURSOR_WITH_FILTERS_UNSUPPORTED",
              detail:
                "Remove the cursor parameter or clear status/search to use keyset pagination; filtered mode returns the first page only.",
            },
            { status: 400 }
          );
        }

        let walkCursor: MergedRunsCursorV1 | null = null;
        const collected: import("@settler/reconciliation-core").CanonicalReconciliationListItem[] =
          [];
        let pagesScanned = 0;
        let lastPagePagination = null as
          | Awaited<ReturnType<typeof fetchMergedReconciliationRunsPage>>["pagination"]
          | null;
        let truncated = false;

        while (collected.length < limit && pagesScanned < MAX_FILTER_SCAN_PAGES) {
          const page = await fetchMergedReconciliationRunsPage({
            prisma,
            tenantId,
            limit,
            cursorState: walkCursor,
            runKind,
            encodeCursor: encodeMergedRunsCursor,
          });
          pagesScanned += 1;
          lastPagePagination = page.pagination;

          for (const row of page.runs) {
            const legacy = mapCanonicalListItemToApiRunsLegacyRow(row);
            if (!matchesStatusFilter(statusFilter, legacy.status)) continue;
            if (!matchesSearchFilter(searchFilter, legacy.id, legacy.name)) continue;
            collected.push(row);
            if (collected.length >= limit) break;
          }

          if (!page.next_cursor) {
            break;
          }
          try {
            walkCursor = decodeMergedRunsCursor(page.next_cursor);
          } catch {
            truncated = true;
            break;
          }
          if (collected.length >= limit) {
            truncated = Boolean(page.next_cursor);
            break;
          }
        }

        if (pagesScanned >= MAX_FILTER_SCAN_PAGES && lastPagePagination?.has_more) {
          truncated = true;
        }

        const items = await withRunCompactProofSignals(tenantId, collected.slice(0, limit));

        return NextResponse.json({
          items,
          next_cursor: null,
          pagination: {
            limit,
            returned: items.length,
            has_more: false,
            job_stream_has_more: lastPagePagination?.job_stream_has_more ?? false,
            ingestion_stream_has_more: lastPagePagination?.ingestion_stream_has_more ?? false,
            job_stream_exhausted: lastPagePagination?.job_stream_exhausted ?? true,
            ingestion_stream_exhausted: lastPagePagination?.ingestion_stream_exhausted ?? true,
            filter_scan_pages: pagesScanned,
            filter_truncation_possible: truncated,
          },
          response_meta: {
            contract_version: 1,
            included_run_kinds:
              runKind === "all"
                ? (["recon_job", "ingestion_run"] as const)
                : runKind === "recon_job"
                  ? (["recon_job"] as const)
                  : (["ingestion_run"] as const),
            ordering:
              "merged: recon_jobs.created_at DESC,id DESC + reconciliation_runs GREATEST(started_at,created_at) DESC,id DESC; filtered mode scans pages until enough matches",
            consistency: "read_committed",
            api: "GET /api/runs",
            tenant_id: tenantId,
            requested_run_kind: runKind,
            filters_applied: {
              status: statusFilter ?? null,
              search: searchFilter ?? null,
            },
            pagination_mode: "filter_scan_first_page",
            legacy_page_param_ignored: legacyPage ? true : false,
          },
        });
      } catch (error) {
        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
          );
        }
        logger.error("Error fetching runs", error as Error);
        return NextResponse.json(
          {
            error: "Internal server error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred. Please try again.",
            retryable: true,
          },
          { status: 500 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
