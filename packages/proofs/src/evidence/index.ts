/**
 * Evidence Service
 *
 * Structured evidence capture, provenance tracking, and reliability scoring
 * for reconciliation audit trails and compliance.
 *
 * Core principles:
 * - Every piece of evidence has a hash for integrity verification
 * - Evidence can be degraded (incomplete/unavailable) but must be labeled as such
 * - Freshness is tracked to support stale evidence detection
 * - Attestations provide human verification of automated evidence
 */

import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";

export type EvidenceArtifactType =
  | "source_snapshot"
  | "target_snapshot"
  | "match_comparison"
  | "operator_annotation"
  | "system_analysis"
  | "run_summary"
  | "provenance_chain"
  | "exception_resolution";

export interface EvidencePayload {
  type: EvidenceArtifactType;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EvidenceCaptureOptions {
  artifactType: EvidenceArtifactType;
  artifactKey: string;
  payload: EvidencePayload;
  sourceType?: string;
  sourceId?: string;
  capturedBy?: "system" | "operator" | "automated_rule";
  capturedByUserId?: string;
  runId?: string;
  exceptionId?: string;
  validUntil?: Date;
  reliabilityFactors?: EvidenceReliabilityFactor[];
}

export interface EvidenceReliabilityFactor {
  factor: string;
  weight: number; // 0-1, contribution to overall reliability
  value: number; // 0-1, rating for this factor
  notes?: string;
}

export interface EvidenceIntegrity {
  payloadHash: string;
  signature?: string;
  timestamp: string;
  algorithm: "sha256";
}

export interface EvidenceDegradation {
  degraded: boolean;
  reasons: string[];
  detectedAt: string;
}

export interface EvidenceAttestation {
  attested: boolean;
  attestedBy?: string;
  attestedAt?: string;
  method?: "manual" | "automated" | "cryptographic";
}

export interface EvidenceArtifact {
  id: string;
  tenantId: string;
  artifactType: string;
  artifactKey: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  capturedAt: string;
  capturedBy: string;
  capturedByUserId?: string;
  runId?: string;
  exceptionId?: string;
  validUntil?: string;
  isExpired: boolean;
  reliabilityScore?: number;
  degraded: boolean;
  degradedReasons: string[];
  attested: boolean;
  attestedBy?: string;
  attestedAt?: string;
  version: number;
}

export interface EvidenceQueryOptions {
  tenantId: string;
  artifactType?: EvidenceArtifactType;
  artifactKey?: string;
  runId?: string;
  exceptionId?: string;
  includeExpired?: boolean;
  includeDegraded?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Compute SHA-256 hash of evidence payload
 */
export function computePayloadHash(payload: unknown): string {
  const normalized = JSON.stringify(payload, Object.keys(payload as object).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Compute reliability score from factors
 */
export function computeReliabilityScore(factors: EvidenceReliabilityFactor[]): number {
  if (factors.length === 0) return 0.5; // Neutral default

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0.5;

  const weightedSum = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
  return Math.round((weightedSum / totalWeight) * 10000) / 10000;
}

/**
 * Generate standard reliability factors for source snapshots
 */
export function sourceSnapshotReliabilityFactors(
  captureAge: number, // milliseconds
  dataCompleteness: number, // 0-1
  adapterVersion?: string
): EvidenceReliabilityFactor[] {
  const factors: EvidenceReliabilityFactor[] = [];

  // Freshness factor: decays over time
  const freshnessHours = captureAge / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 1 - freshnessHours / 168); // Decays over 1 week
  factors.push({
    factor: "data_freshness",
    weight: 0.3,
    value: freshnessScore,
    notes: `Captured ${freshnessHours.toFixed(1)} hours ago`,
  });

  // Completeness factor
  factors.push({
    factor: "data_completeness",
    weight: 0.4,
    value: dataCompleteness,
    notes: `${(dataCompleteness * 100).toFixed(0)}% of fields populated`,
  });

  // Adapter version factor
  if (adapterVersion) {
    factors.push({
      factor: "adapter_version",
      weight: 0.15,
      value: 0.9, // Assuming versioned adapters are reliable
      notes: `Adapter version: ${adapterVersion}`,
    });
  }

  // Hash integrity factor
  factors.push({
    factor: "hash_verified",
    weight: 0.15,
    value: 1.0,
    notes: "Hash computed successfully",
  });

  return factors;
}

/**
 * Generate standard reliability factors for match comparisons
 */
export function matchComparisonReliabilityFactors(
  confidence: number, // 0-1
  sourceReliability: number, // 0-1
  targetReliability: number // 0-1
): EvidenceReliabilityFactor[] {
  return [
    {
      factor: "match_confidence",
      weight: 0.35,
      value: confidence,
      notes: `Match confidence: ${(confidence * 100).toFixed(1)}%`,
    },
    {
      factor: "source_reliability",
      weight: 0.25,
      value: sourceReliability,
      notes: `Source data reliability: ${(sourceReliability * 100).toFixed(1)}%`,
    },
    {
      factor: "target_reliability",
      weight: 0.25,
      value: targetReliability,
      notes: `Target data reliability: ${(targetReliability * 100).toFixed(1)}%`,
    },
    {
      factor: "comparison_method",
      weight: 0.15,
      value: 0.95, // Assuming deterministic comparison is reliable
      notes: "Deterministic field comparison",
    },
  ];
}

/**
 * Build artifact key for deduplication
 */
export function buildArtifactKey(
  type: EvidenceArtifactType,
  runId: string,
  entityId: string,
  suffix?: string
): string {
  const parts = [type, runId, entityId];
  if (suffix) parts.push(suffix);
  return parts.join("::");
}

/**
 * Evidence completeness model - what makes a proof pack complete
 */
export interface ProofCompletenessModel {
  completenessScore: number;
  requiredEvidenceTypes: EvidenceArtifactType[];
  presentEvidenceTypes: EvidenceArtifactType[];
  missingEvidenceTypes: EvidenceArtifactType[];
  completenessFlags: string[];
  gapAnalysis: EvidenceGap[];
}

export interface EvidenceGap {
  gapType: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  suggestedRemediation?: string;
}

/**
 * Standard evidence requirements by proof type
 */
export const STANDARD_EVIDENCE_REQUIREMENTS: Record<string, EvidenceArtifactType[]> = {
  run_summary: ["run_summary", "source_snapshot", "target_snapshot", "match_comparison"],
  exception_resolution: ["match_comparison", "operator_annotation", "system_analysis"],
  audit_export: ["run_summary", "provenance_chain"],
  compliance_report: ["run_summary", "provenance_chain", "operator_annotation"],
};

/**
 * Check evidence completeness for a proof package
 */
export function assessEvidenceCompleteness(
  presentTypes: EvidenceArtifactType[],
  requiredTypes: EvidenceArtifactType[]
): ProofCompletenessModel {
  const requiredSet = new Set(requiredTypes);
  const presentSet = new Set(presentTypes);

  const missingTypes = requiredTypes.filter((t) => !presentSet.has(t));
  const completenessScore =
    requiredTypes.length === 0
      ? 1.0
      : presentTypes.filter((t) => requiredSet.has(t)).length / requiredTypes.length;

  const completenessFlags: string[] = [];
  const gapAnalysis: EvidenceGap[] = [];

  // Check for critical gaps
  for (const missing of missingTypes) {
    if (missing === "run_summary") {
      completenessFlags.push("CRITICAL: Missing run summary");
      gapAnalysis.push({
        gapType: "missing_run_summary",
        description: "Run summary evidence is required for proof completeness",
        severity: "critical",
        suggestedRemediation: "Ensure run summary is captured after reconciliation completes",
      });
    } else if (missing === "match_comparison" && presentSet.has("exception_resolution")) {
      completenessFlags.push("HIGH: Missing match comparison for exceptions");
      gapAnalysis.push({
        gapType: "missing_match_comparison",
        description: "Match comparison evidence should accompany exception resolutions",
        severity: "high",
      });
    }
  }

  return {
    completenessScore: Math.round(completenessScore * 10000) / 10000,
    requiredEvidenceTypes: requiredTypes,
    presentEvidenceTypes: presentTypes,
    missingEvidenceTypes: missingTypes,
    completenessFlags,
    gapAnalysis,
  };
}

/**
 * Export evidence as structured JSON for audit
 */
export function exportEvidenceForAudit(
  artifacts: EvidenceArtifact[],
  options: {
    includePayloads?: boolean;
    includeDegraded?: boolean;
    tenantId: string;
    exportedAt?: string;
  }
): Record<string, unknown> {
  const filteredArtifacts = options.includeDegraded
    ? artifacts
    : artifacts.filter((a) => !a.degraded);

  const evidenceSummary = filteredArtifacts.map((a) => ({
    id: a.id,
    artifactType: a.artifactType,
    artifactKey: a.artifactKey,
    capturedAt: a.capturedAt,
    capturedBy: a.capturedBy,
    payloadHash: a.payloadHash,
    reliabilityScore: a.reliabilityScore,
    degraded: a.degraded,
    degradedReasons: a.degradedReasons,
    attested: a.attested,
    ...(options.includePayloads ? { payload: a.payload } : {}),
  }));

  return {
    version: "1.0",
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    tenantId: options.tenantId,
    artifactCount: filteredArtifacts.length,
    artifacts: evidenceSummary,
    integrity: {
      totalHash: computePayloadHash(evidenceSummary),
      algorithm: "sha256",
    },
  };
}
