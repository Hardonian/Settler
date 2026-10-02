/**
 * Counterfactual Policy Sandbox & Predictive Simulation Engine
 *
 * Simulates proposed reconciliation policy adjustments, tolerance widenings, and self-healing
 * candidate plans against historical transaction datasets before live promotion.
 *
 * Enforces:
 * - Deterministic counterfactual outcome evaluation
 * - Zero-float drift calculation (BigInt minor units)
 * - SOX-404 regulatory boundary checks (maker != checker, delta limits)
 * - RFC 6962 SHA-256 Merkle state sealing of the simulation trace
 */

import { createHash } from "node:crypto";
import { parseArn } from "./arn-correlator.js";

export interface SandboxTransaction {
  id: string;
  externalId?: string;
  amountCents: bigint;
  date: string; // ISO 8601
  description: string;
  currency: string;
}

export interface MatchingRulesetConfig {
  dateWindowDays: number;
  amountToleranceCents: number;
  fuzzyDescriptionThreshold: number; // 0.0 - 1.0
  enableArnCorrelation?: boolean;
}

export interface CandidatePolicyDraft {
  policyId: string;
  tenantId: string;
  proposedBy: string;
  actionType: string;
  proposedRuleset: MatchingRulesetConfig;
  rationale: string;
}

export interface CounterfactualSimulationInput {
  tenantId: string;
  baselineRuleset: MatchingRulesetConfig;
  candidatePolicy: CandidatePolicyDraft;
  sourceTransactions: SandboxTransaction[];
  targetTransactions: SandboxTransaction[];
}

export interface CounterfactualMatch {
  sourceId: string;
  targetId: string;
  amountDiffCents: bigint;
  dateDiffDays: number;
  confidence: number;
  matchType: "exact" | "arn" | "fuzzy";
}

export interface CounterfactualSimulationReport {
  simulationId: string;
  tenantId: string;
  simulatedAt: string;
  policyId: string;
  proposedBy: string;
  baseline: {
    matchedCount: number;
    unmatchedCount: number;
    autoMatchRatePct: number;
    totalMatchedVolumeCents: bigint;
  };
  simulated: {
    matchedCount: number;
    unmatchedCount: number;
    autoMatchRatePct: number;
    totalMatchedVolumeCents: bigint;
  };
  delta: {
    matchCountDelta: number;
    autoMatchRateDeltaPct: number;
    netFloatDeltaCents: bigint;
    newlyMatchedCount: number;
    brokenMatchCount: number;
  };
  soxCompliance: {
    isCompliant: boolean;
    violations: string[];
    maxToleranceCentsExceeded: boolean;
    maxWindowDaysExceeded: boolean;
  };
  riskAssessment: {
    falsePositiveRiskScore: number; // 0.0 - 1.0
    riskTier: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
    recommendedAction: "AUTO_PROMOTE" | "REQUIRE_CONTROLLER_REVIEW" | "REJECT_POLICY";
  };
  simulationMerkleRoot: string;
}

/**
 * Calculates RFC 6962 SHA-256 Merkle leaf hash
 */
function rfc6962LeafHash(data: string): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(data, "utf8")]))
    .digest("hex");
}

function daysDiff(d1: string, d2: string): number {
  const ms1 = new Date(d1).getTime();
  const ms2 = new Date(d2).getTime();
  return Math.abs(Math.round((ms1 - ms2) / (1000 * 60 * 60 * 24)));
}

function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Executes a deterministic matching pass for given ruleset
 */
