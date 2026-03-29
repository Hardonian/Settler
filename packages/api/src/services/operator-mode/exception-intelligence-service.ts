import crypto from "node:crypto";
import { prisma } from "../../infrastructure/db/prisma";

export interface ExceptionSignature {
  signature: string;
  construction: {
    matchType: string;
    category: string;
    currency: string;
    reason: string;
    rationaleCodes: string[];
  };
}

export interface SourceTrustSignal {
  sourceId: string;
  sourceName: string;
  totalExceptions: number;
  resolvedRate: number;
  trustScore: number;
  basis: string[];
}

export interface CounterpartyFingerprint {
  counterpartyKey: string;
  displayName: string | null;
  exceptionCount: number;
  supportLevel: "none" | "partial" | "strong";
}

export interface ExplainableRecommendation {
  action: "manual_review" | "policy_adjustment" | "auto_match_candidate" | "insufficient_data";
  confidence: number | null;
  confidenceBasis: string;
  reasons: string[];
  degraded: boolean;
}

export interface AdjudicationEvent {
  matchId: string;
  runId: string;
  resolution: "matched" | "manual" | "ignored" | "unknown";
  actorId: string | null;
  occurredAt: string;
  notes: string | null;
}

export interface ResolutionPathSummary {
  count: number;
  lastSeenAt: string | null;
  avgResolutionMinutes: number | null;
  medianResolutionMinutes: number | null;
  adjudicationMix: Record<string, number>;
}

export interface RecurringExceptionCluster {
  signature: ExceptionSignature;
  volume: number;
  openCount: number;
  resolvedCount: number;
  resolutionPath: ResolutionPathSummary;
  recommendation: ExplainableRecommendation;
}

export interface ExceptionIntelligenceSnapshot {
  tenantId: string;
  generatedAt: string;
  lookbackDays: number;
  degraded: boolean;
  degradedReasons: string[];
  clusters: RecurringExceptionCluster[];
  sourceTrustSignals: SourceTrustSignal[];
  counterparties: CounterpartyFingerprint[];
}

export interface ProofGraphResponse {
  runId: string;
  tenantId: string;
  degraded: boolean;
  degradedReasons: string[];
  nodes: Array<{ id: string; type: string; label: string; metadata: Record<string, unknown> }>;
  edges: Array<{ from: string; to: string; relation: string }>;
}

export interface EvidencePack {
  runId: string;
  tenantId: string;
  generatedAt: string;
  summary: Record<string, unknown>;
  lineage: ProofGraphResponse;
  decisions: AdjudicationEvent[];
  provenance: { count: number; complete: boolean; missingReasons: string[] };
  deterministicDigest: string;
  exportMetadata: Record<string, unknown>;
}

export interface PolicySandboxRequest {
  runId: string;
  candidatePolicy: {
    amountTolerance: number;
    dateWindowDays: number;
    fuzzyDescriptionThreshold: number;
    requireExactAmount: boolean;
  };
}

