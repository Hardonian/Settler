/**
 * Cross-Run Reconciliation Intelligence Service
 *
 * Aggregates accumulated adjudication memory, exception family recurrence,
 * and run quality history across multiple runs into a canonical intelligence
 * summary for the Reconciliation Intelligence Timeline surface.
 *
 * This is a read-only service. It NEVER modifies state. All queries are
 * tenant-scoped through the tenantIds parameter — never trust user input
 * as a direct filter without verifying it appears in the validated tenantIds set.
 *
 * Canonical owner: reconciliation-core
 * Primary surface: /app/console/intelligence
 * Secondary surfaces: support payloads, proofpack exports
 */

import type { ReconciliationCorePrismaClient } from "./prisma-client-like.js";

// ─────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────

export type IntelligenceState = "available" | "building" | "unavailable";

export interface RunTimelineEntry {
  runId: string;
  jobId: string;
  jobName: string;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  /** Ratio of matched to total processed. Null if total is zero. */
  matchRate: number | null;
  matchedCount: number;
  unmatchedTotal: number;
  conflictCount: number;
  confidenceAvg: number | null;
  totalRecords: number;
}

export interface RecurringExceptionFamily {
  archetypeId: string | null;
  archetypeCode: string | null;
  archetypeLabel: string | null;
  archetypeCategory: string | null;
  /** Fallback display key when no archetype is linked */
  resolutionKey: string;
  totalOccurrences: number;
  resolvedCount: number;
  unresolvedCount: number;
  avgDurationMs: number | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  topOutcome: string | null;
  trend: "strengthening" | "weakening" | "stable";
  certainty: "high" | "medium" | "low";
  score: number;
}

