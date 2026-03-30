/**
 * ProofPack Service
 *
 * Structured proof packages for reconciliation audit trails,
 * compliance exports, and evidence packages.
 *
 * A proof package is a collection of evidence artifacts bundled
 * with integrity verification and completeness assessment.
 */

import crypto from "node:crypto";
import type {
  EvidenceArtifact,
  EvidenceArtifactType,
  ProofCompletenessModel,
  EvidenceGap,
} from "./evidence";

export type ProofPackageType =
  | "run_summary"
  | "exception_resolution"
  | "audit_export"
  | "compliance_report"
  | "policy_change_approval"
  | "reconciliation_certificate";

export type ProofPackageStatus = "draft" | "finalized" | "archived" | "expired";

export interface ProofPackageConfig {
  packageType: ProofPackageType;
  scope: "run" | "job" | "tenant" | "custom";
  scopeIds?: string[];
  requiredEvidenceTypes?: EvidenceArtifactType[];
  includeDegraded?: boolean;
  narrativeTemplate?: string;
}

export interface ProofPackage {
  id: string;
  tenantId: string;
  packageType: ProofPackageType;
  packageKey: string;
  evidenceIds: string[];
  summary: ProofPackageSummary;
  narrative?: string;
  completeness: ProofCompletenessModel;
  packageHash: string;
  signature?: string;
  attested: boolean;
  attestations: ProofAttestation[];
  status: ProofPackageStatus;
  finalizedAt?: string;
  archivedAt?: string;
  exportFormat?: string;
  exportedAt?: string;
  createdAt: string;
}

export interface ProofPackageSummary {
  artifactCount: number;
  artifactTypes: Record<string, number>;
  reliabilityRange: { min: number; max: number; avg: number };
  degradationSummary: { total: number; byReason: Record<string, number> };
  attestationSummary: { total: number; byMethod: Record<string, number> };
}

export interface ProofAttestation {
  attestedBy: string;
  attestedAt: string;
  method: "manual" | "automated" | "cryptographic";
  signature?: string;
  notes?: string;
}