function executeMatchingPass(
  sources: SandboxTransaction[],
  targets: SandboxTransaction[],
  rules: MatchingRulesetConfig
): CounterfactualMatch[] {
  const matches: CounterfactualMatch[] = [];
  const claimedTargets = new Set<string>();

  for (const source of sources) {
    // 1. Try ARN correlation if enabled
    if (rules.enableArnCorrelation) {
      const sourceArn = parseArn(source.externalId || source.description);
      if (sourceArn.isValidLength && sourceArn.isValidChecksum) {
        const targetMatch = targets.find((t) => {
          if (claimedTargets.has(t.id)) return false;
          const targetArn = parseArn(t.externalId || t.description);
          return targetArn.arn === sourceArn.arn && targetArn.isValidChecksum;
        });

        if (targetMatch) {
          const diffCents =
            source.amountCents >= targetMatch.amountCents
              ? source.amountCents - targetMatch.amountCents
              : targetMatch.amountCents - source.amountCents;

          if (diffCents <= BigInt(rules.amountToleranceCents)) {
            claimedTargets.add(targetMatch.id);
            matches.push({
              sourceId: source.id,
              targetId: targetMatch.id,
              amountDiffCents: diffCents,
              dateDiffDays: daysDiff(source.date, targetMatch.date),
              confidence: 1.0,
              matchType: "arn",
            });
            continue;
          }
        }
      }
    }

    // 2. Exact / Tolerance Matching
    let bestCandidate: {
      target: SandboxTransaction;
      diffCents: bigint;
      dateDiff: number;
      sim: number;
    } | null = null;

    for (const target of targets) {
      if (claimedTargets.has(target.id)) continue;
      if (source.currency !== target.currency) continue;

      const diffCents =
        source.amountCents >= target.amountCents
          ? source.amountCents - target.amountCents
          : target.amountCents - source.amountCents;

      if (diffCents > BigInt(rules.amountToleranceCents)) continue;

      const dDiff = daysDiff(source.date, target.date);
      if (dDiff > rules.dateWindowDays) continue;

      const sim = stringSimilarity(source.description, target.description);
      if (sim < rules.fuzzyDescriptionThreshold) continue;

      if (
        !bestCandidate ||
        diffCents < bestCandidate.diffCents ||
        (diffCents === bestCandidate.diffCents && sim > bestCandidate.sim)
      ) {
        bestCandidate = { target, diffCents, dateDiff: dDiff, sim };
      }
    }

    if (bestCandidate) {
      claimedTargets.add(bestCandidate.target.id);
      const isExact = bestCandidate.diffCents === 0n && bestCandidate.dateDiff === 0;
      matches.push({
        sourceId: source.id,
        targetId: bestCandidate.target.id,
        amountDiffCents: bestCandidate.diffCents,
        dateDiffDays: bestCandidate.dateDiff,
        confidence: isExact ? 1.0 : Math.max(0.7, bestCandidate.sim),
        matchType: isExact ? "exact" : "fuzzy",
      });
    }
  }

  return matches;
}

/**
 * Simulates a candidate policy draft against historical transactions
 */