export interface AdjudicationDecisionRecord {
  memoryId: string;
  exceptionId: string;
  archetypeLabel: string | null;
  archetypeCode: string | null;
  resolution: string;
  resolutionReason: string | null;
  outcome: string | null;
  adjudicatorType: string;
  adjudicationType: string;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CrossRunIntelligenceSummary {
  state: IntelligenceState;
  generatedAt: string;

  runTimeline: {
    state: "available" | "insufficient_history" | "unavailable";
    totalCompletedRuns: number;
    runs: RunTimelineEntry[];
    /** Direction of match rate over the window */
    overallTrend: "improving" | "stable" | "regressing" | "volatile" | "unavailable";
    reasonCodes: string[];
  };

  recurringFamilies: {
    state: "available" | "building" | "unavailable";
    totalAdjudications: number;
    families: RecurringExceptionFamily[];
    reasonCodes: string[];
  };

  decisionMemory: {
    state: "available" | "empty" | "unavailable";
    totalDecisions: number;
    recentDecisions: AdjudicationDecisionRecord[];
    reasonCodes: string[];
  };
}

// ─────────────────────────────────────────────
// INTERNAL TYPES (Prisma row shapes)
// ─────────────────────────────────────────────

interface ReconResultRow {
  id: string;
  reconJobId: string;
  tenantId: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  matchedCount: number;
  unmatchedSourceCount: number;
  unmatchedTargetCount: number;
  conflictCount: number;
  confidenceAvg: unknown; // Prisma Decimal — convert via Number()
  sourceCount: number;
  targetCount: number;
}

interface ReconJobRow {
  id: string;
  name: string;
  tenantId: string;
}

interface AdjudicationMemoryRow {
  id: string;
  exceptionId: string;
  archetypeId: string | null;
  tenantId: string;
  resolution: string;
  resolutionReason: string | null;
  outcome: string | null;
  adjudicatorType: string;
  adjudicationType: string;
  durationMs: bigint | null;
  createdAt: Date;
  completedAt: Date | null;
}

interface ArchetypeRow {
  id: string;
  code: string;
  label: string;
  category: string;
  typicalResolution: string | null;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function safeNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIso(d: Date | null | undefined): string | null {
  return d instanceof Date ? d.toISOString() : null;
}

/**
 * Compute the overall trend for a sequence of match-rate values.
 * Splits the window in half and compares averages. If std-dev is high
 * relative to mean, classifies as volatile.
 */
function computeOverallTrend(
  matchRates: (number | null)[]
): CrossRunIntelligenceSummary["runTimeline"]["overallTrend"] {
  const valid = matchRates.filter((r): r is number => r !== null && Number.isFinite(r));
  if (valid.length < 3) return "unavailable";

  // Array is ordered newest-first; reverse to get chronological
  const chrono = [...valid].reverse();
  const mid = Math.floor(chrono.length / 2);
  const older = chrono.slice(0, mid);
  const newer = chrono.slice(mid);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdev = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = avg(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  };

  const olderAvg = avg(older);
  const newerAvg = avg(newer);
  const delta = newerAvg - olderAvg;

  // Global volatility (mixed signals across the whole window)
  const mean = avg(chrono);
  const variance = chrono.reduce((s, v) => s + (v - mean) ** 2, 0) / chrono.length;
  const stdDev = Math.sqrt(variance);

  // Two-phase shift: both halves stable but means diverge → trend, not "volatile"
  const halfStable = stdev(older) <= 0.06 && stdev(newer) <= 0.06;
  if (halfStable) {
    if (delta > 0.03) return "improving";
    if (delta < -0.03) return "regressing";
    return "stable";
  }

  if (stdDev > 0.12) return "volatile";
  if (delta > 0.03) return "improving";
  if (delta < -0.03) return "regressing";
  return "stable";
}

/**
 * Score a recurring exception family for ranking.
 * Weighted toward unresolved volume and recency.
 */
function scoreFamilyStats(stats: {
  totalOccurrences: number;
  unresolvedCount: number;
  resolvedCount: number;
}): number {
  return stats.totalOccurrences * 3 + stats.unresolvedCount * 4 + stats.resolvedCount;
}

function familyTrend(stats: {
  unresolvedCount: number;
  resolvedCount: number;
  lastSeenAt: Date | null;
}): RecurringExceptionFamily["trend"] {
  if (stats.unresolvedCount > stats.resolvedCount) return "strengthening";
  if (stats.resolvedCount > 0 && stats.unresolvedCount === 0) return "weakening";
  return "stable";
}

function familyCertainty(
  totalOccurrences: number,
  unresolvedCount: number,
  resolvedCount: number
): RecurringExceptionFamily["certainty"] {
  if (totalOccurrences >= 5) return "high";
  // Strong signal: repeated unresolved dominates — still actionable with fewer samples
  if (totalOccurrences >= 3 && unresolvedCount > resolvedCount) return "high";
  if (totalOccurrences >= 2) return "medium";
  return "low";
}

// ─────────────────────────────────────────────
// PANEL 1 — RUN QUALITY TIMELINE
// ─────────────────────────────────────────────

async function buildRunTimeline(
  prisma: ReconciliationCorePrismaClient,
  tenantIds: string[]
): Promise<CrossRunIntelligenceSummary["runTimeline"]> {
  if (tenantIds.length === 0) {
    return {
      state: "unavailable",
      totalCompletedRuns: 0,
      runs: [],
      overallTrend: "unavailable",
      reasonCodes: ["no_tenant_scope"],
    };
  }

  let results: ReconResultRow[] = [];
  let queryFailed = false;

  try {
    results = (await prisma.reconResult.findMany({
      where: {
        tenantId: { in: tenantIds },
        status: { in: ["completed", "failed"] },
      },
      orderBy: { startedAt: "desc" },
      take: 30,
      select: {
        id: true,
        reconJobId: true,
        tenantId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        matchedCount: true,
        unmatchedSourceCount: true,
        unmatchedTargetCount: true,
        conflictCount: true,
        confidenceAvg: true,
        sourceCount: true,
        targetCount: true,
      },
    })) as ReconResultRow[];
  } catch {
    queryFailed = true;
  }

  if (queryFailed) {
    return {
      state: "unavailable",
      totalCompletedRuns: 0,
      runs: [],
      overallTrend: "unavailable",
      reasonCodes: ["run_history_query_failed"],
    };
  }

  if (results.length === 0) {
    return {
      state: "insufficient_history",
      totalCompletedRuns: 0,
      runs: [],
      overallTrend: "unavailable",
      reasonCodes: ["no_completed_runs"],
    };
  }

  // Fetch job names for enrichment
  const jobIds = Array.from(new Set(results.map((r) => r.reconJobId)));
  let jobs: ReconJobRow[] = [];

  try {
    jobs = (await prisma.reconJob.findMany({
      where: { id: { in: jobIds }, tenantId: { in: tenantIds } },
      select: { id: true, name: true, tenantId: true },
    })) as ReconJobRow[];
  } catch {
    // Non-fatal — we can render without job names
  }

  const jobMap = new Map(jobs.map((j) => [j.id, j.name]));

  const completedResults = results.filter((r) => r.status === "completed");

  const entries: RunTimelineEntry[] = results.map((r) => {
    const unmatchedTotal = safeNumber(r.unmatchedSourceCount) + safeNumber(r.unmatchedTargetCount);
    const total = safeNumber(r.matchedCount) + unmatchedTotal;
    const matchRate = total > 0 ? safeNumber(r.matchedCount) / total : null;

    return {
      runId: r.id,
      jobId: r.reconJobId,
      jobName: jobMap.get(r.reconJobId) ?? r.reconJobId,
      startedAt: toIso(r.startedAt),
      completedAt: toIso(r.completedAt),
      status: r.status,
      matchRate: matchRate !== null ? Math.round(matchRate * 10000) / 10000 : null,
      matchedCount: safeNumber(r.matchedCount),
      unmatchedTotal,
      conflictCount: safeNumber(r.conflictCount),
      confidenceAvg: safeNumberOrNull(r.confidenceAvg),
      totalRecords: total,
    };
  });

  const matchRates = entries.map((e) => e.matchRate);
  const overallTrend = computeOverallTrend(matchRates);

  return {
    state: completedResults.length >= 3 ? "available" : "insufficient_history",
    totalCompletedRuns: completedResults.length,
    runs: entries,
    overallTrend,
    reasonCodes:
      completedResults.length < 3
        ? ["history_too_thin"]
        : overallTrend === "volatile"
          ? ["mixed_direction_signals"]
          : [],
  };
}

type AdjudicationLoad = { kind: "failed" } | { kind: "ok"; rows: AdjudicationMemoryRow[] };

async function loadAdjudicationHistory(
  prisma: ReconciliationCorePrismaClient,
  tenantIds: string[]
): Promise<AdjudicationLoad> {
  try {
    const rows = (await prisma.exceptionAdjudicationMemory.findMany({
      where: { tenantId: { in: tenantIds } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        exceptionId: true,
        archetypeId: true,
        tenantId: true,
        resolution: true,
        resolutionReason: true,
        outcome: true,
        adjudicatorType: true,
        adjudicationType: true,
        durationMs: true,
        createdAt: true,
        completedAt: true,
      },
    })) as AdjudicationMemoryRow[];
    return { kind: "ok", rows };
  } catch {
    return { kind: "failed" };
  }
}

// ─────────────────────────────────────────────
// PANEL 2 — RECURRING EXCEPTION FAMILIES
// ─────────────────────────────────────────────

async function buildRecurringFamilies(
  prisma: ReconciliationCorePrismaClient,
  tenantIds: string[],
  load: AdjudicationLoad
): Promise<CrossRunIntelligenceSummary["recurringFamilies"]> {
  if (tenantIds.length === 0) {
    return {
      state: "unavailable",
      totalAdjudications: 0,
      families: [],
      reasonCodes: ["no_tenant_scope"],
    };
  }

  if (load.kind === "failed") {
    return {
      state: "unavailable",
      totalAdjudications: 0,
      families: [],
      reasonCodes: ["adjudication_history_query_failed"],
    };
  }

  const adjudications = load.rows;

  if (adjudications.length === 0) {
    return {
      state: "building",
      totalAdjudications: 0,
      families: [],
      reasonCodes: ["no_adjudication_history"],
    };
  }

  // Fetch archetypes for known archetypeIds
  const archetypeIds = Array.from(
    new Set(adjudications.map((a) => a.archetypeId).filter((id): id is string => id !== null))
  );

  let archetypes: ArchetypeRow[] = [];
  try {
    if (archetypeIds.length > 0) {
      archetypes = (await prisma.exceptionArchetype.findMany({
        where: { id: { in: archetypeIds }, tenantId: { in: tenantIds } },
        select: { id: true, code: true, label: true, category: true, typicalResolution: true },
      })) as ArchetypeRow[];
    }
  } catch {
    // Non-fatal
  }

  const archetypeMap = new Map(archetypes.map((a) => [a.id, a]));

  // Group by archetype or resolution reason as fallback
  type FamilyKey = string;
  interface FamilyStats {
    archetypeId: string | null;
    resolutionKey: string;
    totalOccurrences: number;
    resolvedCount: number;
    unresolvedCount: number;
    totalDurationMs: number;
    durationCount: number;
    firstSeenAt: Date | null;
    lastSeenAt: Date | null;
    outcomeCounts: Map<string, number>;
  }

  const familyMap = new Map<FamilyKey, FamilyStats>();

  for (const adj of adjudications) {
    const key: FamilyKey = adj.archetypeId ?? adj.resolutionReason ?? adj.resolution ?? "unknown";

    let stats = familyMap.get(key);
    if (!stats) {
      stats = {
        archetypeId: adj.archetypeId,
        resolutionKey: key,
        totalOccurrences: 0,
        resolvedCount: 0,
        unresolvedCount: 0,
        totalDurationMs: 0,
        durationCount: 0,
        firstSeenAt: null,
        lastSeenAt: null,
        outcomeCounts: new Map(),
      };
      familyMap.set(key, stats);
    }

    stats.totalOccurrences++;

    const isResolved =
      adj.outcome === "resolved" || adj.resolution === "matched" || adj.resolution === "manual";
    if (isResolved) {
      stats.resolvedCount++;
    } else {
      stats.unresolvedCount++;
    }

    if (adj.durationMs !== null && adj.durationMs !== undefined) {
      stats.totalDurationMs += Number(adj.durationMs);
      stats.durationCount++;
    }

    const ts = adj.createdAt;
    if (!stats.firstSeenAt || ts < stats.firstSeenAt) stats.firstSeenAt = ts;
    if (!stats.lastSeenAt || ts > stats.lastSeenAt) stats.lastSeenAt = ts;

    if (adj.outcome) {
      stats.outcomeCounts.set(adj.outcome, (stats.outcomeCounts.get(adj.outcome) ?? 0) + 1);
    }
  }

  const families: RecurringExceptionFamily[] = Array.from(familyMap.entries())
    .map(([, stats]) => {
      const archetype = stats.archetypeId ? (archetypeMap.get(stats.archetypeId) ?? null) : null;
      const avgDurationMs =
        stats.durationCount > 0 ? Math.round(stats.totalDurationMs / stats.durationCount) : null;

      const topEntry = Array.from(stats.outcomeCounts.entries()).sort((a, b) => b[1] - a[1])[0];

      const score = scoreFamilyStats(stats);
      const trend = familyTrend({
        unresolvedCount: stats.unresolvedCount,
        resolvedCount: stats.resolvedCount,
        lastSeenAt: stats.lastSeenAt,
      });

      return {
        archetypeId: stats.archetypeId,
        archetypeCode: archetype?.code ?? null,
        archetypeLabel: archetype?.label ?? null,
        archetypeCategory: archetype?.category ?? null,
        resolutionKey: stats.resolutionKey,
        totalOccurrences: stats.totalOccurrences,
        resolvedCount: stats.resolvedCount,
        unresolvedCount: stats.unresolvedCount,
        avgDurationMs,
        firstSeenAt: toIso(stats.firstSeenAt),
        lastSeenAt: toIso(stats.lastSeenAt),
        topOutcome: topEntry?.[0] ?? null,
        trend,
        certainty: familyCertainty(
          stats.totalOccurrences,
          stats.unresolvedCount,
          stats.resolvedCount
        ),
        score,
      };
    })
    .sort((a, b) => b.score - a.score || b.totalOccurrences - a.totalOccurrences)
    .slice(0, 10);

  return {
    state: families.length > 0 ? "available" : "building",
    totalAdjudications: adjudications.length,
    families,
    reasonCodes: [],
  };
}

// ─────────────────────────────────────────────
// PANEL 3 — OPERATOR DECISION MEMORY
// ─────────────────────────────────────────────

async function buildDecisionMemory(
  prisma: ReconciliationCorePrismaClient,
  tenantIds: string[],
  load: AdjudicationLoad
): Promise<CrossRunIntelligenceSummary["decisionMemory"]> {
  if (tenantIds.length === 0) {
    return {
      state: "unavailable",
      totalDecisions: 0,
      recentDecisions: [],
      reasonCodes: ["no_tenant_scope"],
    };
  }

  if (load.kind === "failed") {
    return {
      state: "unavailable",
      totalDecisions: 0,
      recentDecisions: [],
      reasonCodes: ["adjudication_history_query_failed"],
    };
  }

  const adjudications = load.rows;
  let archetypeMap = new Map<string, ArchetypeRow>();

  // Fetch archetypes for display (same scope as families panel)
  const ids = Array.from(
    new Set(adjudications.map((a) => a.archetypeId).filter((id): id is string => id !== null))
  );
  if (ids.length > 0) {
    try {
      const rows = (await prisma.exceptionArchetype.findMany({
        where: { id: { in: ids }, tenantId: { in: tenantIds } },
        select: { id: true, code: true, label: true, category: true, typicalResolution: true },
      })) as ArchetypeRow[];
      archetypeMap = new Map(rows.map((a) => [a.id, a]));
    } catch {
      // Non-fatal — render without archetype labels
    }
  }

  if (adjudications.length === 0) {
    return {
      state: "empty",
      totalDecisions: 0,
      recentDecisions: [],
      reasonCodes: ["no_adjudication_history"],
    };
  }

  const recent = adjudications.slice(0, 10);

  const decisions: AdjudicationDecisionRecord[] = recent.map((adj) => {
    const archetype = adj.archetypeId ? (archetypeMap.get(adj.archetypeId) ?? null) : null;
    return {
      memoryId: adj.id,
      exceptionId: adj.exceptionId,
      archetypeLabel: archetype?.label ?? null,
      archetypeCode: archetype?.code ?? null,
      resolution: adj.resolution,
      resolutionReason: adj.resolutionReason,
      outcome: adj.outcome,
      adjudicatorType: adj.adjudicatorType,
      adjudicationType: adj.adjudicationType,
      durationMs: adj.durationMs !== null ? Number(adj.durationMs) : null,
      createdAt: adj.createdAt.toISOString(),
      completedAt: toIso(adj.completedAt),
    };
  });

  return {
    state: "available",
    totalDecisions: adjudications.length,
    recentDecisions: decisions,
    reasonCodes: [],
  };
}

// ─────────────────────────────────────────────
// PRIMARY EXPORT
// ─────────────────────────────────────────────

export interface CrossRunIntelligenceOptions {
  /** Maximum number of runs to include in the timeline. Defaults to 20. */
  timelineLimit?: number;
}

/**
 * Build a cross-run intelligence summary for the given tenant scope.
 *
 * Always returns a valid summary — never throws. Partial failures are
 * represented as degraded/unavailable states within each panel.
 *
 * @param prisma - Prisma client satisfying ReconciliationCorePrismaClient
 * @param tenantIds - Validated tenant IDs from resolveTenantMembershipScope()
 * @param options - Optional configuration
 */
export async function buildCrossRunIntelligenceSummary(
  prisma: ReconciliationCorePrismaClient,
  tenantIds: string[],
  _options: CrossRunIntelligenceOptions = {}
): Promise<CrossRunIntelligenceSummary> {
  const generatedAt = new Date().toISOString();

  if (tenantIds.length === 0) {
    return {
      state: "unavailable",
      generatedAt,
      runTimeline: {
        state: "unavailable",
        totalCompletedRuns: 0,
        runs: [],
        overallTrend: "unavailable",
        reasonCodes: ["no_tenant_scope"],
      },
      recurringFamilies: {
        state: "unavailable",
        totalAdjudications: 0,
        families: [],
        reasonCodes: ["no_tenant_scope"],
      },
      decisionMemory: {
        state: "unavailable",
        totalDecisions: 0,
        recentDecisions: [],
        reasonCodes: ["no_tenant_scope"],
      },
    };
  }

  const adjudicationLoad = await loadAdjudicationHistory(prisma, tenantIds);

  const [runTimelineRaw, recurringFamilies, decisionMemory] = await Promise.all([
    buildRunTimeline(prisma, tenantIds),
    buildRecurringFamilies(prisma, tenantIds, adjudicationLoad),
    buildDecisionMemory(prisma, tenantIds, adjudicationLoad),
  ]);

  // When adjudication history cannot load, timeline alone is not enough for full intelligence — surface as thin history
  const runTimeline: CrossRunIntelligenceSummary["runTimeline"] =
    adjudicationLoad.kind === "failed" && runTimelineRaw.state === "available"
      ? {
          ...runTimelineRaw,
          state: "insufficient_history",
          reasonCodes: Array.from(
            new Set([
              ...runTimelineRaw.reasonCodes,
              "adjudication_history_unavailable_for_intelligence",
            ])
          ),
        }
      : runTimelineRaw;

  const overallState: IntelligenceState =
    runTimeline.state === "unavailable" &&
    recurringFamilies.state === "unavailable" &&
    decisionMemory.state === "unavailable"
      ? "unavailable"
      : runTimeline.state === "available" ||
          recurringFamilies.state === "available" ||
          decisionMemory.state === "available"
        ? "available"
        : "building";

  return {
    state: overallState,
    generatedAt,
    runTimeline,
    recurringFamilies,
    decisionMemory,
  };
}
