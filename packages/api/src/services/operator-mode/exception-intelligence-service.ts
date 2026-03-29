import crypto from "node:crypto";
import { prisma } from "../../infrastructure/db/prisma";

const prismaAny = prisma as any;

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

export interface SignatureOutcomeProfile {
  signature: string;
  totalObservations: number;
  resolutionDistribution: Record<string, number>;
  operatorReviewedRate: number;
  overrideFrequency: number;
  evidenceBasis: string[];
  degraded: boolean;
  degradedReasons: string[];
}

export interface LearnedPolicyCandidate {
  proposalId: string;
  tenantId: string;
  proposalType: "policy_adjustment" | "manual_guardrail";
  why: string;
  historicalSupport: {
    sampleSize: number;
    signature: string;
    resolutionDistribution: Record<string, number>;
    operatorReviewedRate: number;
  };
  estimatedImpact: {
    supported: string[];
    unsupported: string[];
    estimate: Record<string, number | null>;
  };
  riskFlags: string[];
  missingData: string[];
  status: "pending_review" | "approved" | "rejected" | "deferred";
  createdAt: string;
}

export interface ProposalReviewAction {
  action: "approve" | "reject" | "defer";
  actorUserId: string;
  reason: string | null;
}

export interface ExceptionPlaybookSummary {
  signature: string;
  clusterIdentity: Record<string, unknown>;
  commonResolutionPaths: Record<string, number>;
  handlingTimeMinutes: { average: number | null; median: number | null };
  sourceSystems: string[];
  commonOperatorActions: string[];
  escalationIndicators: string[];
  ambiguityMarkers: string[];
  evidenceCoverage: "strong" | "partial" | "insufficient";
  basisType: "automatic_only" | "operator_reviewed_only" | "mixed";
  degradedReasons: string[];
}

export interface DecisionHistoryRecord {
  id: string;
  tenantId: string;
  runId: string | null;
  signature: string | null;
  counterpartyKey: string | null;
  sourcePair: string | null;
  action: string;
  priorState: string | null;
  resultingState: string | null;
  actorUserId: string | null;
  reason: string | null;
  occurredAt: string;
  provenanceType: "match_review" | "proposal_review";
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
  completenessByCategory: Record<
    string,
    { complete: boolean; degraded: boolean; reasons: string[] }
  >;
  deterministicDigest: string;
  exportMetadata: Record<string, unknown>;
}

export interface PolicyEvolutionProposal {
  proposalId: string;
  tenantId: string;
  generatedAt: string;
  signature: ExceptionSignature;
  why: string;
  historicalBasis: {
    supportCount: number;
    lookbackDays: number;
    openCount: number;
    resolvedCount: number;
    lowConfidenceCount: number;
    adjudicationMix: Record<string, number>;
  };
  affectedScope: {
    sourceIds: string[];
    counterpartyKeys: string[];
  };
  estimatedImpact: {
    expectedManualReviewReduction: number | null;
    expectedOpenExceptionChange: number | null;
  };
  unsupportedMetrics: string[];
  riskFlags: string[];
  dataSufficiency: "insufficient" | "limited" | "sufficient";
  status: "pending_review" | "approved" | "rejected" | "deferred";
  latestReview: {
    decision: "approved" | "rejected" | "deferred";
    reviewedBy: string | null;
    reviewedAt: string;
    reason: string | null;
  } | null;
}

export interface DecisionHistoryEntry {
  matchId: string;
  runId: string;
  tenantId: string;
  signature: string;
  sourceId: string | null;
  counterpartyKey: string;
  previousState: "pending_review";
  resultingState: "reviewed";
  decision: "manual" | "ignored";
  actorId: string | null;
  reason: string | null;
  decidedAt: string;
}

export interface DecisionHistoryResponse {
  tenantId: string;
  generatedAt: string;
  filters: {
    runId?: string;
    sourceId?: string;
    counterpartyKey?: string;
    signature?: string;
    limit: number;
  };
  degraded: boolean;
  degradedReasons: string[];
  decisions: DecisionHistoryEntry[];
}

