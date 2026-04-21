/**
 * Maps {@link CanonicalReconciliationListItem} rows to the legacy console/API run list
 * projection (same shape historically returned by GET /api/runs for recon_jobs).
 */

import type { CanonicalReconciliationListItem } from "./canonical-reconciliation.js";
import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";
import {
  buildRunProvenanceProjection,
  buildRunSummaryProjection,
  buildRunSummarySemanticsProjection,
  legacyAdapterDriftLabel,
} from "./run-surface-shaping.js";
import {
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  MergedRunsCursorError,
  type MergedRunsCursorV1,
} from "./merged-list-pagination.js";
import {
  fetchMergedReconciliationRunsPage,
  type ReconciliationRunKindFilter,
} from "./merged-runs-query.js";

export type ApiRunsListLegacyItem = {
  runKind: "recon_job" | "ingestion_run";
  sourceModel: "recon_jobs" | "reconciliation_runs";
  id: string;
  detailHref: string;
  name: string;
  status: string;
  statusLabel: string;
  startedAt: string;
  completedAt: string | null;
  summary: {
    total: number;
    sourceCount: number;
    targetCount: number;
    matched: number;
    unmatched: number;
    unmatchedSourceCount: number;
    unmatchedTargetCount: number;
    conflicts: number;
  };
  summarySemantics: {
    processed: number;
    matchedWithTolerance: number;
    exceptioned: number;
    unresolved: number;
    ignored: number;
    resolved: number;
  };
  summaryState: string;
  progress: number;
  progressState: string;
  isTerminal: boolean;
  provenance: Record<string, unknown>;
  configDrift: {
    status: "none" | "detected" | "indeterminate";
    adapter: "source" | "target" | "both" | "none";
  };
  /** Ingestion-scoped execution id when runKind === ingestion_run */
  ingestionId: string | null;
  sourceAdapter: string | null;
  targetAdapter: string | null;
};

export type ApiRunsLegacyListFilters = {
  status?: string;
  search?: string;
};

export type ApiRunsLegacyPageScanInput = {
  prisma: ReconciliationCorePrismaClient;
  tenantId: string;
  page: number;
  limit: number;
  filters?: ApiRunsLegacyListFilters;
  batchSize?: number;
  runKind?: ReconciliationRunKindFilter;
  fetchPage?: typeof fetchMergedReconciliationRunsPage;
  decodeCursor?: typeof decodeMergedRunsCursor;
  mapRow?: typeof mapCanonicalListItemToApiRunsLegacyRow;
};

export type ApiRunsLegacyPageScanResult = {
  data: ApiRunsListLegacyItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    search?: string;
  };
  pagesScanned: number;
};

function matchesStatusFilter(statusFilter: string | undefined, status: string): boolean {
  if (!statusFilter) return true;
  return status.toLowerCase() === statusFilter;
}

function matchesSearchFilter(searchFilter: string | undefined, id: string, name: string): boolean {
  if (!searchFilter) return true;
  const haystack = `${id} ${name}`.toLowerCase();
  return haystack.includes(searchFilter);
}

export function mapCanonicalListItemToApiRunsLegacyRow(
  r: CanonicalReconciliationListItem
): ApiRunsListLegacyItem {
  const startedAt = r.timestamps.startedAt ?? r.timestamps.createdAt ?? new Date().toISOString();
  const completedAt = r.timestamps.completedAt;
  return {
    runKind: r.runKind,
    sourceModel: r.provenance.sourceModel,
    id: r.id,
    detailHref: `/console/runs/${r.id}`,
    name: r.name,
    status: r.lifecycle.status,
    statusLabel: r.lifecycle.statusLabel,
    startedAt,
    completedAt,
    summary: buildRunSummaryProjection(r.summary),
    summarySemantics: buildRunSummarySemanticsProjection(r.summary),
    summaryState: r.summaryState,
    progress: r.lifecycle.progressPercent,
    progressState: r.lifecycle.progressState,
    isTerminal: r.lifecycle.isTerminal,
    provenance: buildRunProvenanceProjection(r, startedAt, completedAt),
    configDrift: {
      status: r.configDrift.status,
      adapter: legacyAdapterDriftLabel(r.configDrift.adapter),
    },
    ingestionId: r.provenance.ingestionId,
    sourceAdapter: r.adapters.sourceAdapter,
    targetAdapter: r.adapters.targetAdapter,
  };
}

/**
 * Scans the canonical merged run list into the historical `/api/runs` page/limit envelope.
 * This keeps legacy filtering, counting, and page-offset behavior aligned across callers.
 */
export async function scanMergedRunsForLegacyPage(
  input: ApiRunsLegacyPageScanInput
): Promise<ApiRunsLegacyPageScanResult> {
  const {
    prisma,
    tenantId,
    page,
    limit,
    filters,
    batchSize = 100,
    runKind = "all",
    fetchPage = fetchMergedReconciliationRunsPage,
    decodeCursor = decodeMergedRunsCursor,
    mapRow = mapCanonicalListItemToApiRunsLegacyRow,
  } = input;

  const normalizedStatus = filters?.status?.trim().toLowerCase() || undefined;
  const normalizedSearch = filters?.search?.trim().toLowerCase() || undefined;
  const offset = (page - 1) * limit;
  const data: ApiRunsListLegacyItem[] = [];
  let total = 0;
  let pagesScanned = 0;
  let cursorState: MergedRunsCursorV1 | null = null;

  while (true) {
    const mergedPage = await fetchPage({
      prisma,
      tenantId,
      limit: batchSize,
      cursorState,
      runKind,
      encodeCursor: encodeMergedRunsCursor,
    });
    pagesScanned += 1;

    for (const row of mergedPage.runs) {
      const legacy = mapRow(row);
      if (!matchesStatusFilter(normalizedStatus, legacy.status)) continue;
      if (!matchesSearchFilter(normalizedSearch, legacy.id, legacy.name)) continue;

      if (total >= offset && data.length < limit) {
        data.push(legacy);
      }
      total += 1;
    }

    if (!mergedPage.next_cursor) {
      break;
    }

    try {
      cursorState = decodeCursor(mergedPage.next_cursor);
    } catch (error) {
      throw new MergedRunsCursorError(
        error instanceof Error ? error.message : "cursor decode failed"
      );
    }
  }

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: {
      status: normalizedStatus,
      search: normalizedSearch,
    },
    pagesScanned,
  };
}
