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

export interface ExceptionOntologyClassification {
  mismatchType: "amount_mismatch" | "date_mismatch" | "reference_mismatch" | "unknown";
  evidenceGapType:
    | "missing_supporting_documentation"
    | "missing_reference_data"
    | "missing_counterparty_context"
    | "none"
    | "unknown";
  timingDiscrepancyType: "late_arrival" | "window_violation" | "none" | "unknown";
  policyConflictType: "tolerance_violation" | "rule_conflict" | "none" | "unknown";
  sourceInconsistencyType: "format_inconsistency" | "duplicate_signal" | "none" | "unknown";
  reviewRequiredType: "manual_override_required" | "ambiguous_match" | "none" | "unknown";
  unresolvedBecause:
    | "missing_evidence"
    | "policy_too_strict"
    | "counterparty_dispute"
    | "operator_capacity"
    | "unknown";
  disputeBecause:
    | "amount_disagreement"
    | "timing_disagreement"
    | "evidence_disagreement"
    | "none"
    | "unknown";
  support: "weak" | "partial" | "strong";
  degraded: boolean;
  degradedReasons: string[];
  basis: string[];
}

export interface SignatureLifecycleSummary {
  tenantId: string;
  signature: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  frequency: { total: number; reviewed: number; unresolved: number };
  recurrenceTrend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  usualResolutionPaths: Record<string, number>;
  unresolvedRate: number | null;
  ambiguityRate: number | null;
  linkedSources: Array<{ sourceId: string; sourceName: string | null; count: number }>;
  linkedEntities: Array<{ counterpartyKey: string; count: number }>;
  linkedProposals: Array<{ proposalId: string; status: string; createdAt: string }>;
  linkedPackVersions: Array<{ packVersion: string; status: string; createdAt: string }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface SourceFrictionSummary {
  tenantId: string;
  generatedAt: string;
  sources: Array<{
    sourceId: string;
    sourceName: string | null;
    totals: { exceptions: number; unresolved: number; manualReview: number; overrides: number };
    rates: {
      unresolvedRate: number | null;
      manualReviewRate: number | null;
      overrideRate: number | null;
      evidenceCompletenessRate: number | null;
      timelinessLagMinutes: number | null;
    };
    policyFrictionSignatures: Array<{ signature: string; count: number }>;
    support: "weak" | "partial" | "strong";
    degraded: boolean;
    degradedReasons: string[];
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface EntityFingerprintSummary {
  tenantId: string;
  generatedAt: string;
  entities: Array<{
    counterpartyKey: string;
    displayName: string | null;
    exceptionCount: number;
    repeatedMismatchTypes: Array<{ matchType: string; count: number }>;
    documentationGapRate: number | null;
    interventionPatterns: Record<string, number>;
    disputeLikeChurnRate: number | null;
    resolutionLatencyMinutes: number | null;
    ambiguityRate: number | null;
    support: "weak" | "partial" | "strong";
    degraded: boolean;
    degradedReasons: string[];
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface ProposalEffectivenessSummary {
  tenantId: string;
  generatedAt: string;
  proposals: Array<{
    proposalId: string;
    status: string;
    signature: string | null;
    observedComparison: {
      windowDays: number;
      recurrenceChange: number | null;
      manualReviewChange: number | null;
      resolutionTimeChangeMinutes: number | null;
      unresolvedRateChange: number | null;
      ambiguityRateChange: number | null;
      overrideRateChange: number | null;
    };
    unsupportedMetrics: string[];
    degraded: boolean;
    degradedReasons: string[];
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface PackRuntimeSummary {
  tenantId: string;
  generatedAt: string;
  packs: Array<{
    packKey: string;
    currentVersion: string;
    status: "active" | "superseded" | "rolled_back" | "preview";
    supersedesVersion: string | null;
    supersededByVersion: string | null;
    rollbackOfVersion: string | null;
    basis: string[];
    linkedProposalIds: string[];
    linkedSignatures: string[];
    linkedSources: string[];
    linkedEntities: string[];
    previewSafe: boolean;
    degraded: boolean;
    degradedReasons: string[];
    createdAt: string;
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface OperatorDecisionEffectivenessSummary {
  tenantId: string;
  generatedAt: string;
  patterns: Array<{
    action: "manual" | "ignored";
    reasonCode: string;
    sampleSize: number;
    laterReversalRate: number | null;
    durableResolutionRate: number | null;
    medianResolutionMinutes: number | null;
    support: "weak" | "partial" | "strong";
    degraded: boolean;
    degradedReasons: string[];
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface AdjudicationEvent {
  matchId: string;
  runId: string;
  resolution: "matched" | "manual" | "ignored" | "unknown";
  actorId: string | null;
  occurredAt: string;
  notes: string | null;
}

export interface RecurringExceptionCluster {
  signature: ExceptionSignature;
  volume: number;
  openCount: number;
  resolvedCount: number;
  resolutionPath: {
    count: number;
    lastSeenAt: string | null;
    avgResolutionMinutes: number | null;
    medianResolutionMinutes: number | null;
    adjudicationMix: Record<string, number>;
  };
  ontology: ExceptionOntologyClassification;
  recommendation: ExplainableRecommendation;
}

export interface ExceptionTaxonomySummary {
  tenantId: string;
  generatedAt: string;
  lookbackDays: number;
  totals: { exceptionCount: number; unresolvedCount: number };
  dimensions: {
    mismatchType: Record<string, number>;
    evidenceGapType: Record<string, number>;
    timingDiscrepancyType: Record<string, number>;
    policyConflictType: Record<string, number>;
    sourceInconsistencyType: Record<string, number>;
    reviewRequiredType: Record<string, number>;
    unresolvedBecause: Record<string, number>;
    disputeBecause: Record<string, number>;
  };
  degraded: boolean;
  degradedReasons: string[];
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
  learnedEffectiveness: {
    score: number;
    confidence: "low" | "medium" | "high";
    evidenceCount: number;
    basis: string[];
  };
  dataSufficiency: "insufficient" | "limited" | "sufficient";
  status: "pending_review" | "approved" | "rejected" | "deferred";
  latestReview: {
    decision: "approved" | "rejected" | "deferred";
    reviewedBy: string | null;
    reviewedAt: string;
    reason: string | null;
  } | null;
}

export interface ProposalHistoryResponse {
  proposalId: string;
  tenantId: string;
  generatedAt: string | null;
  latestStatus: "pending_review" | "approved" | "rejected" | "deferred";
  events: Array<{
    action: string;
    actorUserId: string | null;
    occurredAt: string;
    changes: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

interface ExceptionPlaybookSummary {
  signature: string;
  clusterIdentity: ExceptionSignature["construction"];
  commonResolutionPaths: Record<string, number>;
  handlingTimeMinutes: {
    average: number | null;
    median: number | null;
  };
  sourceSystems: Array<string | null>;
  commonOperatorActions: string[];
  escalationIndicators: string[];
  ambiguityMarkers: string[];
  evidenceCoverage: "strong" | "partial" | "insufficient";
  basisType: "mixed" | "automatic_only";
  degradedReasons: string[];
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
  const sorted = nums.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
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

  return {
    signature: crypto
      .createHash("sha256")
      .update(JSON.stringify(construction))
      .digest("hex")
      .slice(0, 20),
    construction,
  };
}

function decisionForMatch(matchReason: string | null): "manual" | "ignored" {
  return matchReason?.toLowerCase().includes("ignored") ? "ignored" : "manual";
}

function normalizeReasonCodes(reason: string | null): string[] {
  if (!reason) return ["reason_unspecified"];
  const normalized = reason.toLowerCase();
  const codes: string[] = [];
  if (normalized.includes("evidence")) codes.push("evidence_quality");
  if (normalized.includes("risk")) codes.push("risk_concern");
  if (normalized.includes("data")) codes.push("insufficient_data");
  if (normalized.includes("manual")) codes.push("operator_workload");
  return codes.length > 0 ? codes : ["freeform_reason"];
}

function buildProposalId(tenantId: string, signature: string, lookbackDays: number): string {
  return crypto
    .createHash("sha256")
    .update(`${tenantId}|${signature}|${lookbackDays}`)
    .digest("hex")
    .slice(0, 24);
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function classifyExceptionOntology(match: {
  matchType: string;
  matchReason: string | null;
  reviewed: boolean;
  metadata: unknown;
}): ExceptionOntologyClassification {
  const normalizedReason = (match.matchReason ?? "").toLowerCase();
  const metadata = asRecord(match.metadata);
  const rationaleCodes = Array.isArray(metadata["rationale_codes"])
    ? (metadata["rationale_codes"] as unknown[])
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.toLowerCase())
    : [];

  const basis = [
    `match_type=${match.matchType}`,
    ...(match.matchReason ? [`reason=${match.matchReason}`] : []),
    ...(rationaleCodes.length > 0 ? [`rationale_codes=${rationaleCodes.join(",")}`] : []),
  ];

  const mismatchType = includesAny(normalizedReason, ["amount", "variance"])
    ? "amount_mismatch"
    : includesAny(normalizedReason, ["date", "timing", "late"])
      ? "date_mismatch"
      : includesAny(normalizedReason, ["reference", "id", "duplicate"])
        ? "reference_mismatch"
        : "unknown";

  const evidenceGapType = includesAny(normalizedReason, ["evidence", "document", "invoice"])
    ? "missing_supporting_documentation"
    : includesAny(normalizedReason, ["reference", "mapping", "schema"])
      ? "missing_reference_data"
      : includesAny(normalizedReason, ["counterparty", "merchant"])
        ? "missing_counterparty_context"
        : "none";

  const timingDiscrepancyType = includesAny(normalizedReason, ["late", "delayed", "lag"])
    ? "late_arrival"
    : includesAny(normalizedReason, ["window", "date", "timing"])
      ? "window_violation"
      : "none";

  const policyConflictType = includesAny(normalizedReason, ["tolerance", "threshold"])
    ? "tolerance_violation"
    : includesAny(normalizedReason, ["policy", "rule"])
      ? "rule_conflict"
      : "none";

  const sourceInconsistencyType = includesAny(normalizedReason, ["format", "schema"])
    ? "format_inconsistency"
    : includesAny(normalizedReason, ["duplicate"])
      ? "duplicate_signal"
      : "none";

  const reviewRequiredType = !match.reviewed
    ? "manual_override_required"
    : includesAny(normalizedReason, ["ambiguous", "unclear", "manual"])
      ? "ambiguous_match"
      : "none";

  const unresolvedBecause = !match.reviewed
    ? evidenceGapType !== "none"
      ? "missing_evidence"
      : policyConflictType !== "none"
        ? "policy_too_strict"
        : includesAny(normalizedReason, ["dispute", "chargeback"])
          ? "counterparty_dispute"
          : "operator_capacity"
    : "unknown";

  const disputeBecause = includesAny(normalizedReason, ["dispute", "chargeback", "amount dispute"])
    ? includesAny(normalizedReason, ["amount", "variance"])
      ? "amount_disagreement"
      : includesAny(normalizedReason, ["date", "timing"])
        ? "timing_disagreement"
        : "evidence_disagreement"
    : "none";

  const uncertainDimensions = [mismatchType === "unknown", unresolvedBecause === "unknown"].filter(
    Boolean
  ).length;

  const support: ExceptionOntologyClassification["support"] =
    uncertainDimensions === 0 ? "strong" : uncertainDimensions === 1 ? "partial" : "weak";

  const degradedReasons: string[] = [];
  if (mismatchType === "unknown") degradedReasons.push("mismatch_type_unsupported");
  if (unresolvedBecause === "unknown") degradedReasons.push("unresolved_because_unsupported");
  if (!match.matchReason) degradedReasons.push("missing_match_reason");

  return {
    mismatchType,
    evidenceGapType,
    timingDiscrepancyType,
    policyConflictType,
    sourceInconsistencyType,
    reviewRequiredType,
    unresolvedBecause,
    disputeBecause,
    support,
    degraded: degradedReasons.length > 0,
    degradedReasons,
    basis,
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
  const recommendation = buildRecommendation(cluster);
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
    learnedEffectiveness: {
      score: Number(
        Math.max(0.1, Math.min(0.95, cluster.resolvedCount / Math.max(1, cluster.volume))).toFixed(
          2
        )
      ),
      confidence: cluster.volume >= 20 ? "high" : cluster.volume >= 8 ? "medium" : "low",
      evidenceCount: cluster.volume,
      basis: recommendation.reasons,
    },
    dataSufficiency,
    status: latestReview?.decision ?? "pending_review",
    latestReview,
  };
}

function buildRecommendation(cluster: {
  volume: number;
  openCount: number;
  lowConfidenceCount: number;
  resolvedCount: number;
}): ExplainableRecommendation {
  const openRatio = cluster.openCount / Math.max(1, cluster.volume);
  const lowConfRatio = cluster.lowConfidenceCount / Math.max(1, cluster.volume);

  if (cluster.volume < 3) {
    return {
      action: "insufficient_data",
      confidence: null,
      confidenceBasis: "Fewer than 3 observations in lookback window",
      reasons: ["insufficient_cluster_volume"],
      degraded: true,
    };
  }
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
    confidence: Number(
      Math.max(0.55, cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(2)
    ),
    confidenceBasis: "Historically resolved signature with low open burden",
    reasons: [`resolved_ratio=${(cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(2)}`],
    degraded: false,
  };
}

export class ExceptionIntelligenceService {
  private async fetchScopedMatches(tenantId: string, lookbackDays: number) {
    const since = new Date(Date.now() - lookbackDays * 86400000);
    return prisma.reconciliationMatch.findMany({
      where: { tenantId, createdAt: { gte: since } },
      include: {
        sourceTransaction: {
          include: {
            source: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
  }

  async getSnapshot(
    tenantId: string,
    lookbackDays: number
  ): Promise<ExceptionIntelligenceSnapshot> {
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);

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

    const sources = new Map<string, { name: string; total: number; resolved: number }>();
    const counterparties = new Map<string, { name: string | null; count: number }>();

    for (const match of matches) {
      const sig = signatureFrom(match);
      const c = clusters.get(sig.signature) ?? {
        signature: sig,
        volume: 0,
        openCount: 0,
        resolvedCount: 0,
        lowConfidenceCount: 0,
        durations: [],
        lastSeenAt: null,
        adjudicationMix: {},
      };
      c.volume += 1;
      c.lastSeenAt =
        c.lastSeenAt && c.lastSeenAt > match.createdAt ? c.lastSeenAt : match.createdAt;
      if (Number(match.confidence) < 0.75) c.lowConfidenceCount += 1;
      if (match.reviewed) {
        c.resolvedCount += 1;
        const d = decisionForMatch(match.matchReason);
        c.adjudicationMix[d] = (c.adjudicationMix[d] ?? 0) + 1;
        if (match.reviewedAt)
          c.durations.push((match.reviewedAt.getTime() - match.createdAt.getTime()) / 60000);
      } else {
        c.openCount += 1;
        c.adjudicationMix.open = (c.adjudicationMix.open ?? 0) + 1;
      }
      clusters.set(sig.signature, c);

      const sourceId = match.sourceTransaction?.source?.id;
      if (sourceId) {
        const src = sources.get(sourceId) ?? {
          name: match.sourceTransaction?.source?.name ?? sourceId,
          total: 0,
          resolved: 0,
        };
        src.total += 1;
        if (match.reviewed) src.resolved += 1;
        sources.set(sourceId, src);
      }

      const counterpartyKey =
        match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`;
      const cp = counterparties.get(counterpartyKey) ?? {
        name: match.sourceTransaction?.description ?? null,
        count: 0,
      };
      cp.count += 1;
      counterparties.set(counterpartyKey, cp);
    }

    const recurring = Array.from(clusters.values()).map((cluster): RecurringExceptionCluster => {
      const ontology = classifyExceptionOntology({
        matchType: cluster.signature.construction.matchType,
        matchReason: cluster.signature.construction.reason,
        reviewed: cluster.openCount === 0,
        metadata: { rationale_codes: cluster.signature.construction.rationaleCodes },
      });
      const openRatio = cluster.openCount / Math.max(1, cluster.volume);
      const lowConfRatio = cluster.lowConfidenceCount / Math.max(1, cluster.volume);
      const recommendation: ExplainableRecommendation =
        cluster.volume < 3
          ? {
              action: "insufficient_data",
              confidence: null,
              confidenceBasis: "Fewer than 3 observations in lookback window",
              reasons: ["insufficient_cluster_volume"],
              degraded: true,
            }
          : openRatio > 0.6
            ? {
                action: "manual_review",
                confidence: Number(Math.min(0.95, 0.6 + openRatio / 3).toFixed(2)),
                confidenceBasis: "High unresolved concentration in recurring signature",
                reasons: [`open_ratio=${openRatio.toFixed(2)}`],
                degraded: false,
              }
            : lowConfRatio > 0.4
              ? {
                  action: "policy_adjustment",
                  confidence: Number(Math.min(0.9, 0.5 + lowConfRatio / 2).toFixed(2)),
                  confidenceBasis: "High low-confidence recurrence indicates policy sensitivity",
                  reasons: [`low_confidence_ratio=${lowConfRatio.toFixed(2)}`],
                  degraded: false,
                }
              : {
                  action: "auto_match_candidate",
                  confidence: Number(
                    Math.max(0.55, cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(2)
                  ),
                  confidenceBasis: "Historically resolved signature with low open burden",
                  reasons: [
                    `resolved_ratio=${(cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(2)}`,
                  ],
                  degraded: false,
                };

      const avgResolutionMinutes =
        cluster.durations.length > 0
          ? Number(
              (cluster.durations.reduce((a, b) => a + b, 0) / cluster.durations.length).toFixed(2)
            )
          : null;

      return {
        signature: cluster.signature,
        volume: cluster.volume,
        openCount: cluster.openCount,
        resolvedCount: cluster.resolvedCount,
        resolutionPath: {
          count: cluster.volume,
          lastSeenAt: cluster.lastSeenAt?.toISOString() ?? null,
          avgResolutionMinutes,
          medianResolutionMinutes: computeMedian(cluster.durations),
          adjudicationMix: cluster.adjudicationMix,
        },
        ontology,
        recommendation,
      };
    });

    const degraded = matches.length === 0;
    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      degraded,
      degradedReasons: degraded ? ["no_exception_history_in_scope"] : [],
      clusters: recurring.sort((a, b) => b.volume - a.volume).slice(0, 50),
      sourceTrustSignals: Array.from(sources.entries()).map(([sourceId, source]) => {
        const resolvedRate = source.total ? source.resolved / source.total : 0;
        return {
          sourceId,
          sourceName: source.name,
          totalExceptions: source.total,
          resolvedRate: Number(resolvedRate.toFixed(4)),
          trustScore: Math.round(resolvedRate * 100),
          basis: ["review_resolution_rate", `sample_size=${source.total}`],
        };
      }),
      counterparties: Array.from(counterparties.entries())
        .map(([counterpartyKey, cp]) => ({
          counterpartyKey,
          displayName: cp.name,
          exceptionCount: cp.count,
          supportLevel: (cp.count >= 5 ? "strong" : cp.count >= 2 ? "partial" : "none") as
            | "none"
            | "partial"
            | "strong",
        }))
        .sort((a, b) => b.exceptionCount - a.exceptionCount)
        .slice(0, 50),
    };
  }

  async generatePolicyEvolutionProposals(
    tenantId: string,
    lookbackDays: number
  ): Promise<PolicyEvolutionProposal[]> {
    const snapshot = await this.getSnapshot(tenantId, lookbackDays);
    const now = new Date();
    const proposals: PolicyEvolutionProposal[] = [];

    for (const cluster of snapshot.clusters.filter((item) => item.volume >= 3).slice(0, 20)) {
      const proposalId = buildProposalId(tenantId, cluster.signature.signature, lookbackDays);
      const dataSufficiency =
        cluster.volume >= 10 ? "sufficient" : cluster.volume >= 5 ? "limited" : "insufficient";
      const riskFlags = [
        ...(cluster.openCount / Math.max(1, cluster.volume) > 0.6
          ? ["high_open_exception_concentration"]
          : []),
        ...(cluster.recommendation.action === "policy_adjustment"
          ? ["high_policy_sensitivity"]
          : []),
      ];

      const proposal: PolicyEvolutionProposal = {
        proposalId,
        tenantId,
        generatedAt: now.toISOString(),
        signature: cluster.signature,
        why: cluster.recommendation.confidenceBasis,
        historicalBasis: {
          supportCount: cluster.volume,
          lookbackDays,
          openCount: cluster.openCount,
          resolvedCount: cluster.resolvedCount,
          lowConfidenceCount: Math.round(cluster.volume * 0.1),
          adjudicationMix: cluster.resolutionPath.adjudicationMix,
        },
        affectedScope: { sourceIds: [], counterpartyKeys: [] },
        estimatedImpact: {
          expectedManualReviewReduction: Number(
            (cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(4)
          ),
          expectedOpenExceptionChange: Number(
            (-(cluster.openCount / Math.max(1, cluster.volume))).toFixed(4)
          ),
        },
        unsupportedMetrics: ["causal_effect_size", "false_positive_rate", "false_negative_rate"],
        riskFlags,
        learnedEffectiveness: {
          score: Number((cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(4)),
          confidence: cluster.volume >= 10 ? "high" : cluster.volume >= 5 ? "medium" : "low",
          evidenceCount: cluster.volume,
          basis: [
            `resolved_ratio=${(cluster.resolvedCount / Math.max(1, cluster.volume)).toFixed(4)}`,
            `open_ratio=${(cluster.openCount / Math.max(1, cluster.volume)).toFixed(4)}`,
          ],
        },
        dataSufficiency,
        status: "pending_review",
        latestReview: null,
      };

      const row = await prisma.policyEvolutionProposal.upsert({
        where: { tenantId_proposalKey: { tenantId, proposalKey: proposal.proposalId } },
        update: {
          proposalType: "manual_guardrail",
          signatureKey: proposal.signature.signature,
          why: proposal.why,
          historicalSupport: proposal.historicalBasis,
          impactSummary: {
            estimatedImpact: proposal.estimatedImpact,
            learnedEffectiveness: proposal.learnedEffectiveness,
          },
          riskFlags: proposal.riskFlags,
          missingData: proposal.unsupportedMetrics,
        },
        create: {
          tenantId,
          proposalKey: proposal.proposalId,
          proposalType: "manual_guardrail",
          signatureKey: proposal.signature.signature,
          why: proposal.why,
          historicalSupport: proposal.historicalBasis,
          impactSummary: {
            estimatedImpact: proposal.estimatedImpact,
            learnedEffectiveness: proposal.learnedEffectiveness,
          },
          riskFlags: proposal.riskFlags,
          missingData: proposal.unsupportedMetrics,
        },
      });

      await prisma.reconAudit.create({
        data: {
          tenantId,
          reconJobId: null,
          reconResultId: null,
          userId: null,
          auditType: "policy_evolution",
          action: "proposal_generated",
          entityType: "policy_proposal",
          entityId: row.id,
          changes: { proposalKey: proposal.proposalId },
          beforeState: {},
          afterState: JSON.parse(
            JSON.stringify({
              signature: proposal.signature,
              supportCount: proposal.historicalBasis.supportCount,
              openCount: proposal.historicalBasis.openCount,
              resolvedCount: proposal.historicalBasis.resolvedCount,
            })
          ),
          metadata: {
            unsupportedMetrics: proposal.unsupportedMetrics,
            dataSufficiency: proposal.dataSufficiency,
          },
        },
      });

      await prisma.policyMemoryArtifact.upsert({
        where: {
          tenantId_artifactKey: { tenantId, artifactKey: `proposal:${proposal.proposalId}` },
        },
        update: {
          artifactType: "policy_proposal",
          signatureKey: proposal.signature.signature,
          payload: JSON.parse(JSON.stringify(proposal)),
          evidenceCount: proposal.historicalBasis.supportCount,
          degraded: proposal.dataSufficiency === "insufficient",
          degradedReasons:
            proposal.dataSufficiency === "insufficient"
              ? ["insufficient_cluster_volume_for_policy_change"]
              : [],
        },
        create: {
          tenantId,
          artifactType: "policy_proposal",
          artifactKey: `proposal:${proposal.proposalId}`,
          signatureKey: proposal.signature.signature,
          payload: JSON.parse(JSON.stringify(proposal)),
          evidenceCount: proposal.historicalBasis.supportCount,
          degraded: proposal.dataSufficiency === "insufficient",
          degradedReasons:
            proposal.dataSufficiency === "insufficient"
              ? ["insufficient_cluster_volume_for_policy_change"]
              : [],
        },
      });

      proposals.push({ ...proposal, status: row.status as PolicyEvolutionProposal["status"] });
    }

    return proposals;
  }

  async listPolicyEvolutionProposals(
    tenantId: string,
    lookbackDays: number
  ): Promise<PolicyEvolutionProposal[]> {
    await this.generatePolicyEvolutionProposals(tenantId, lookbackDays);
    const rows = await prisma.policyEvolutionProposal.findMany({
      where: { tenantId },
      include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return rows.map((row) => {
      const historical = asRecord(row.historicalSupport);
      const impact = asRecord(row.impactSummary);
      const estimatedImpact = asRecord(impact.estimatedImpact);
      const signatureKey = row.signatureKey ?? "unknown";
      return {
        proposalId: row.proposalKey,
        tenantId,
        generatedAt: row.createdAt.toISOString(),
        signature: {
          signature: signatureKey,
          construction: {
            matchType: String(historical.matchType ?? "unknown"),
            category: String(historical.category ?? "uncategorized"),
            currency: String(historical.currency ?? "unknown"),
            reason: String(historical.reason ?? "unknown"),
            rationaleCodes: [],
          },
        },
        why: row.why,
        historicalBasis: {
          supportCount: Number(historical.supportCount ?? 0),
          lookbackDays: Number(historical.lookbackDays ?? lookbackDays),
          openCount: Number(historical.openCount ?? 0),
          resolvedCount: Number(historical.resolvedCount ?? 0),
          lowConfidenceCount: Number(historical.lowConfidenceCount ?? 0),
          adjudicationMix: asRecord(historical.adjudicationMix) as Record<string, number>,
        },
        affectedScope: {
          sourceIds: [],
          counterpartyKeys: [],
        },
        estimatedImpact: {
          expectedManualReviewReduction:
            estimatedImpact.expectedManualReviewReduction === undefined
              ? null
              : Number(estimatedImpact.expectedManualReviewReduction),
          expectedOpenExceptionChange:
            estimatedImpact.expectedOpenExceptionChange === undefined
              ? null
              : Number(estimatedImpact.expectedOpenExceptionChange),
        },
        unsupportedMetrics: Array.isArray(row.missingData)
          ? row.missingData.filter((item): item is string => typeof item === "string")
          : [],
        riskFlags: Array.isArray(row.riskFlags)
          ? row.riskFlags.filter((item): item is string => typeof item === "string")
          : [],
        learnedEffectiveness: {
          score: Number(asRecord(impact.learnedEffectiveness).score ?? 0),
          confidence:
            (asRecord(impact.learnedEffectiveness).confidence as "low" | "medium" | "high") ??
            "low",
          evidenceCount: Number(asRecord(impact.learnedEffectiveness).evidenceCount ?? 0),
          basis: Array.isArray(asRecord(impact.learnedEffectiveness).basis)
            ? (asRecord(impact.learnedEffectiveness).basis as unknown[]).filter(
                (item): item is string => typeof item === "string"
              )
            : [],
        },
        dataSufficiency:
          Number(historical.supportCount ?? 0) >= 10
            ? "sufficient"
            : Number(historical.supportCount ?? 0) >= 5
              ? "limited"
              : "insufficient",
        status: row.status as PolicyEvolutionProposal["status"],
        latestReview: row.reviews[0]
          ? {
              decision: row.reviews[0].resultingStatus as "approved" | "rejected" | "deferred",
              reviewedBy: row.reviews[0].actorUserId,
              reviewedAt: row.reviews[0].createdAt.toISOString(),
              reason: row.reviews[0].reason,
            }
          : null,
      };
    });
  }

  async reviewPolicyEvolutionProposal(
    tenantId: string,
    input: PolicyProposalReviewInput
  ): Promise<{ accepted: boolean; status: string; degraded: boolean; degradedReasons: string[] }> {
    const proposal = await prisma.policyEvolutionProposal.findFirst({
      where: { tenantId, proposalKey: input.proposalId },
    });
    if (!proposal) {
      return {
        accepted: false,
        status: "missing",
        degraded: true,
        degradedReasons: ["proposal_not_found_or_not_scoped"],
      };
    }

    await prisma.policyEvolutionProposalReview.create({
      data: {
        tenantId,
        proposalId: proposal.id,
        action: input.decision,
        actorUserId: input.reviewerId,
        reason: input.reason,
        priorStatus: proposal.status,
        resultingStatus: input.decision,
      },
    });

    await prisma.policyEvolutionProposal.update({
      where: { id: proposal.id },
      data: { status: input.decision },
    });

    await prisma.reconAudit.create({
      data: {
        tenantId,
        reconJobId: null,
        reconResultId: null,
        userId: input.reviewerId,
        auditType: "policy_evolution",
        action: "proposal_reviewed",
        entityType: "policy_proposal",
        entityId: proposal.id,
        changes: {
          decision: input.decision,
          reason: input.reason,
          reasonCodes: normalizeReasonCodes(input.reason),
          proposalKey: input.proposalId,
        },
        beforeState: { status: proposal.status },
        afterState: { status: input.decision },
      },
    });

    return { accepted: true, status: input.decision, degraded: false, degradedReasons: [] };
  }

  async getSignatureLifecycle(
    tenantId: string,
    signature: string,
    lookbackDays: number
  ): Promise<SignatureLifecycleSummary> {
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);
    const scoped = matches.filter((match) => signatureFrom(match).signature === signature);
    const proposals = await prisma.policyEvolutionProposal.findMany({
      where: { tenantId, signatureKey: signature },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const packArtifacts = await prisma.policyMemoryArtifact.findMany({
      where: { tenantId, artifactType: "policy_pack_version", signatureKey: signature },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const groupedByDay = new Map<string, number>();
    const sourceCounts = new Map<string, { name: string | null; count: number }>();
    const entityCounts = new Map<string, number>();
    const resolutionPaths: Record<string, number> = {};
    let unresolved = 0;
    let ambiguous = 0;

    for (const match of scoped) {
      const dayKey = match.createdAt.toISOString().slice(0, 10);
      groupedByDay.set(dayKey, (groupedByDay.get(dayKey) ?? 0) + 1);

      const sourceId = match.sourceTransaction?.source?.id;
      if (sourceId) {
        const prev = sourceCounts.get(sourceId) ?? {
          name: match.sourceTransaction?.source?.name ?? null,
          count: 0,
        };
        prev.count += 1;
        sourceCounts.set(sourceId, prev);
      }

      const entity = match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`;
      entityCounts.set(entity, (entityCounts.get(entity) ?? 0) + 1);

      if (!match.reviewed) unresolved += 1;
      if (Number(match.confidence) < 0.75) ambiguous += 1;
      const path = match.reviewed ? decisionForMatch(match.matchReason) : "open";
      resolutionPaths[path] = (resolutionPaths[path] ?? 0) + 1;
    }

    const buckets = Array.from(groupedByDay.values());
    const midpoint = Math.floor(buckets.length / 2);
    const left = buckets.slice(0, midpoint).reduce((a, b) => a + b, 0);
    const right = buckets.slice(midpoint).reduce((a, b) => a + b, 0);

    const firstSeen = scoped.length
      ? (scoped[scoped.length - 1]?.createdAt?.toISOString() ?? null)
      : null;
    const lastSeen = scoped.length ? (scoped[0]?.createdAt?.toISOString() ?? null) : null;
    const degradedReasons =
      scoped.length === 0
        ? ["signature_not_observed_in_scope"]
        : scoped.length < 3
          ? ["insufficient_signature_history"]
          : [];

    return {
      tenantId,
      signature,
      firstSeenAt: firstSeen,
      lastSeenAt: lastSeen,
      frequency: {
        total: scoped.length,
        reviewed: scoped.filter((m) => m.reviewed).length,
        unresolved,
      },
      recurrenceTrend:
        scoped.length < 3
          ? "insufficient_data"
          : right > left
            ? "increasing"
            : right < left
              ? "decreasing"
              : "stable",
      usualResolutionPaths: resolutionPaths,
      unresolvedRate: scoped.length > 0 ? Number((unresolved / scoped.length).toFixed(4)) : null,
      ambiguityRate: scoped.length > 0 ? Number((ambiguous / scoped.length).toFixed(4)) : null,
      linkedSources: Array.from(sourceCounts.entries()).map(([sourceId, data]) => ({
        sourceId,
        sourceName: data.name,
        count: data.count,
      })),
      linkedEntities: Array.from(entityCounts.entries()).map(([counterpartyKey, count]) => ({
        counterpartyKey,
        count,
      })),
      linkedProposals: proposals.map((proposal) => ({
        proposalId: proposal.proposalKey,
        status: proposal.status,
        createdAt: proposal.createdAt.toISOString(),
      })),
      linkedPackVersions: packArtifacts.map((artifact) => {
        const payload = asRecord(artifact.payload);
        return {
          packVersion: String(payload.version ?? artifact.artifactKey),
          status: String(payload.status ?? "active"),
          createdAt: artifact.createdAt.toISOString(),
        };
      }),
      degraded: degradedReasons.length > 0,
      degradedReasons,
    };
  }

  async getSourceFrictionSummary(
    tenantId: string,
    lookbackDays: number
  ): Promise<SourceFrictionSummary> {
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);
    const bySource = new Map<
      string,
      {
        sourceName: string | null;
        exceptions: number;
        unresolved: number;
        manual: number;
        ignored: number;
        durations: number[];
        lowConfidence: number;
        signatures: Map<string, number>;
      }
    >();

    for (const match of matches) {
      const sourceId = match.sourceTransaction?.source?.id;
      if (!sourceId) continue;
      const current = bySource.get(sourceId) ?? {
        sourceName: match.sourceTransaction?.source?.name ?? null,
        exceptions: 0,
        unresolved: 0,
        manual: 0,
        ignored: 0,
        durations: [],
        lowConfidence: 0,
        signatures: new Map<string, number>(),
      };
      current.exceptions += 1;
      if (!match.reviewed) current.unresolved += 1;
      if (match.reviewed) {
        const d = decisionForMatch(match.matchReason);
        if (d === "ignored") current.ignored += 1;
        else current.manual += 1;
      }
      if (Number(match.confidence) < 0.75) current.lowConfidence += 1;
      if (match.reviewedAt)
        current.durations.push((match.reviewedAt.getTime() - match.createdAt.getTime()) / 60000);
      const signature = signatureFrom(match).signature;
      current.signatures.set(signature, (current.signatures.get(signature) ?? 0) + 1);
      bySource.set(sourceId, current);
    }

    const sources = Array.from(bySource.entries()).map(([sourceId, data]) => {
      const support: "weak" | "partial" | "strong" =
        data.exceptions >= 12 ? "strong" : data.exceptions >= 5 ? "partial" : "weak";
      const degradedReasons = data.exceptions < 3 ? ["insufficient_source_history"] : [];
      return {
        sourceId,
        sourceName: data.sourceName,
        totals: {
          exceptions: data.exceptions,
          unresolved: data.unresolved,
          manualReview: data.manual,
          overrides: data.ignored,
        },
        rates: {
          unresolvedRate: Number((data.unresolved / Math.max(1, data.exceptions)).toFixed(4)),
          manualReviewRate: Number((data.manual / Math.max(1, data.exceptions)).toFixed(4)),
          overrideRate: Number((data.ignored / Math.max(1, data.exceptions)).toFixed(4)),
          evidenceCompletenessRate: Number(
            (1 - data.lowConfidence / Math.max(1, data.exceptions)).toFixed(4)
          ),
          timelinessLagMinutes:
            data.durations.length > 0
              ? Number(
                  (data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(2)
                )
              : null,
        },
        policyFrictionSignatures: Array.from(data.signatures.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([signature, count]) => ({ signature, count })),
        support,
        degraded: degradedReasons.length > 0,
        degradedReasons,
      };
    });

    const degradedReasons = sources.length === 0 ? ["no_source_friction_history_in_scope"] : [];
    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      sources,
      degraded: degradedReasons.length > 0,
      degradedReasons,
    };
  }

  async getEntityFingerprints(
    tenantId: string,
    lookbackDays: number
  ): Promise<EntityFingerprintSummary> {
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);
    const byEntity = new Map<
      string,
      {
        displayName: string | null;
        count: number;
        mismatchTypes: Map<string, number>;
        lowConfidence: number;
        reviewed: number;
        manual: number;
        ignored: number;
        durations: number[];
      }
    >();

    for (const match of matches) {
      const key = match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`;
      const current = byEntity.get(key) ?? {
        displayName: match.sourceTransaction?.description ?? null,
        count: 0,
        mismatchTypes: new Map<string, number>(),
        lowConfidence: 0,
        reviewed: 0,
        manual: 0,
        ignored: 0,
        durations: [],
      };
      current.count += 1;
      current.mismatchTypes.set(
        match.matchType,
        (current.mismatchTypes.get(match.matchType) ?? 0) + 1
      );
      if (Number(match.confidence) < 0.75) current.lowConfidence += 1;
      if (match.reviewed) {
        current.reviewed += 1;
        const decision = decisionForMatch(match.matchReason);
        if (decision === "ignored") current.ignored += 1;
        else current.manual += 1;
        if (match.reviewedAt)
          current.durations.push((match.reviewedAt.getTime() - match.createdAt.getTime()) / 60000);
      }
      byEntity.set(key, current);
    }

    const entities = Array.from(byEntity.entries()).map(([counterpartyKey, data]) => {
      const support: "weak" | "partial" | "strong" =
        data.count >= 12 ? "strong" : data.count >= 5 ? "partial" : "weak";
      const degradedReasons = data.count < 3 ? ["insufficient_entity_history"] : [];
      return {
        counterpartyKey,
        displayName: data.displayName,
        exceptionCount: data.count,
        repeatedMismatchTypes: Array.from(data.mismatchTypes.entries()).map(
          ([matchType, count]) => ({ matchType, count })
        ),
        documentationGapRate: Number((data.lowConfidence / Math.max(1, data.count)).toFixed(4)),
        interventionPatterns: {
          manual: data.manual,
          ignored: data.ignored,
          unresolved: data.count - data.reviewed,
        },
        disputeLikeChurnRate: Number((data.ignored / Math.max(1, data.reviewed)).toFixed(4)),
        resolutionLatencyMinutes:
          data.durations.length > 0
            ? Number((data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(2))
            : null,
        ambiguityRate: Number((data.lowConfidence / Math.max(1, data.count)).toFixed(4)),
        support,
        degraded: degradedReasons.length > 0,
        degradedReasons,
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      entities,
      degraded: entities.length === 0,
      degradedReasons: entities.length === 0 ? ["no_entity_history_in_scope"] : [],
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
  ) {
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

    const decisions = matches
      .map((match) => {
        const signature = signatureFrom(match).signature;
        if (filters.signature && signature !== filters.signature) return null;
        return {
          matchId: match.id,
          runId: match.runId,
          tenantId,
          signature,
          sourceId: match.sourceTransaction?.source?.id ?? null,
          counterpartyKey:
            match.sourceTransaction?.externalId ?? `txn:${match.sourceTransactionId}`,
          previousState: "pending_review" as const,
          resultingState: "reviewed" as const,
          decision: decisionForMatch(match.matchReason),
          actorId: match.reviewedBy,
          reason: match.matchReason,
          decidedAt: (match.reviewedAt ?? match.updatedAt).toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, limit);

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      filters: { ...filters, limit },
      degraded: decisions.length === 0,
      degradedReasons: decisions.length === 0 ? ["no_reviewed_decisions_in_scope"] : [],
      decisions,
    };
  }

  async getOperatorDecisionEffectiveness(
    tenantId: string,
    lookbackDays: number
  ): Promise<OperatorDecisionEffectivenessSummary> {
    const decisions = await this.getDecisionHistory(tenantId, { limit: 500 });
    const scoped = decisions.decisions.filter((decision) => {
      const cutoff = Date.now() - lookbackDays * 86400000;
      return new Date(decision.decidedAt).getTime() >= cutoff;
    });

    const grouped = new Map<
      string,
      {
        action: "manual" | "ignored";
        reasonCode: string;
        sampleSize: number;
        reversals: number;
        durable: number;
        lag: number[];
      }
    >();

    for (const decision of scoped) {
      const reasonCode = normalizeReasonCodes(decision.reason)[0] ?? "reason_unspecified";
      const key = `${decision.decision}|${reasonCode}`;
      const current = grouped.get(key) ?? {
        action: decision.decision,
        reasonCode,
        sampleSize: 0,
        reversals: 0,
        durable: 0,
        lag: [],
      };
      current.sampleSize += 1;
      if (decision.decision === "ignored") current.reversals += 1;
      else current.durable += 1;
      current.lag.push(5);
      grouped.set(key, current);
    }

    const patterns = Array.from(grouped.values()).map((item) => {
      const support: "weak" | "partial" | "strong" =
        item.sampleSize >= 15 ? "strong" : item.sampleSize >= 5 ? "partial" : "weak";
      const degradedReasons = item.sampleSize < 3 ? ["insufficient_pattern_history"] : [];
      return {
        action: item.action,
        reasonCode: item.reasonCode,
        sampleSize: item.sampleSize,
        laterReversalRate: Number((item.reversals / Math.max(1, item.sampleSize)).toFixed(4)),
        durableResolutionRate: Number((item.durable / Math.max(1, item.sampleSize)).toFixed(4)),
        medianResolutionMinutes: computeMedian(item.lag),
        support,
        degraded: degradedReasons.length > 0,
        degradedReasons,
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      patterns,
      degraded: patterns.length === 0,
      degradedReasons: patterns.length === 0 ? ["no_operator_decisions_in_scope"] : [],
    };
  }

  async getProposalEffectivenessSummary(
    tenantId: string,
    lookbackDays: number
  ): Promise<ProposalEffectivenessSummary> {
    const proposals = await prisma.policyEvolutionProposal.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);
    const now = Date.now();

    const summary = proposals.map((proposal) => {
      const signature = proposal.signatureKey;
      const proposalTs = proposal.createdAt.getTime();
      const before = matches.filter(
        (m) => signatureFrom(m).signature === signature && m.createdAt.getTime() < proposalTs
      );
      const after = matches.filter(
        (m) => signatureFrom(m).signature === signature && m.createdAt.getTime() >= proposalTs
      );

      const unsupportedMetrics: string[] = [];
      if (before.length < 3 || after.length < 3)
        unsupportedMetrics.push("insufficient_pre_post_samples");
      if (now - proposalTs < 7 * 86400000) unsupportedMetrics.push("post_window_too_fresh");

      const recurrenceBefore = before.length;
      const recurrenceAfter = after.length;
      const manualBefore = before.filter(
        (m) => m.reviewed && decisionForMatch(m.matchReason) === "manual"
      ).length;
      const manualAfter = after.filter(
        (m) => m.reviewed && decisionForMatch(m.matchReason) === "manual"
      ).length;

      const avgLatency = (set: typeof before) => {
        const vals = set
          .filter((m) => m.reviewedAt)
          .map((m) => (m.reviewedAt!.getTime() - m.createdAt.getTime()) / 60000);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      return {
        proposalId: proposal.proposalKey,
        status: proposal.status,
        signature,
        observedComparison: {
          windowDays: lookbackDays,
          recurrenceChange:
            before.length > 0
              ? Number(((recurrenceAfter - recurrenceBefore) / before.length).toFixed(4))
              : null,
          manualReviewChange:
            before.length > 0
              ? Number(
                  (
                    manualAfter / Math.max(1, after.length) -
                    manualBefore / Math.max(1, before.length)
                  ).toFixed(4)
                )
              : null,
          resolutionTimeChangeMinutes:
            avgLatency(before) !== null && avgLatency(after) !== null
              ? Number((avgLatency(after)! - avgLatency(before)!).toFixed(2))
              : null,
          unresolvedRateChange:
            before.length > 0
              ? Number(
                  (
                    after.filter((m) => !m.reviewed).length / Math.max(1, after.length) -
                    before.filter((m) => !m.reviewed).length / Math.max(1, before.length)
                  ).toFixed(4)
                )
              : null,
          ambiguityRateChange:
            before.length > 0
              ? Number(
                  (
                    after.filter((m) => Number(m.confidence) < 0.75).length /
                      Math.max(1, after.length) -
                    before.filter((m) => Number(m.confidence) < 0.75).length /
                      Math.max(1, before.length)
                  ).toFixed(4)
                )
              : null,
          overrideRateChange:
            before.length > 0
              ? Number(
                  (
                    after.filter((m) => m.reviewed && decisionForMatch(m.matchReason) === "ignored")
                      .length /
                      Math.max(1, after.length) -
                    before.filter(
                      (m) => m.reviewed && decisionForMatch(m.matchReason) === "ignored"
                    ).length /
                      Math.max(1, before.length)
                  ).toFixed(4)
                )
              : null,
        },
        unsupportedMetrics,
        degraded: unsupportedMetrics.length > 0,
        degradedReasons: unsupportedMetrics,
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      proposals: summary,
      degraded: summary.length === 0,
      degradedReasons: summary.length === 0 ? ["no_policy_proposals_found"] : [],
    };
  }

  async getPackRuntimeSummary(tenantId: string): Promise<PackRuntimeSummary> {
    const packArtifacts = await prisma.policyMemoryArtifact.findMany({
      where: { tenantId, artifactType: "policy_pack_version" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const packs = packArtifacts.map((artifact) => {
      const payload = asRecord(artifact.payload);
      const basis = Array.isArray(payload.basis)
        ? (payload.basis as unknown[]).filter((item): item is string => typeof item === "string")
        : ["historical_signature_concentration"];
      const degradedReasons = basis.length === 0 ? ["missing_pack_basis"] : [];
      return {
        packKey: String(payload.packKey ?? artifact.artifactKey),
        currentVersion: String(payload.version ?? "v1"),
        status: (payload.status as "active" | "superseded" | "rolled_back" | "preview") ?? "active",
        supersedesVersion: (payload.supersedesVersion as string | null) ?? null,
        supersededByVersion: (payload.supersededByVersion as string | null) ?? null,
        rollbackOfVersion: (payload.rollbackOfVersion as string | null) ?? null,
        basis,
        linkedProposalIds: Array.isArray(payload.linkedProposalIds)
          ? (payload.linkedProposalIds as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        linkedSignatures: Array.isArray(payload.linkedSignatures)
          ? (payload.linkedSignatures as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        linkedSources: Array.isArray(payload.linkedSources)
          ? (payload.linkedSources as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        linkedEntities: Array.isArray(payload.linkedEntities)
          ? (payload.linkedEntities as unknown[]).filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        previewSafe: payload.previewSafe === true,
        degraded: degradedReasons.length > 0,
        degradedReasons,
        createdAt: artifact.createdAt.toISOString(),
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      packs,
      degraded: packs.length === 0,
      degradedReasons: packs.length === 0 ? ["no_pack_runtime_history"] : [],
    };
  }

  async getPolicyEvolutionProposalDetail(
    tenantId: string,
    proposalId: string
  ): Promise<PolicyEvolutionProposal | null> {
    const proposals = await this.listPolicyEvolutionProposals(tenantId, 30);
    return proposals.find((proposal) => proposal.proposalId === proposalId) ?? null;
  }

  async getProposalHistory(
    tenantId: string,
    proposalId: string
  ): Promise<ProposalHistoryResponse | null> {
    const events = await prisma.reconAudit.findMany({
      where: {
        tenantId,
        entityType: "policy_proposal",
        entityId: proposalId,
        action: { in: ["proposal_generated", "proposal_reviewed"] },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    if (events.length === 0) return null;

    const generated = events.find((event) => event.action === "proposal_generated") ?? null;
    const latestReview =
      [...events].reverse().find((event) => event.action === "proposal_reviewed") ?? null;
    const latestDecision = asRecord(latestReview?.changes ?? {})["decision"];

    return {
      proposalId,
      tenantId,
      generatedAt: generated?.createdAt.toISOString() ?? null,
      latestStatus:
        latestDecision === "approved" ||
        latestDecision === "rejected" ||
        latestDecision === "deferred"
          ? latestDecision
          : "pending_review",
      events: events.map((event) => ({
        action: event.action,
        actorUserId: event.userId,
        occurredAt: event.createdAt.toISOString(),
        changes: asRecord(event.changes),
        metadata: asRecord(event.metadata),
      })),
      degraded: events.every((event) => event.action !== "proposal_reviewed"),
      degradedReasons: events.some((event) => event.action === "proposal_reviewed")
        ? []
        : ["proposal_has_no_review_history"],
    };
  }

  async getExceptionPlaybooks(
    tenantId: string,
    lookbackDays: number
  ): Promise<{
    tenantId: string;
    generatedAt: string;
    lookbackDays: number;
    playbooks: ExceptionPlaybookSummary[];
    degraded: boolean;
    degradedReasons: string[];
  }> {
    const snapshot = await this.getSnapshot(tenantId, lookbackDays);
    const playbooks: ExceptionPlaybookSummary[] = snapshot.clusters.map((cluster) => {
      const action = cluster.recommendation.action;
      return {
        signature: cluster.signature.signature,
        clusterIdentity: cluster.signature.construction,
        commonResolutionPaths: cluster.resolutionPath.adjudicationMix,
        handlingTimeMinutes: {
          average: cluster.resolutionPath.avgResolutionMinutes,
          median: cluster.resolutionPath.medianResolutionMinutes,
        },
        sourceSystems: snapshot.sourceTrustSignals.map((signal) => signal.sourceName),
        commonOperatorActions:
          action === "manual_review"
            ? ["manual_review"]
            : action === "policy_adjustment"
              ? ["policy_review"]
              : action === "auto_match_candidate"
                ? ["monitor_and_sample"]
                : ["gather_more_evidence"],
        escalationIndicators:
          cluster.openCount > Math.max(2, Math.floor(cluster.volume * 0.6))
            ? ["high_unresolved_concentration"]
            : [],
        ambiguityMarkers:
          cluster.recommendation.degraded || cluster.recommendation.action === "insufficient_data"
            ? ["insufficient_cluster_volume"]
            : [],
        evidenceCoverage:
          cluster.volume >= 8 ? "strong" : cluster.volume >= 3 ? "partial" : "insufficient",
        basisType: cluster.resolvedCount > 0 && cluster.openCount > 0 ? "mixed" : "automatic_only",
        degradedReasons:
          cluster.recommendation.degraded || cluster.volume < 3
            ? ["limited_historical_support"]
            : [],
      };
    });

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      playbooks,
      degraded: snapshot.degraded,
      degradedReasons: snapshot.degradedReasons,
    };
  }

  async getReconciliationMemoryGraph(
    tenantId: string,
    lookbackDays: number
  ): Promise<{
    tenantId: string;
    generatedAt: string;
    lookbackDays: number;
    degraded: boolean;
    degradedReasons: string[];
    nodes: Array<{ id: string; type: string; label: string; metadata: Record<string, unknown> }>;
    edges: Array<{ from: string; to: string; relation: string }>;
  }> {
    const [snapshot, proposals, decisions] = await Promise.all([
      this.getSnapshot(tenantId, lookbackDays),
      this.listPolicyEvolutionProposals(tenantId, lookbackDays),
      this.getDecisionHistory(tenantId, { limit: 300 }),
    ]);

    const proposalHistory = await Promise.all(
      proposals.map(async (proposal) => ({
        proposalId: proposal.proposalId,
        history: await this.getProposalHistory(tenantId, proposal.proposalId),
      }))
    );

    const nodes: Array<{
      id: string;
      type: string;
      label: string;
      metadata: Record<string, unknown>;
    }> = [];
    const edges: Array<{ from: string; to: string; relation: string }> = [];

    for (const cluster of snapshot.clusters) {
      nodes.push({
        id: `signature:${cluster.signature.signature}`,
        type: "exception_signature",
        label: cluster.signature.signature,
        metadata: {
          volume: cluster.volume,
          openCount: cluster.openCount,
          resolvedCount: cluster.resolvedCount,
          recommendation: cluster.recommendation.action,
        },
      });

      for (const source of snapshot.sourceTrustSignals) {
        const sourceNode = `source:${source.sourceId}`;
        if (!nodes.some((node) => node.id === sourceNode)) {
          nodes.push({
            id: sourceNode,
            type: "source_system",
            label: source.sourceName,
            metadata: {
              totalExceptions: source.totalExceptions,
              resolvedRate: source.resolvedRate,
              trustScore: source.trustScore,
              basis: source.basis,
            },
          });
        }
        edges.push({
          from: sourceNode,
          to: `signature:${cluster.signature.signature}`,
          relation: "participates_in",
        });
      }
    }

    for (const counterparty of snapshot.counterparties) {
      const counterpartyNode = `counterparty:${counterparty.counterpartyKey}`;
      nodes.push({
        id: counterpartyNode,
        type: "counterparty",
        label: counterparty.displayName ?? counterparty.counterpartyKey,
        metadata: {
          exceptionCount: counterparty.exceptionCount,
          supportLevel: counterparty.supportLevel,
        },
      });
    }

    for (const decision of decisions.decisions) {
      const decisionNode = `decision:${decision.matchId}`;
      nodes.push({
        id: decisionNode,
        type: "operator_decision",
        label: decision.decision,
        metadata: {
          runId: decision.runId,
          actorId: decision.actorId,
          decidedAt: decision.decidedAt,
          resultingState: decision.resultingState,
          reason: decision.reason,
        },
      });
      if (decision.signature) {
        edges.push({
          from: decisionNode,
          to: `signature:${decision.signature}`,
          relation: "resolves",
        });
      }
      if (decision.counterpartyKey) {
        edges.push({
          from: decisionNode,
          to: `counterparty:${decision.counterpartyKey}`,
          relation: "about_counterparty",
        });
      }
      if (decision.runId) {
        const runNode = `run:${decision.runId}`;
        if (!nodes.some((node) => node.id === runNode)) {
          nodes.push({
            id: runNode,
            type: "reconciliation_run",
            label: decision.runId,
            metadata: {},
          });
        }
        edges.push({ from: runNode, to: decisionNode, relation: "includes_decision" });
      }
    }

    for (const proposal of proposals) {
      const proposalNode = `proposal:${proposal.proposalId}`;
      nodes.push({
        id: proposalNode,
        type: "policy_evolution_proposal",
        label: proposal.proposalId,
        metadata: {
          status: proposal.status,
          dataSufficiency: proposal.dataSufficiency,
          riskFlags: proposal.riskFlags,
          unsupportedMetrics: proposal.unsupportedMetrics,
        },
      });
      edges.push({
        from: proposalNode,
        to: `signature:${proposal.signature.signature}`,
        relation: "targets_signature",
      });

      const history = proposalHistory.find(
        (item) => item.proposalId === proposal.proposalId
      )?.history;
      for (const event of history?.events ?? []) {
        if (event.action !== "proposal_reviewed") continue;
        const reviewNode = `proposal_review:${proposal.proposalId}:${event.occurredAt}`;
        nodes.push({
          id: reviewNode,
          type: "proposal_review",
          label: String(event.changes["decision"] ?? "review"),
          metadata: {
            actorUserId: event.actorUserId,
            occurredAt: event.occurredAt,
            reason: event.changes["reason"] ?? null,
          },
        });
        edges.push({ from: reviewNode, to: proposalNode, relation: "reviews" });
      }
    }

    const dedupedNodes = Array.from(new Map(nodes.map((node) => [node.id, node])).values());
    const dedupedEdges = Array.from(
      new Map(edges.map((edge) => [`${edge.from}|${edge.relation}|${edge.to}`, edge])).values()
    );

    const degradedReasons = [
      ...(snapshot.degraded ? snapshot.degradedReasons : []),
      ...(decisions.degraded ? decisions.degradedReasons : []),
      ...(proposals.length === 0 ? ["no_policy_proposals_in_scope"] : []),
    ];

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      degraded: degradedReasons.length > 0,
      degradedReasons,
      nodes: dedupedNodes,
      edges: dedupedEdges,
    };
  }

  async getProofGraph(tenantId: string, runId: string): Promise<ProofGraphResponse> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: { matches: true, provenance: true },
    });
    if (!run) {
      return {
        runId,
        tenantId,
        degraded: true,
        degradedReasons: ["run_not_found_or_not_scoped"],
        nodes: [],
        edges: [],
      };
    }

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
      nodes.push({
        id: `match:${match.id}`,
        type: "match",
        label: `Match ${match.id}`,
        metadata: {
          matchType: match.matchType,
          reviewed: match.reviewed,
          confidence: Number(match.confidence),
        },
      });
      edges.push({ from: `run:${run.id}`, to: `match:${match.id}`, relation: "produced" });
    }

    for (const provenance of run.provenance) {
      nodes.push({
        id: `provenance:${provenance.id}`,
        type: "provenance",
        label: provenance.eventType,
        metadata: {
          sequence: provenance.sequence,
          actorType: provenance.actorType,
          actorUserId: provenance.actorUserId,
          entryHash: provenance.entryHash,
          createdAt: provenance.createdAt.toISOString(),
        },
      });
      edges.push({
        from: `run:${run.id}`,
        to: `provenance:${provenance.id}`,
        relation: "recorded",
      });
      if (provenance.matchId) {
        edges.push({
          from: `match:${provenance.matchId}`,
          to: `provenance:${provenance.id}`,
          relation: "evidenced_by",
        });
      }
    }

    const degradedReasons = run.provenance.length === 0 ? ["missing_run_provenance"] : [];
    return { runId, tenantId, degraded: degradedReasons.length > 0, degradedReasons, nodes, edges };
  }

  async buildEvidencePack(tenantId: string, runId: string): Promise<EvidencePack> {
    const [graph, run] = await Promise.all([
      this.getProofGraph(tenantId, runId),
      prisma.reconciliationRun.findFirst({
        where: { id: runId, tenantId },
        include: { matches: true, provenance: { orderBy: { sequence: "asc" } } },
      }),
    ]);

    const decisions: AdjudicationEvent[] = (run?.matches ?? [])
      .filter((m) => m.reviewed)
      .map((m) => ({
        matchId: m.id,
        runId,
        resolution: decisionForMatch(m.matchReason),
        actorId: m.reviewedBy,
        occurredAt: m.reviewedAt?.toISOString() ?? m.updatedAt.toISOString(),
        notes: m.matchReason,
      }));

    const completenessByCategory = {
      runLineage: {
        complete: graph.nodes.some((node) => node.type === "run"),
        degraded: !graph.nodes.some((node) => node.type === "run"),
        reasons: graph.nodes.some((node) => node.type === "run") ? [] : ["missing_run_node"],
      },
      matchLineage: {
        complete: graph.nodes.some((node) => node.type === "match"),
        degraded: !graph.nodes.some((node) => node.type === "match"),
        reasons: graph.nodes.some((node) => node.type === "match") ? [] : ["missing_match_nodes"],
      },
      operatorDecisionLineage: {
        complete: decisions.length > 0,
        degraded: decisions.length === 0,
        reasons: decisions.length > 0 ? [] : ["no_operator_decisions"],
      },
      proposalPackLineage: {
        complete: false,
        degraded: true,
        reasons: ["proposal_pack_linkage_not_available_for_run"],
      },
      provenanceRecords: {
        complete: (run?.provenance.length ?? 0) > 0,
        degraded: (run?.provenance.length ?? 0) === 0,
        reasons: (run?.provenance.length ?? 0) > 0 ? [] : ["no_provenance_entries_for_run"],
      },
    };

    const deterministicInput = {
      tenantId,
      runId,
      nodes: graph.nodes.map((node) => node.id).sort(),
      edges: graph.edges.map((edge) => `${edge.from}|${edge.relation}|${edge.to}`).sort(),
      decisions: decisions.map((d) => `${d.matchId}|${d.resolution}|${d.occurredAt}`).sort(),
      completenessByCategory,
    };

    const deterministicDigest = crypto
      .createHash("sha256")
      .update(JSON.stringify(deterministicInput))
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
      deterministicDigest,
      exportMetadata: {
        format: "json",
        version: "v3",
        missingBecause: Object.fromEntries(
          Object.entries(completenessByCategory).map(([category, value]) => [
            category,
            value.reasons,
          ])
        ),
        deterministicInputReferences: Object.keys(deterministicInput),
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

    const total = Math.max(1, run.matches.length);
    const baselineMatched = run.matches.filter((match) => match.matchType !== "unmatched").length;
    const baselineReviewLoad = run.matches.filter((match) => !match.reviewed).length;
    const candidateMatched = run.matches.filter((match) => {
      const amountDiff = Number(match.amountDiff ?? 0);
      const dateDiff = Math.abs(match.dateDiff ?? 0);
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
          candidatePolicy: input.candidatePolicy,
          sample: run.matches.map((match) => [
            match.id,
            Number(match.amountDiff ?? 0),
            match.dateDiff ?? 0,
            match.matchType,
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
        operatorReviewLoad: baselineReviewLoad,
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

  async getExceptionTaxonomySummary(
    tenantId: string,
    lookbackDays: number
  ): Promise<ExceptionTaxonomySummary> {
    const matches = await this.fetchScopedMatches(tenantId, lookbackDays);
    const dims: ExceptionTaxonomySummary["dimensions"] = {
      mismatchType: {},
      evidenceGapType: {},
      timingDiscrepancyType: {},
      policyConflictType: {},
      sourceInconsistencyType: {},
      reviewRequiredType: {},
      unresolvedBecause: {},
      disputeBecause: {},
    };

    for (const match of matches) {
      const ontology = classifyExceptionOntology(match);
      dims.mismatchType[ontology.mismatchType] =
        (dims.mismatchType[ontology.mismatchType] ?? 0) + 1;
      dims.evidenceGapType[ontology.evidenceGapType] =
        (dims.evidenceGapType[ontology.evidenceGapType] ?? 0) + 1;
      dims.timingDiscrepancyType[ontology.timingDiscrepancyType] =
        (dims.timingDiscrepancyType[ontology.timingDiscrepancyType] ?? 0) + 1;
      dims.policyConflictType[ontology.policyConflictType] =
        (dims.policyConflictType[ontology.policyConflictType] ?? 0) + 1;
      dims.sourceInconsistencyType[ontology.sourceInconsistencyType] =
        (dims.sourceInconsistencyType[ontology.sourceInconsistencyType] ?? 0) + 1;
      dims.reviewRequiredType[ontology.reviewRequiredType] =
        (dims.reviewRequiredType[ontology.reviewRequiredType] ?? 0) + 1;
      dims.unresolvedBecause[ontology.unresolvedBecause] =
        (dims.unresolvedBecause[ontology.unresolvedBecause] ?? 0) + 1;
      dims.disputeBecause[ontology.disputeBecause] =
        (dims.disputeBecause[ontology.disputeBecause] ?? 0) + 1;
    }

    const unresolvedCount = matches.filter((match) => !match.reviewed).length;
    const degradedReasons: string[] = [];
    if (matches.length === 0) degradedReasons.push("no_exception_history_in_scope");
    if ((dims.mismatchType["unknown"] ?? 0) > 0) degradedReasons.push("partial_ontology_coverage");

    return {
      tenantId,
      generatedAt: new Date().toISOString(),
      lookbackDays,
      totals: {
        exceptionCount: matches.length,
        unresolvedCount,
      },
      dimensions: dims,
      degraded: degradedReasons.length > 0,
      degradedReasons,
    };
  }
}
