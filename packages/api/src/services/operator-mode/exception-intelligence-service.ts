import crypto from "node:crypto";
import { prisma } from "../../infrastructure/db/prisma";
import {
  buildWorkbenchItem,
  type ReconciliationWorkbenchItem,
} from "../../routes/v1/reconciliation-trust-contract";

export interface ExceptionRecommendation {
  action: "auto_match_candidate" | "manual_review" | "policy_adjustment";
  reason: string;
  confidence: number;
  evidence: string[];
}

export interface ExceptionCluster {
  signature: string;
  clusterKey: string;
  volume: number;
  openCount: number;
  resolvedCount: number;
  medianTimeToResolutionMinutes: number | null;
  recommendedAction: ExceptionRecommendation;
}

export interface SourceReliability {
  sourceId: string;
  sourceName: string;
  reliabilityScore: number;
  totalExceptions: number;
  resolvedRate: number;
}

export interface ExceptionIntelligenceSnapshot {
  generatedAt: string;
  tenantId: string;
  totals: {
    exceptions: number;
    open: number;
    resolved: number;
    recurringSignatures: number;
  };
  clusters: ExceptionCluster[];
  sourceReliability: SourceReliability[];
}

export interface ProofGraphNode {
  id: string;
  type: "run" | "policy" | "exception" | "decision" | "evidence" | "export";
  label: string;
  metadata: Record<string, unknown>;
}

export interface ProofGraphEdge {
  from: string;
  to: string;
  relation:
    | "applied_policy"
    | "produced_exception"
    | "resolved_by"
    | "supported_by"
    | "exported_as";
}

export interface ProofGraphResponse {
  runId: string;
  tenantId: string;
  degraded: boolean;
  degradedReasons: string[];
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
}

export interface EvidencePack {
  runId: string;
  tenantId: string;
  generatedAt: string;
  graphDigestSha256: string;
  lineage: ProofGraphResponse;
  exceptions: Array<{
    id: string;
    status: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
  }>;
  policy: {
    configVersion: string | null;
    configSource: string | null;
    matchingRuleIds: string[];
  };
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
  baseline: {
    matchRate: number;
    exceptionRate: number;
    manualReviewLoad: number;
  };
  candidate: {
    matchRate: number;
    exceptionRate: number;
    manualReviewLoad: number;
  };
  blastRadius: {
    impactedRecords: number;
    newlyManualReview: number;
    newlyAutoMatched: number;
  };
  notes: string[];
}

type ClusterAccumulator = {
  signature: string;
  clusterKey: string;
  volume: number;
  openCount: number;
  resolvedCount: number;
  durations: number[];
  unmatchedCount: number;
  lowConfidenceCount: number;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function sortedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .slice()
    .sort();
}

function buildExceptionSignature(parts: Array<string | number | null | undefined>): string {
  return crypto
    .createHash("sha256")
    .update(parts.map((part) => String(part ?? "na")).join("|"))
    .digest("hex")
    .slice(0, 16);
}

function buildRecommendation(cluster: ClusterAccumulator): ExceptionRecommendation {
  if (cluster.unmatchedCount / Math.max(cluster.volume, 1) > 0.7) {
    return {
      action: "manual_review",
      reason: "High unmatched concentration requires human adjudication.",
      confidence: 0.92,
      evidence: [
        `unmatched_ratio=${(cluster.unmatchedCount / Math.max(cluster.volume, 1)).toFixed(2)}`,
        `volume=${cluster.volume}`,
      ],
    };
  }

  if (cluster.lowConfidenceCount / Math.max(cluster.volume, 1) > 0.4) {
    return {
      action: "policy_adjustment",
      reason: "Low-confidence recurring signature suggests tolerance/policy drift.",
      confidence: 0.78,
      evidence: [
        `low_confidence_ratio=${(cluster.lowConfidenceCount / Math.max(cluster.volume, 1)).toFixed(2)}`,
      ],
    };
  }

  return {
    action: "auto_match_candidate",
    reason: "Historically resolved cluster with stable signature.",
    confidence: 0.71,
    evidence: [
      `resolved_ratio=${(cluster.resolvedCount / Math.max(cluster.volume, 1)).toFixed(2)}`,
    ],
  };
}