export interface PolicyProposalReviewInput {
  proposalId: string;
  decision: "approved" | "rejected" | "deferred";
  reviewerId: string | null;
  reason: string | null;
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

function parseClusterFromProposalAudit(afterState: unknown): {
  signature: ExceptionSignature;
  volume: number;
  openCount: number;
  resolvedCount: number;
  lowConfidenceCount: number;
  adjudicationMix: Record<string, number>;
  sourceIds: string[];
  counterpartyKeys: string[];
} | null {
  const state = asRecord(afterState);
  const signatureState = asRecord(state["signature"]);
  const construction = asRecord(signatureState["construction"]);
  const matchType = construction["matchType"];
  const category = construction["category"];
  const currency = construction["currency"];
  const reason = construction["reason"];
  if (
    typeof signatureState["signature"] !== "string" ||
    typeof matchType !== "string" ||
    typeof category !== "string" ||
    typeof currency !== "string" ||
    typeof reason !== "string"
  ) {
    return null;
  }
  const rationaleCodes = Array.isArray(construction["rationaleCodes"])
    ? (construction["rationaleCodes"] as unknown[]).filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  const sourceIds = Array.isArray(state["sourceIds"])
    ? (state["sourceIds"] as unknown[]).filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  const counterpartyKeys = Array.isArray(state["counterpartyKeys"])
    ? (state["counterpartyKeys"] as unknown[]).filter(
        (value): value is string => typeof value === "string"
      )
    : [];
  return {
    signature: {
      signature: signatureState["signature"],
      construction: {
        matchType,
        category,
        currency,
        reason,
        rationaleCodes,
      },
    },
    volume: Number(state["volume"] ?? 0),
    openCount: Number(state["openCount"] ?? 0),
    resolvedCount: Number(state["resolvedCount"] ?? 0),
    lowConfidenceCount: Number(state["lowConfidenceCount"] ?? 0),
    adjudicationMix: asRecord(state["adjudicationMix"]) as Record<string, number>,
    sourceIds,
    counterpartyKeys,
  };
}

function buildProposal(
  tenantId: string,
  generatedAt: Date,
  lookbackDays: number,
  cluster: {
    signature: ExceptionSignature;
    volume: number;
    openCount: number;
    resolvedCount: number;
    lowConfidenceCount: number;
    adjudicationMix: Record<string, number>;
    sourceIds: string[];
    counterpartyKeys: string[];
  },
  latestReview: PolicyEvolutionProposal["latestReview"]
): PolicyEvolutionProposal {
  const recommendation = recommendationFor(cluster);
  const riskFlags: string[] = [];
  if (cluster.openCount / Math.max(1, cluster.volume) > 0.6)
    riskFlags.push("high_open_exception_concentration");
  if (cluster.lowConfidenceCount / Math.max(1, cluster.volume) > 0.4)
    riskFlags.push("high_low_confidence_concentration");
  if (cluster.volume < 5) riskFlags.push("small_sample_size");

  const dataSufficiency: PolicyEvolutionProposal["dataSufficiency"] =
    cluster.volume >= 10 ? "sufficient" : cluster.volume >= 5 ? "limited" : "insufficient";

  return {
    proposalId: crypto
      .createHash("sha256")
      .update(`${tenantId}|${cluster.signature.signature}|${lookbackDays}`)
      .digest("hex")
      .slice(0, 24),
    tenantId,
    generatedAt: generatedAt.toISOString(),
    signature: cluster.signature,
    why: recommendation.confidenceBasis,
    historicalBasis: {
      supportCount: cluster.volume,
      lookbackDays,
      openCount: cluster.openCount,
      resolvedCount: cluster.resolvedCount,
      lowConfidenceCount: cluster.lowConfidenceCount,
      adjudicationMix: cluster.adjudicationMix,
    },
    affectedScope: {
      sourceIds: cluster.sourceIds,
      counterpartyKeys: cluster.counterpartyKeys,
    },
    estimatedImpact: {
      expectedManualReviewReduction:
        cluster.volume > 0 ? Number((cluster.resolvedCount / cluster.volume).toFixed(4)) : null,
      expectedOpenExceptionChange:
        cluster.volume > 0 ? Number((-(cluster.openCount / cluster.volume)).toFixed(4)) : null,
    },
    unsupportedMetrics: ["false_positive_rate", "false_negative_rate", "causal_effect_size"],
    riskFlags,
    dataSufficiency,
    status: latestReview?.decision ?? "pending_review",
    latestReview,
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

  async generatePolicyEvolutionProposals(
    tenantId: string,
    lookbackDays: number
  ): Promise<PolicyEvolutionProposal[]> {
    const since = new Date(Date.now() - lookbackDays * 86400000);
    const matches = await prisma.reconciliationMatch.findMany({
      where: { tenantId, createdAt: { gte: since } },
      include: { sourceTransaction: { include: { source: { select: { id: true } } } } },
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
        adjudicationMix: Record<string, number>;
        sourceIds: Set<string>;
        counterpartyKeys: Set<string>;
      }
    >();

    for (const match of matches) {
      const sig = signatureFrom(match);
      const current = clusters.get(sig.signature) ?? {
        signature: sig,
        volume: 0,
        openCount: 0,
        resolvedCount: 0,
        lowConfidenceCount: 0,
        adjudicationMix: {},
        sourceIds: new Set<string>(),
        counterpartyKeys: new Set<string>(),
      };
      current.volume += 1;
      if (match.reviewed) current.resolvedCount += 1;
      else current.openCount += 1;
      if (Number(match.confidence) < 0.75) current.lowConfidenceCount += 1;
      const reasonKey = match.reviewed
        ? match.matchReason?.toLowerCase().includes("ignored")
          ? "ignored"
          : "manual"
        : "open";
      current.adjudicationMix[reasonKey] = (current.adjudicationMix[reasonKey] ?? 0) + 1;
      const sourceId = match.sourceTransaction?.source?.id;
      if (sourceId) current.sourceIds.add(sourceId);
      current.counterpartyKeys.add(
        match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`
      );
      clusters.set(sig.signature, current);
    }

    const generatedAt = new Date();
    const candidateClusters = Array.from(clusters.values())
      .filter((cluster) => cluster.volume >= 3)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20);

    const proposals: PolicyEvolutionProposal[] = [];
    for (const cluster of candidateClusters) {
      const proposal = buildProposal(
        tenantId,
        generatedAt,
        lookbackDays,
        {
          signature: cluster.signature,
          volume: cluster.volume,
          openCount: cluster.openCount,
          resolvedCount: cluster.resolvedCount,
          lowConfidenceCount: cluster.lowConfidenceCount,
          adjudicationMix: cluster.adjudicationMix,
          sourceIds: Array.from(cluster.sourceIds.values()).sort(),
          counterpartyKeys: Array.from(cluster.counterpartyKeys.values()).sort(),
        },
        null
      );

      const existing = await prisma.reconAudit.findFirst({
        where: {
          tenantId,
          entityType: "policy_proposal",
          entityId: proposal.proposalId,
          action: "proposal_generated",
        },
        orderBy: { createdAt: "desc" },
      });
      if (!existing) {
        await prisma.reconAudit.create({
          data: {
            tenantId,
            reconJobId: null,
            reconResultId: null,
            userId: null,
            auditType: "policy_evolution",
            action: "proposal_generated",
            entityType: "policy_proposal",
            entityId: proposal.proposalId,
            changes: {
              lookbackDays,
              generatedAt: proposal.generatedAt,
            },
            beforeState: {},
            afterState: JSON.parse(
              JSON.stringify({
                signature: proposal.signature,
                volume: proposal.historicalBasis.supportCount,
                openCount: proposal.historicalBasis.openCount,
                resolvedCount: proposal.historicalBasis.resolvedCount,
                lowConfidenceCount: proposal.historicalBasis.lowConfidenceCount,
                adjudicationMix: proposal.historicalBasis.adjudicationMix,
                sourceIds: proposal.affectedScope.sourceIds,
                counterpartyKeys: proposal.affectedScope.counterpartyKeys,
              })
            ),
            metadata: {
              unsupportedMetrics: proposal.unsupportedMetrics,
              riskFlags: proposal.riskFlags,
              dataSufficiency: proposal.dataSufficiency,
            },
          },
        });
      }
      proposals.push(proposal);
    }

    return proposals;
  }

  async listPolicyEvolutionProposals(
    tenantId: string,
    lookbackDays: number
  ): Promise<PolicyEvolutionProposal[]> {
    await this.generatePolicyEvolutionProposals(tenantId, lookbackDays);
    const generated = await prisma.reconAudit.findMany({
      where: { tenantId, entityType: "policy_proposal", action: "proposal_generated" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const reviews = await prisma.reconAudit.findMany({
      where: { tenantId, entityType: "policy_proposal", action: "proposal_reviewed" },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const latestReviewByProposal = new Map<string, PolicyEvolutionProposal["latestReview"]>();
    for (const review of reviews) {
      if (!review.entityId) continue;
      if (latestReviewByProposal.has(review.entityId)) continue;
      const changes = asRecord(review.changes);
      const decision = changes["decision"];
      if (decision !== "approved" && decision !== "rejected" && decision !== "deferred") continue;
      latestReviewByProposal.set(review.entityId, {
        decision,
        reviewedBy: review.userId,
        reviewedAt: review.createdAt.toISOString(),
        reason: typeof changes["reason"] === "string" ? changes["reason"] : null,
      });
    }
    return generated
      .map((audit) => {
        if (!audit.entityId) return null;
        const cluster = parseClusterFromProposalAudit(audit.afterState);
        if (!cluster) return null;
        return buildProposal(
          tenantId,
          audit.createdAt,
          lookbackDays,
          cluster,
          latestReviewByProposal.get(audit.entityId) ?? null
        );
      })
      .filter((proposal): proposal is PolicyEvolutionProposal => Boolean(proposal));
  }

  async reviewPolicyEvolutionProposal(
    tenantId: string,
    input: PolicyProposalReviewInput
  ): Promise<{ accepted: boolean; status: string; degraded: boolean; degradedReasons: string[] }> {
    const proposal = await prisma.reconAudit.findFirst({
      where: {
        tenantId,
        entityType: "policy_proposal",
        entityId: input.proposalId,
        action: "proposal_generated",
      },
      orderBy: { createdAt: "desc" },
    });
    if (!proposal) {
      return {
        accepted: false,
        status: "missing",
        degraded: true,
        degradedReasons: ["proposal_not_found_or_not_scoped"],
      };
    }

    await prisma.reconAudit.create({
      data: {
        tenantId,
        reconJobId: null,
        reconResultId: null,
        userId: input.reviewerId,
        auditType: "policy_evolution",
        action: "proposal_reviewed",
        entityType: "policy_proposal",
        entityId: input.proposalId,
        changes: {
          decision: input.decision,
          reason: input.reason,
        },
        beforeState: {},
        afterState: {
          status: input.decision,
        },
        metadata: {
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    return {
      accepted: true,
      status: input.decision,
      degraded: false,
      degradedReasons: [],
    };
  }

  async getDecisionHistory(
    tenantId: string,
    filters: {
      runId?: string;
      sourceId?: string;
      counterpartyKey?: string;
      signature?: string;
      limit?: number;
    }
  ): Promise<DecisionHistoryResponse> {
    const limit = Math.max(1, Math.min(filters.limit ?? 100, 500));
    const matches = await prisma.reconciliationMatch.findMany({
      where: {
        tenantId,
        reviewed: true,
        ...(filters.runId ? { runId: filters.runId } : {}),
        ...(filters.sourceId ? { sourceTransaction: { sourceId: filters.sourceId } } : {}),
        ...(filters.counterpartyKey
          ? { sourceTransaction: { externalId: filters.counterpartyKey } }
          : {}),
      },
      include: { sourceTransaction: { include: { source: { select: { id: true } } } } },
      orderBy: { reviewedAt: "desc" },
      take: limit * 3,
    });

    const decisionsMapped = matches.map((match): DecisionHistoryEntry | null => {
      const signature = signatureFrom(match).signature;
      if (filters.signature && signature !== filters.signature) return null;
      return {
        matchId: match.id,
        runId: match.runId,
        tenantId,
        signature,
        sourceId: match.sourceTransaction?.source?.id ?? null,
        counterpartyKey: match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`,
        previousState: "pending_review" as const,
        resultingState: "reviewed" as const,
        decision: (match.matchReason?.toLowerCase().includes("ignored") ? "ignored" : "manual") as
          | "manual"
          | "ignored",
        actorId: match.reviewedBy,
        reason: match.matchReason,
        decidedAt: (match.reviewedAt ?? match.updatedAt).toISOString(),
      };
    });
    const decisions = decisionsMapped
      .filter((decision): decision is DecisionHistoryEntry => decision !== null)
      .slice(0, limit);

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      filters: {
        runId: filters.runId,
        sourceId: filters.sourceId,
        counterpartyKey: filters.counterpartyKey,
        signature: filters.signature,
        limit,
      },
      degraded: decisions.length === 0,
      degradedReasons: decisions.length === 0 ? ["no_reviewed_decisions_in_scope"] : [],
      decisions,
    };
  }

  async getProofGraph(tenantId: string, runId: string): Promise<ProofGraphResponse> {
    const run: any = await prismaAny.reconciliationRun.findFirst({
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
    const run: any = await prismaAny.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: { matches: true, provenance: { orderBy: { sequence: "asc" } } },
    });
    const decisions: AdjudicationEvent[] = (run?.matches ?? [])
      .filter((m: any) => m.reviewed)
      .map((m: any) => ({
        matchId: m.id,
        runId,
        resolution: m.matchReason?.toLowerCase().includes("ignored") ? "ignored" : "manual",
        actorId: m.reviewedBy,
        occurredAt: m.reviewedAt?.toISOString() ?? m.updatedAt.toISOString(),
        notes: m.matchReason,
      }));
    const completenessByCategory = {
      runLineage: {
        complete: graph.nodes.some((n) => n.type === "run"),
        degraded: !graph.nodes.some((n) => n.type === "run"),
        reasons: graph.nodes.some((n) => n.type === "run") ? [] : ["missing_run_node"],
      },
      matchLineage: {
        complete: graph.nodes.some((n) => n.type === "match"),
        degraded: !graph.nodes.some((n) => n.type === "match"),
        reasons: graph.nodes.some((n) => n.type === "match") ? [] : ["no_match_nodes"],
      },
      operatorDecisions: {
        complete: decisions.length > 0,
        degraded: decisions.length === 0,
        reasons: decisions.length > 0 ? [] : ["no_operator_decisions"],
      },
      policyReferences: {
        complete: false,
        degraded: true,
        reasons: ["policy_reference_linking_not_available"],
      },
      provenanceRecords: {
        complete: (run?.provenance.length ?? 0) > 0,
        degraded: (run?.provenance.length ?? 0) === 0,
        reasons: (run?.provenance.length ?? 0) > 0 ? [] : ["no_provenance_entries_for_run"],
      },
      exportDeterminismBasis: { complete: true, degraded: false, reasons: [] },
    };

    const deterministicInputs = {
      runId,
      tenantId,
      graphNodeIds: graph.nodes.map((node) => node.id).sort(),
      graphEdgeSet: graph.edges.map((edge) => `${edge.from}|${edge.relation}|${edge.to}`).sort(),
      decisionSet: decisions
        .map((decision) => `${decision.matchId}|${decision.resolution}|${decision.occurredAt}`)
        .sort(),
      completenessByCategory,
    };

    const digest = crypto
      .createHash("sha256")
      .update(JSON.stringify(deterministicInputs))
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
      completenessByCategory,
      deterministicDigest: digest,
      exportMetadata: {
        format: "json",
        version: "v2",
        generatedBy: "exception-intelligence-service",
        generatedAt: new Date().toISOString(),
        tenantScope: tenantId,
        runScope: runId,
        completenessFlags: Object.fromEntries(
          Object.entries(completenessByCategory).map(([k, v]) => [k, v.complete])
        ),
        deterministicInputReferences: Object.keys(deterministicInputs),
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