export interface PolicySandboxResult {
  runId: string;
  tenantId: string;
  simulatedAt: string;
  reproducibilityKey: string;
  cohort: { matchCount: number; runStatus: string | null };
  baseline: { matchRate: number; exceptionRate: number; operatorReviewLoad: number };
  candidate: { matchRate: number; exceptionRate: number; operatorReviewLoad: number };
  metricSupport: Record<string, "supported" | "unsupported">;
  degraded: boolean;
  degradedReasons: string[];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function computeMedian(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = nums.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

function signatureFrom(match: {
  matchType: string;
  matchReason: string | null;
  metadata: unknown;
  sourceTransaction?: { category: string | null; currency: string | null } | null;
}): ExceptionSignature {
  const metadata = asRecord(match.metadata);
  const rationaleCodes = Array.isArray(metadata["rationale_codes"])
    ? (metadata["rationale_codes"] as unknown[])
        .filter((v): v is string => typeof v === "string")
        .sort()
    : [];
  const construction = {
    matchType: match.matchType,
    category: match.sourceTransaction?.category ?? "uncategorized",
    currency: match.sourceTransaction?.currency ?? "unknown",
    reason: match.matchReason ?? "none",
    rationaleCodes,
  };
  const signature = crypto
    .createHash("sha256")
    .update(JSON.stringify(construction))
    .digest("hex")
    .slice(0, 20);
  return { signature, construction };
}

function recommendationFor(cluster: {
  volume: number;
  resolvedCount: number;
  openCount: number;
  lowConfidenceCount: number;
}): ExplainableRecommendation {
  if (cluster.volume < 3) {
    return {
      action: "insufficient_data",
      confidence: null,
      confidenceBasis: "Fewer than 3 observations in lookback window",
      reasons: ["insufficient_cluster_volume"],
      degraded: true,
    };
  }
  const openRatio = cluster.openCount / cluster.volume;
  const resolvedRatio = cluster.resolvedCount / cluster.volume;
  const lowConfRatio = cluster.lowConfidenceCount / cluster.volume;
  if (openRatio > 0.6) {
    return {
      action: "manual_review",
      confidence: Number(Math.min(0.95, 0.6 + openRatio / 3).toFixed(2)),
      confidenceBasis: "High unresolved concentration in recurring signature",
      reasons: [`open_ratio=${openRatio.toFixed(2)}`],
      degraded: false,
    };
  }
  if (lowConfRatio > 0.4) {
    return {
      action: "policy_adjustment",
      confidence: Number(Math.min(0.9, 0.5 + lowConfRatio / 2).toFixed(2)),
      confidenceBasis: "High low-confidence recurrence indicates policy sensitivity",
      reasons: [`low_confidence_ratio=${lowConfRatio.toFixed(2)}`],
      degraded: false,
    };
  }
  return {
    action: "auto_match_candidate",
    confidence: Number(Math.max(0.55, resolvedRatio).toFixed(2)),
    confidenceBasis: "Historically resolved signature with low open burden",
    reasons: [`resolved_ratio=${resolvedRatio.toFixed(2)}`],
    degraded: false,
  };
}

export class ExceptionIntelligenceService {
  async getSnapshot(
    tenantId: string,
    lookbackDays: number
  ): Promise<ExceptionIntelligenceSnapshot> {
    const since = new Date(Date.now() - lookbackDays * 86400000);
    const matches = await prisma.reconciliationMatch.findMany({
      where: { tenantId, createdAt: { gte: since } },
      include: { sourceTransaction: { include: { source: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 3000,
    });

    const clusters = new Map<
      string,
      {
        signature: ExceptionSignature;
        volume: number;
        openCount: number;
        resolvedCount: number;
        lowConfidenceCount: number;
        durations: number[];
        lastSeenAt: Date | null;
        adjudicationMix: Record<string, number>;
      }
    >();
    const sourceSignals = new Map<string, { name: string; total: number; resolved: number }>();
    const counterparty = new Map<string, { name: string | null; count: number }>();

    for (const match of matches) {
      const sig = signatureFrom(match);
      const current = clusters.get(sig.signature) ?? {
        signature: sig,
        volume: 0,
        openCount: 0,
        resolvedCount: 0,
        lowConfidenceCount: 0,
        durations: [] as number[],
        lastSeenAt: null as Date | null,
        adjudicationMix: {},
      };
      current.volume += 1;
      current.lastSeenAt =
        !current.lastSeenAt || match.createdAt > current.lastSeenAt
          ? match.createdAt
          : current.lastSeenAt;
      if (Number(match.confidence) < 0.75) current.lowConfidenceCount += 1;
      if (match.reviewed) {
        current.resolvedCount += 1;
        const res = match.matchReason?.toLowerCase().includes("ignored") ? "ignored" : "manual";
        current.adjudicationMix[res] = (current.adjudicationMix[res] ?? 0) + 1;
        if (match.reviewedAt)
          current.durations.push((match.reviewedAt.getTime() - match.createdAt.getTime()) / 60000);
      } else {
        current.openCount += 1;
        current.adjudicationMix["open"] = (current.adjudicationMix["open"] ?? 0) + 1;
      }
      clusters.set(sig.signature, current);

      const sourceId = match.sourceTransaction?.source?.id;
      if (sourceId) {
        const src = sourceSignals.get(sourceId) ?? {
          name: match.sourceTransaction.source.name,
          total: 0,
          resolved: 0,
        };
        src.total += 1;
        if (match.reviewed) src.resolved += 1;
        sourceSignals.set(sourceId, src);
      }

      const key = match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`;
      const cp = counterparty.get(key) ?? {
        name: match.sourceTransaction?.description ?? null,
        count: 0,
      };
      cp.count += 1;
      counterparty.set(key, cp);
    }

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      degraded: matches.length === 0,
      degradedReasons: matches.length === 0 ? ["no_exception_history_in_scope"] : [],
      clusters: Array.from(clusters.values())
        .map((cluster) => {
          const avg = cluster.durations.length
            ? cluster.durations.reduce((a, b) => a + b, 0) / cluster.durations.length
            : null;
          return {
            signature: cluster.signature,
            volume: cluster.volume,
            openCount: cluster.openCount,
            resolvedCount: cluster.resolvedCount,
            resolutionPath: {
              count: cluster.volume,
              lastSeenAt: cluster.lastSeenAt?.toISOString() ?? null,
              avgResolutionMinutes: avg ? Number(avg.toFixed(2)) : null,
              medianResolutionMinutes: computeMedian(cluster.durations),
              adjudicationMix: cluster.adjudicationMix,
            },
            recommendation: recommendationFor(cluster),
          };
        })
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 25),
      sourceTrustSignals: Array.from(sourceSignals.entries()).map(([sourceId, item]) => {
        const resolvedRate = item.total ? item.resolved / item.total : 0;
        return {
          sourceId,
          sourceName: item.name,
          totalExceptions: item.total,
          resolvedRate: Number(resolvedRate.toFixed(4)),
          trustScore: Math.round(resolvedRate * 100),
          basis: ["review_resolution_rate", `sample_size=${item.total}`],
        };
      }),
      counterparties: Array.from(counterparty.entries())
        .map(([counterpartyKey, value]) => ({
          counterpartyKey,
          displayName: value.name,
          exceptionCount: value.count,
          supportLevel: (value.count >= 5 ? "strong" : value.count >= 2 ? "partial" : "none") as
            | "none"
            | "partial"
            | "strong",
        }))
        .sort((a, b) => b.exceptionCount - a.exceptionCount)
        .slice(0, 20),
    };
  }

  async getProofGraph(tenantId: string, runId: string): Promise<ProofGraphResponse> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: { matches: true, provenance: true },
    });
    if (!run)
      return {
        runId,
        tenantId,
        degraded: true,
        degradedReasons: ["run_not_found_or_not_scoped"],
        nodes: [],
        edges: [],
      };

    const nodes: ProofGraphResponse["nodes"] = [
      {
        id: `run:${run.id}`,
        type: "run",
        label: `Run ${run.id}`,
        metadata: {
          status: run.status,
          startedAt: run.startedAt.toISOString(),
          completedAt: run.completedAt?.toISOString() ?? null,
        },
      },
    ];
    const edges: ProofGraphResponse["edges"] = [];

    for (const match of run.matches) {
      const mid = `match:${match.id}`;
      nodes.push({
        id: mid,
        type: "match",
        label: `Match ${match.id}`,
        metadata: {
          matchType: match.matchType,
          reviewed: match.reviewed,
          confidence: Number(match.confidence),
        },
      });
      edges.push({ from: `run:${run.id}`, to: mid, relation: "produced" });
    }

    for (const event of run.provenance) {
      const pid = `prov:${event.id}`;
      nodes.push({
        id: pid,
        type: "provenance",
        label: event.eventType,
        metadata: {
          sequence: event.sequence,
          actorType: event.actorType,
          actorUserId: event.actorUserId,
          createdAt: event.createdAt.toISOString(),
          entryHash: event.entryHash,
        },
      });
      edges.push({ from: `run:${run.id}`, to: pid, relation: "recorded" });
      if (event.matchId)
        edges.push({ from: `match:${event.matchId}`, to: pid, relation: "evidenced_by" });
    }

    const degradedReasons: string[] = [];
    if (run.provenance.length === 0) degradedReasons.push("missing_run_provenance");

    return { runId, tenantId, degraded: degradedReasons.length > 0, degradedReasons, nodes, edges };
  }

  async buildEvidencePack(tenantId: string, runId: string): Promise<EvidencePack> {
    const graph = await this.getProofGraph(tenantId, runId);
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: { matches: true, provenance: { orderBy: { sequence: "asc" } } },
    });
    const decisions: AdjudicationEvent[] = (run?.matches ?? [])
      .filter((m) => m.reviewed)
      .map((m) => ({
        matchId: m.id,
        runId,
        resolution: m.matchReason?.toLowerCase().includes("ignored") ? "ignored" : "manual",
        actorId: m.reviewedBy,
        occurredAt: m.reviewedAt?.toISOString() ?? m.updatedAt.toISOString(),
        notes: m.matchReason,
      }));
    const digest = crypto
      .createHash("sha256")
      .update(JSON.stringify({ graph, decisions }))
      .digest("hex");
    return {
      runId,
      tenantId,
      generatedAt: new Date().toISOString(),
      summary: {
        runStatus: run?.status ?? null,
        matchCount: run?.matches.length ?? 0,
        decisionCount: decisions.length,
      },
      lineage: graph,
      decisions,
      provenance: {
        count: run?.provenance.length ?? 0,
        complete: (run?.provenance.length ?? 0) > 0,
        missingReasons: (run?.provenance.length ?? 0) > 0 ? [] : ["no_provenance_entries_for_run"],
      },
      deterministicDigest: digest,
      exportMetadata: {
        format: "json",
        version: "v1",
        generatedBy: "exception-intelligence-service",
      },
    };
  }

  async simulatePolicy(
    tenantId: string,
    input: PolicySandboxRequest
  ): Promise<PolicySandboxResult> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: input.runId, tenantId },
      include: { matches: true },
    });
    if (!run) {
      return {
        runId: input.runId,
        tenantId,
        simulatedAt: new Date().toISOString(),
        reproducibilityKey: crypto
          .createHash("sha256")
          .update(`${tenantId}|${input.runId}|missing`)
          .digest("hex"),
        cohort: { matchCount: 0, runStatus: null },
        baseline: { matchRate: 0, exceptionRate: 0, operatorReviewLoad: 0 },
        candidate: { matchRate: 0, exceptionRate: 0, operatorReviewLoad: 0 },
        metricSupport: {
          matchRate: "supported",
          exceptionRate: "supported",
          operatorReviewLoad: "supported",
          overrideSensitivity: "supported",
          falsePositiveRate: "unsupported",
          falseNegativeRate: "unsupported",
        },
        degraded: true,
        degradedReasons: ["run_not_found_or_not_scoped"],
      };
    }

    const total = Math.max(run.matches.length, 1);
    const baselineMatched = run.matches.filter((m) => m.matchType !== "unmatched").length;
    const baselineReview = run.matches.filter((m) => !m.reviewed).length;
    const candidateMatched = run.matches.filter((m) => {
      const amountDiff = Number(m.amountDiff ?? 0);
      const dateDiff = Math.abs(m.dateDiff ?? 0);
      if (input.candidatePolicy.requireExactAmount && amountDiff !== 0) return false;
      return (
        amountDiff <= input.candidatePolicy.amountTolerance &&
        dateDiff <= input.candidatePolicy.dateWindowDays
      );
    }).length;

    const reproducibilityKey = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          tenantId,
          runId: input.runId,
          policy: input.candidatePolicy,
          sample: run.matches.map((m) => [
            m.id,
            Number(m.amountDiff ?? 0),
            m.dateDiff ?? 0,
            m.matchType,
          ]),
        })
      )
      .digest("hex");

    return {
      runId: input.runId,
      tenantId,
      simulatedAt: new Date().toISOString(),
      reproducibilityKey,
      cohort: { matchCount: run.matches.length, runStatus: run.status },
      baseline: {
        matchRate: Number((baselineMatched / total).toFixed(4)),
        exceptionRate: Number(((total - baselineMatched) / total).toFixed(4)),
        operatorReviewLoad: baselineReview,
      },
      candidate: {
        matchRate: Number((candidateMatched / total).toFixed(4)),
        exceptionRate: Number(((total - candidateMatched) / total).toFixed(4)),
        operatorReviewLoad: total - candidateMatched,
      },
      metricSupport: {
        matchRate: "supported",
        exceptionRate: "supported",
        operatorReviewLoad: "supported",
        overrideSensitivity: "supported",
        falsePositiveRate: "unsupported",
        falseNegativeRate: "unsupported",
      },
      degraded: false,
      degradedReasons: [],
    };
  }
}