export class ExceptionIntelligenceService {
  async getSnapshot(
    tenantId: string,
    lookbackDays: number
  ): Promise<ExceptionIntelligenceSnapshot> {
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const matches = await prisma.reconciliationMatch.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      include: {
        sourceTransaction: {
          select: {
            sourceId: true,
            category: true,
            currency: true,
            source: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1500,
    });

    const clusters = new Map<string, ClusterAccumulator>();
    const sourceAgg = new Map<string, { sourceName: string; total: number; resolved: number }>();

    for (const match of matches) {
      const metadata = asObject(match.metadata);
      const rationaleCodes = sortedStrings(metadata["rationale_codes"]);
      const clusterKey = [
        match.matchType,
        match.sourceTransaction?.category ?? "uncategorized",
        match.sourceTransaction?.currency ?? "unknown",
        rationaleCodes.join(",") || "none",
      ].join("|");
      const signature = buildExceptionSignature([
        clusterKey,
        match.matchReason,
        match.amountDiff?.toString(),
        match.dateDiff,
      ]);

      const current = clusters.get(signature) ?? {
        signature,
        clusterKey,
        volume: 0,
        openCount: 0,
        resolvedCount: 0,
        durations: [],
        unmatchedCount: 0,
        lowConfidenceCount: 0,
      };
      current.volume += 1;
      if (match.reviewed) {
        current.resolvedCount += 1;
        if (match.reviewedAt) {
          current.durations.push((match.reviewedAt.getTime() - match.createdAt.getTime()) / 60000);
        }
      } else {
        current.openCount += 1;
      }
      if (match.matchType === "unmatched") current.unmatchedCount += 1;
      if (Number(match.confidence) < 0.75) current.lowConfidenceCount += 1;
      clusters.set(signature, current);

      const sourceId = match.sourceTransaction?.sourceId;
      const sourceName = match.sourceTransaction?.source?.name ?? "unknown";
      if (sourceId) {
        const source = sourceAgg.get(sourceId) ?? { sourceName, total: 0, resolved: 0 };
        source.total += 1;
        if (match.reviewed) source.resolved += 1;
        sourceAgg.set(sourceId, source);
      }
    }

    const clusterItems = Array.from(clusters.values())
      .map((cluster): ExceptionCluster => {
        const orderedDurations = cluster.durations.slice().sort((a, b) => a - b);
        const medianIndex = Math.floor(orderedDurations.length / 2);
        return {
          signature: cluster.signature,
          clusterKey: cluster.clusterKey,
          volume: cluster.volume,
          openCount: cluster.openCount,
          resolvedCount: cluster.resolvedCount,
          medianTimeToResolutionMinutes:
            orderedDurations.length > 0 ? Math.round(orderedDurations[medianIndex] ?? 0) : null,
          recommendedAction: buildRecommendation(cluster),
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20);

    const sourceReliability = Array.from(sourceAgg.entries())
      .map(([sourceId, source]): SourceReliability => {
        const resolvedRate = source.total === 0 ? 0 : source.resolved / source.total;
        const reliabilityScore = Math.round(
          (1 - (source.total - source.resolved) / Math.max(source.total, 1)) * 100
        );
        return {
          sourceId,
          sourceName: source.sourceName,
          totalExceptions: source.total,
          resolvedRate: Number(resolvedRate.toFixed(4)),
          reliabilityScore,
        };
      })
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .slice(0, 20);

    const totalExceptions = matches.length;
    const resolved = matches.filter((match) => match.reviewed).length;

    return {
      generatedAt: new Date().toISOString(),
      tenantId,
      totals: {
        exceptions: totalExceptions,
        open: totalExceptions - resolved,
        resolved,
        recurringSignatures: clusterItems.filter((cluster) => cluster.volume > 1).length,
      },
      clusters: clusterItems,
      sourceReliability,
    };
  }

  async getProofGraph(tenantId: string, runId: string): Promise<ProofGraphResponse> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        matches: {
          include: { sourceTransaction: { select: { id: true, externalId: true } } },
          orderBy: { createdAt: "asc" },
          take: 200,
        },
      },
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

    const nodes: ProofGraphNode[] = [
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
    const edges: ProofGraphEdge[] = [];
    const degradedReasons: string[] = [];

    const policyMetadata = asObject(run.metadata);
    const policyNode: ProofGraphNode = {
      id: `policy:${run.id}`,
      type: "policy",
      label: `Policy for run ${run.id}`,
      metadata: {
        amountTolerance: policyMetadata["amountTolerance"] ?? null,
        dateWindowDays: policyMetadata["dateWindowDays"] ?? null,
      },
    };
    nodes.push(policyNode);
    edges.push({ from: `run:${run.id}`, to: policyNode.id, relation: "applied_policy" });

    if (run.matches.length === 0) degradedReasons.push("run_has_no_match_records");

    for (const match of run.matches) {
      const exceptionNodeId = `exception:${match.id}`;
      const decisionNodeId = `decision:${match.id}`;

      nodes.push({
        id: exceptionNodeId,
        type: "exception",
        label: `Exception ${match.id}`,
        metadata: {
          classification: match.matchType,
          confidence: Number(match.confidence),
          reviewed: match.reviewed,
          sourceExternalId: match.sourceTransaction.externalId,
        },
      });
      edges.push({ from: `run:${run.id}`, to: exceptionNodeId, relation: "produced_exception" });

      nodes.push({
        id: decisionNodeId,
        type: "decision",
        label: `Decision ${match.id}`,
        metadata: {
          reviewedAt: match.reviewedAt?.toISOString() ?? null,
          reviewedBy: match.reviewedBy,
          reason: match.matchReason,
        },
      });
      edges.push({ from: exceptionNodeId, to: decisionNodeId, relation: "resolved_by" });

      const evidenceNodeId = `evidence:${match.id}`;
      nodes.push({
        id: evidenceNodeId,
        type: "evidence",
        label: `Evidence ${match.id}`,
        metadata: {
          amountDiff: match.amountDiff ? Number(match.amountDiff) : null,
          dateDiff: match.dateDiff,
        },
      });
      edges.push({ from: decisionNodeId, to: evidenceNodeId, relation: "supported_by" });
    }

    return {
      runId,
      tenantId,
      degraded: degradedReasons.length > 0,
      degradedReasons,
      nodes,
      edges,
    };
  }

  async buildEvidencePack(tenantId: string, runId: string): Promise<EvidencePack> {
    const graph = await this.getProofGraph(tenantId, runId);
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      select: {
        id: true,
        metadata: true,
        matches: { select: { id: true, reviewed: true, reviewedAt: true, reviewedBy: true } },
      },
    });

    const runMetadata = asObject(run?.metadata);
    const policyConfig = asObject(runMetadata["_provenance"]);

    const graphDigestSha256 = crypto
      .createHash("sha256")
      .update(JSON.stringify(graph))
      .digest("hex");

    return {
      runId,
      tenantId,
      generatedAt: new Date().toISOString(),
      graphDigestSha256,
      lineage: graph,
      exceptions: (run?.matches ?? []).map((match) => ({
        id: match.id,
        status: match.reviewed ? "resolved" : "open",
        reviewedAt: match.reviewedAt?.toISOString() ?? null,
        reviewedBy: match.reviewedBy,
      })),
      policy: {
        configVersion:
          typeof policyConfig["configVersion"] === "string"
            ? (policyConfig["configVersion"] as string)
            : null,
        configSource:
          typeof policyConfig["configSource"] === "string"
            ? (policyConfig["configSource"] as string)
            : null,
        matchingRuleIds: sortedStrings(policyConfig["matchingRuleIds"]),
      },
    };
  }