export interface ProofPackageQuery {
  tenantId: string;
  packageType?: ProofPackageType;
  status?: ProofPackageStatus;
  scopeIds?: string[];
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ProofPackageCreateInput {
  tenantId: string;
  config: ProofPackageConfig;
  evidence: EvidenceArtifact[];
  narrative?: string;
  createdBy?: string;
}

/**
 * Generate a unique package key
 */
export function generatePackageKey(
  packageType: ProofPackageType,
  scope: string,
  scopeId: string,
  timestamp?: string
): string {
  const ts = timestamp ?? new Date().toISOString().replace(/[:.]/g, "-");
  return `${packageType}::${scope}::${scopeId}::${ts}`;
}

/**
 * Compute package hash from evidence artifacts
 */
export function computePackageHash(
  evidenceIds: string[],
  packageType: ProofPackageType,
  scopeIds: string[]
): string {
  const payload = {
    evidenceIds: [...evidenceIds].sort(),
    packageType,
    scopeIds: [...scopeIds].sort(),
    computedAt: new Date().toISOString(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Build proof package summary from evidence
 */
export function buildProofSummary(evidence: EvidenceArtifact[]): ProofPackageSummary {
  const artifactTypes: Record<string, number> = {};
  let minReliability = 1.0;
  let maxReliability = 0.0;
  let totalReliability = 0;
  let reliabilityCount = 0;
  const degradationByReason: Record<string, number> = {};
  const attestationByMethod: Record<string, number> = {};

  for (const artifact of evidence) {
    // Artifact type counts
    artifactTypes[artifact.artifactType] = (artifactTypes[artifact.artifactType] ?? 0) + 1;

    // Reliability range
    if (artifact.reliabilityScore !== undefined) {
      minReliability = Math.min(minReliability, artifact.reliabilityScore);
      maxReliability = Math.max(maxReliability, artifact.reliabilityScore);
      totalReliability += artifact.reliabilityScore;
      reliabilityCount++;
    }

    // Degradation summary
    if (artifact.degraded) {
      for (const reason of artifact.degradedReasons) {
        degradationByReason[reason] = (degradationByReason[reason] ?? 0) + 1;
      }
    }

    // Attestation summary
    if (artifact.attested) {
      const method = artifact.attestedBy ? "manual" : "automated";
      attestationByMethod[method] = (attestationByMethod[method] ?? 0) + 1;
    }
  }

  return {
    artifactCount: evidence.length,
    artifactTypes,
    reliabilityRange: {
      min: reliabilityCount > 0 ? Math.round(minReliability * 10000) / 10000 : 0,
      max: reliabilityCount > 0 ? Math.round(maxReliability * 10000) / 10000 : 0,
      avg:
        reliabilityCount > 0
          ? Math.round((totalReliability / reliabilityCount) * 10000) / 10000
          : 0,
    },
    degradationSummary: {
      total: evidence.filter((e) => e.degraded).length,
      byReason: degradationByReason,
    },
    attestationSummary: {
      total: evidence.filter((e) => e.attested).length,
      byMethod: attestationByMethod,
    },
  };
}

/**
 * Generate audit narrative for a proof package
 */
export function generateAuditNarrative(
  packageType: ProofPackageType,
  evidence: EvidenceArtifact[],
  options: {
    includeGaps?: boolean;
    includeRecommendations?: boolean;
  } = {}
): string {
  const summary = buildProofSummary(evidence);

  const lines: string[] = [];
  lines.push(`Proof Package Summary (${packageType})`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Total Evidence Artifacts: ${summary.artifactCount}`);
  lines.push(
    `Artifact Types: ${Object.entries(summary.artifactTypes)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`
  );
  lines.push("");

  lines.push("Reliability Metrics:");
  lines.push(`  - Average: ${(summary.reliabilityRange.avg * 100).toFixed(1)}%`);
  lines.push(
    `  - Range: ${(summary.reliabilityRange.min * 100).toFixed(1)}% - ${(summary.reliabilityRange.max * 100).toFixed(1)}%`
  );
  lines.push("");

  if (summary.degradationSummary.total > 0) {
    lines.push(`Degraded Evidence: ${summary.degradationSummary.total} artifact(s)`);
    lines.push("  Reasons:");
    for (const [reason, count] of Object.entries(summary.degradationSummary.byReason)) {
      lines.push(`    - ${reason}: ${count}`);
    }
    lines.push("");
  }

  if (summary.attestationSummary.total > 0) {
    lines.push(`Attested Evidence: ${summary.attestationSummary.total} artifact(s)`);
    lines.push(
      `  Methods: ${Object.entries(summary.attestationSummary.byMethod)
        .map(([k, v]) => `${k} (${v})`)
        .join(", ")}`
    );
    lines.push("");
  }

  if (options.includeGaps) {
    lines.push("Evidence Gaps:");
    const degradedEvidence = evidence.filter((e) => e.degraded);
    if (degradedEvidence.length === 0) {
      lines.push("  None identified.");
    } else {
      for (const artifact of degradedEvidence) {
        lines.push(
          `  - ${artifact.artifactType}: ${artifact.degradedReasons.join(", ") || "reliability below threshold"}`
        );
      }
    }
    lines.push("");
  }

  if (options.includeRecommendations) {
    lines.push("Recommendations:");
    if (summary.reliabilityRange.avg < 0.7) {
      lines.push("  - Consider improving data source reliability to increase evidence confidence");
    }
    if (summary.degradationSummary.total > summary.artifactCount * 0.2) {
      lines.push("  - High proportion of degraded evidence - review data freshness policies");
    }
    if (summary.attestationSummary.total < summary.artifactCount * 0.5) {
      lines.push("  - Consider manual attestation for critical evidence artifacts");
    }
    if (lines[lines.length - 1] === "Recommendations:") {
      lines.push("  - No specific recommendations at this time");
    }
  }

  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);

  return lines.join("\n");
}

/**
 * Export proof package for external consumption
 */
export interface ProofPackageExport {
  version: string;
  exportedAt: string;
  package: {
    id: string;
    type: ProofPackageType;
    key: string;
    status: ProofPackageStatus;
    scope: string;
    scopeIds: string[];
    summary: ProofPackageSummary;
    narrative?: string;
    packageHash: string;
    signature?: string;
    attestations: ProofAttestation[];
  };
  evidence: EvidenceArtifact[];
  completeness: ProofCompletenessModel;
  integrity: {
    packageHash: string;
    evidenceHashes: Record<string, string>;
    algorithm: string;
  };
}

export function exportProofPackage(
  pkg: ProofPackage,
  evidence: EvidenceArtifact[],
  completeness: ProofCompletenessModel
): ProofPackageExport {
  const evidenceHashes: Record<string, string> = {};
  for (const artifact of evidence) {
    evidenceHashes[artifact.id] = artifact.payloadHash;
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    package: {
      id: pkg.id,
      type: pkg.packageType,
      key: pkg.packageKey,
      status: pkg.status,
      scope: "run", // Would be derived from config
      scopeIds: pkg.evidenceIds, // Would be derived from config
      summary: pkg.summary,
      narrative: pkg.narrative,
      packageHash: pkg.packageHash,
      signature: pkg.signature,
      attestations: pkg.attestations,
    },
    evidence,
    completeness,
    integrity: {
      packageHash: pkg.packageHash,
      evidenceHashes,
      algorithm: "sha256",
    },
  };
}

/**
 * Verify proof package integrity
 */
export interface ProofIntegrityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  verifiedAt: string;
}

export function verifyProofIntegrity(exported: ProofPackageExport): ProofIntegrityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verify package hash
  const computedHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        evidenceIds: exported.evidence.map((e) => e.id).sort(),
        packageType: exported.package.type,
        scopeIds: exported.package.scopeIds.sort(),
      })
    )
    .digest("hex");

  if (computedHash !== exported.package.packageHash) {
    errors.push("Package hash mismatch - evidence may have been tampered with");
  }

  // Verify evidence hashes
  for (const artifact of exported.evidence) {
    const computedArtifactHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(artifact.payload))
      .digest("hex");

    if (computedArtifactHash !== artifact.payloadHash) {
      errors.push(`Evidence artifact ${artifact.id} hash mismatch`);
    }
  }

  // Check for degraded evidence
  const degradedCount = exported.evidence.filter((e) => e.degraded).length;
  if (degradedCount > 0) {
    warnings.push(`${degradedCount} evidence artifact(s) are degraded`);
  }

  // Check for unverified signatures
  if (exported.package.signature) {
    // Would integrate with actual signature verification
    warnings.push("Cryptographic signature present but not verified in this check");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    verifiedAt: new Date().toISOString(),
  };
}