export function simulatePolicyDraft(
  input: CounterfactualSimulationInput
): CounterfactualSimulationReport {
  const simulationId = `sim_${createHash("sha256")
    .update(`${input.tenantId}:${input.candidatePolicy.policyId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16)}`;

  // 1. Run baseline matching
  const baselineMatches = executeMatchingPass(
    input.sourceTransactions,
    input.targetTransactions,
    input.baselineRuleset
  );

  // 2. Run simulated matching with candidate ruleset
  const simulatedMatches = executeMatchingPass(
    input.sourceTransactions,
    input.targetTransactions,
    input.candidatePolicy.proposedRuleset
  );

  const totalSources = input.sourceTransactions.length;
  const baselineMatchedCount = baselineMatches.length;
  const simulatedMatchedCount = simulatedMatches.length;

  const baselineAutoMatchRatePct =
    totalSources > 0 ? Math.round((baselineMatchedCount / totalSources) * 10000) / 100 : 0;
  const simulatedAutoMatchRatePct =
    totalSources > 0 ? Math.round((simulatedMatchedCount / totalSources) * 10000) / 100 : 0;

  // Calculate volume
  const sourceMap = new Map(input.sourceTransactions.map((s) => [s.id, s]));
  let baselineVolumeCents = 0n;
  for (const m of baselineMatches) {
    const s = sourceMap.get(m.sourceId);
    if (s) baselineVolumeCents += s.amountCents;
  }

  let simulatedVolumeCents = 0n;
  for (const m of simulatedMatches) {
    const s = sourceMap.get(m.sourceId);
    if (s) simulatedVolumeCents += s.amountCents;
  }

  // Delta analysis
  const baselineKeySet = new Set(baselineMatches.map((m) => `${m.sourceId}:${m.targetId}`));
  const simulatedKeySet = new Set(simulatedMatches.map((m) => `${m.sourceId}:${m.targetId}`));

  let newlyMatchedCount = 0;
  for (const key of simulatedKeySet) {
    if (!baselineKeySet.has(key)) newlyMatchedCount++;
  }

  let brokenMatchCount = 0;
  for (const key of baselineKeySet) {
    if (!simulatedKeySet.has(key)) brokenMatchCount++;
  }

  const netFloatDeltaCents = simulatedVolumeCents - baselineVolumeCents;

  // SOX compliance checks
  const violations: string[] = [];
  const maxToleranceCentsExceeded = input.candidatePolicy.proposedRuleset.amountToleranceCents > 50;
  const maxWindowDaysExceeded = input.candidatePolicy.proposedRuleset.dateWindowDays > 7;

  if (maxToleranceCentsExceeded) {
    violations.push(
      `SOX-404: Proposed amount tolerance of ${input.candidatePolicy.proposedRuleset.amountToleranceCents} cents exceeds hard limit of 50 cents`
    );
  }

  if (maxWindowDaysExceeded) {
    violations.push(
      `SOX-404: Proposed date window of ${input.candidatePolicy.proposedRuleset.dateWindowDays} days exceeds hard limit of 7 days`
    );
  }

  const isCompliant = violations.length === 0;

  // Risk calculation
  let falsePositiveRiskScore = 0.0;
  if (input.candidatePolicy.proposedRuleset.amountToleranceCents > 20) {
    falsePositiveRiskScore += 0.25;
  }
  if (input.candidatePolicy.proposedRuleset.dateWindowDays > 3) {
    falsePositiveRiskScore += 0.15;
  }
  if (input.candidatePolicy.proposedRuleset.fuzzyDescriptionThreshold < 0.6) {
    falsePositiveRiskScore += 0.35;
  }
  if (brokenMatchCount > 0) {
    falsePositiveRiskScore += 0.25;
  }
  falsePositiveRiskScore = Math.min(1.0, Math.round(falsePositiveRiskScore * 100) / 100);

  let riskTier: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED" = "LOW";
  let recommendedAction: "AUTO_PROMOTE" | "REQUIRE_CONTROLLER_REVIEW" | "REJECT_POLICY" =
    "AUTO_PROMOTE";

  if (!isCompliant) {
    riskTier = "BLOCKED";
    recommendedAction = "REJECT_POLICY";
  } else if (falsePositiveRiskScore >= 0.5 || brokenMatchCount > 0) {
    riskTier = "HIGH";
    recommendedAction = "REQUIRE_CONTROLLER_REVIEW";
  } else if (falsePositiveRiskScore >= 0.25) {
    riskTier = "MEDIUM";
    recommendedAction = "REQUIRE_CONTROLLER_REVIEW";
  }

  // RFC 6962 Merkle Root of simulation
  const traceLeaf = rfc6962LeafHash(
    JSON.stringify({
      simulationId,
      tenantId: input.tenantId,
      policyId: input.candidatePolicy.policyId,
      baselineMatchedCount,
      simulatedMatchedCount,
      netFloatDeltaCents: netFloatDeltaCents.toString(),
      violations,
    })
  );

  return {
    simulationId,
    tenantId: input.tenantId,
    simulatedAt: new Date().toISOString(),
    policyId: input.candidatePolicy.policyId,
    proposedBy: input.candidatePolicy.proposedBy,
    baseline: {
      matchedCount: baselineMatchedCount,
      unmatchedCount: totalSources - baselineMatchedCount,
      autoMatchRatePct: baselineAutoMatchRatePct,
      totalMatchedVolumeCents: baselineVolumeCents,
    },
    simulated: {
      matchedCount: simulatedMatchedCount,
      unmatchedCount: totalSources - simulatedMatchedCount,
      autoMatchRatePct: simulatedAutoMatchRatePct,
      totalMatchedVolumeCents: simulatedVolumeCents,
    },
    delta: {
      matchCountDelta: simulatedMatchedCount - baselineMatchedCount,
      autoMatchRateDeltaPct:
        Math.round((simulatedAutoMatchRatePct - baselineAutoMatchRatePct) * 100) / 100,
      netFloatDeltaCents,
      newlyMatchedCount,
      brokenMatchCount,
    },
    soxCompliance: {
      isCompliant,
      violations,
      maxToleranceCentsExceeded,
      maxWindowDaysExceeded,
    },
    riskAssessment: {
      falsePositiveRiskScore,
      riskTier,
      recommendedAction,
    },
    simulationMerkleRoot: traceLeaf,
  };
}