  async simulatePolicy(
    tenantId: string,
    input: PolicySandboxRequest
  ): Promise<PolicySandboxResult> {
    const run = await prisma.reconciliationRun.findFirst({
      where: { id: input.runId, tenantId },
      include: {
        matches: {
          include: {
            sourceTransaction: {
              select: {
                id: true,
                externalId: true,
                amount: true,
                currency: true,
                date: true,
                description: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!run) {
      return {
        runId: input.runId,
        tenantId,
        simulatedAt: new Date().toISOString(),
        baseline: { matchRate: 0, exceptionRate: 0, manualReviewLoad: 0 },
        candidate: { matchRate: 0, exceptionRate: 0, manualReviewLoad: 0 },
        blastRadius: { impactedRecords: 0, newlyManualReview: 0, newlyAutoMatched: 0 },
        notes: ["run_not_found_or_not_scoped"],
      };
    }

    const baseItems: ReconciliationWorkbenchItem[] = run.matches.map((match) =>
      buildWorkbenchItem(
        {
          id: match.id,
          run_id: run.id,
          match_type: match.matchType as ReconciliationWorkbenchItem["classification"],
          confidence: Number(match.confidence),
          match_reason: match.matchReason,
          amount_diff: match.amountDiff ? Number(match.amountDiff) : null,
          date_diff: match.dateDiff,
          reviewed: match.reviewed,
          reviewed_at: match.reviewedAt,
          reviewed_by: match.reviewedBy,
          metadata: match.metadata as Record<string, unknown>,
          source_id: match.sourceTransaction.id,
          source_amount: Number(match.sourceTransaction.amount),
          source_currency: match.sourceTransaction.currency,
          source_date: match.sourceTransaction.date,
          source_description: match.sourceTransaction.description,
          source_external_id: match.sourceTransaction.externalId,
          target_id: null,
          target_amount: null,
          target_currency: null,
          target_date: null,
          target_description: null,
          target_external_id: null,
        },
        run.metadata as Record<string, unknown>
      )
    );

    const candidateItems = baseItems.map((item) => {
      const amountDiff = item.explanation.amountComparison.amountDifference;
      const dateDiff = item.explanation.dateComparison.dateDifferenceDays;
      const candidateWithinTolerance =
        (amountDiff === null || amountDiff <= input.candidatePolicy.amountTolerance) &&
        (dateDiff === null || Math.abs(dateDiff) <= input.candidatePolicy.dateWindowDays);

      const candidateQueue = candidateWithinTolerance ? "matched" : "manual_review";
      return {
        ...item,
        queue: candidateQueue,
        explanation: {
          ...item.explanation,
          tolerancePolicy: input.candidatePolicy,
        },
      };
    });

    const total = Math.max(baseItems.length, 1);
    const baselineMatched = baseItems.filter((item) => item.classification !== "unmatched").length;
    const baselineManual = baseItems.filter((item) => item.queue !== "matched").length;
    const candidateMatched = candidateItems.filter((item) => item.queue === "matched").length;
    const candidateManual = candidateItems.filter((item) => item.queue !== "matched").length;

    const newlyManualReview = candidateItems.filter(
      (candidate, index) => baseItems[index]?.queue === "matched" && candidate.queue !== "matched"
    ).length;
    const newlyAutoMatched = candidateItems.filter(
      (candidate, index) => baseItems[index]?.queue !== "matched" && candidate.queue === "matched"
    ).length;

    return {
      runId: input.runId,
      tenantId,
      simulatedAt: new Date().toISOString(),
      baseline: {
        matchRate: Number((baselineMatched / total).toFixed(4)),
        exceptionRate: Number(((total - baselineMatched) / total).toFixed(4)),
        manualReviewLoad: baselineManual,
      },
      candidate: {
        matchRate: Number((candidateMatched / total).toFixed(4)),
        exceptionRate: Number(((total - candidateMatched) / total).toFixed(4)),
        manualReviewLoad: candidateManual,
      },
      blastRadius: {
        impactedRecords: newlyManualReview + newlyAutoMatched,
        newlyManualReview,
        newlyAutoMatched,
      },
      notes: [
        "simulation_only_not_production_truth",
        "false_positive_false_negative_require_labeled_ground_truth",
      ],
    };
  }
}
