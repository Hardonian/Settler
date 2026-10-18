/**
 * Proof Package Orchestrator
 *
 * Assembles verifiable "Proof Packages" for reconciliation runs.
 * Incorporates snapshots, provenance, adjudications, and evidence artifacts.
 *
 * Purpose: Move from "Trust us, it's matched" to "Here is the proof of the match".
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { logInfo } from "../../utils/logger";
import { canonicalSha256 } from "@settler/proofs";

export interface ProofPackageRequest {
  tenantId: string;
  runId: string;
  packageType: "run_summary" | "exception_resolution" | "audit_export";
  narrative?: string;
  requestedBy: string;
}

export interface ProofPackageResult {
  id: string;
  packageKey: string;
  completenessScore: number;
  packageHash: string;
  evidenceCount: number;
}

export class ProofPackageOrchestrator {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Assemble a comprehensive proof package for a reconciliation run
   */
  async assembleProofPackage(request: ProofPackageRequest): Promise<ProofPackageResult> {
    const { tenantId, runId, packageType, requestedBy } = request;

    logInfo(`Assembling proof package for run ${runId}`, { tenantId, packageType });

    // 1. Fetch Run and related data
    const run = await this.prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        matches: {
          include: {
            adjudicationMemories: true,
            provenance: true,
          },
        },
        provenance: true,
      },
    });

    if (!run) {
      throw new Error(`Reconciliation run ${runId} not found or access denied`);
    }

    // 2. Collect Evidence Artifacts
    const artifacts = await this.prisma.evidenceArtifact.findMany({
      where: {
        tenantId,
        runId: runId,
      },
    });

    const evidenceIds = artifacts.map((a) => a.id);

    // Non-deterministic identifier boundary; excluded from the cryptographic commitment.
    const packageKey = `proof:${packageType}:${runId}:${Date.now()}`;

    // 4. Compute Completeness Score
    const completenessScore = this.computeCompletenessScore(run, artifacts);

    // 5. Generate Narrative if not provided
    const narrative = request.narrative || this.generateDefaultNarrative(run);

    // 6. Build Package Summary
    const summary = {
      runId,
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      sourceCount: run.sourceCount,
      targetCount: run.targetCount,
      matchedCount: run.matchedCount,
      unmatchedSourceCount: run.unmatchedSourceCount,
      unmatchedTargetCount: run.unmatchedTargetCount,
      matchRate: run.sourceCount > 0 ? run.matchedCount / run.sourceCount : 0,
      evidenceArtifactCount: artifacts.length,
      adjudicationCount: run.matches.reduce((acc, m) => acc + m.adjudicationMemories.length, 0),
    };

    // 7. Compute Integrity Hash
    const packageHash = this.computePackageHash(
      tenantId,
      runId,
      packageType,
      summary,
      evidenceIds,
      narrative
    );

    // 8. Create Proof Package Record
    const proofPackage = await this.prisma.proofPackage.create({
      data: {
        tenantId,
        packageType,
        packageKey,
        evidenceIds: evidenceIds as any,
        summary: summary as any,
        narrative,
        completenessScore: new Prisma.Decimal(completenessScore),
        packageHash,
        status: "finalized",
        finalizedAt: new Date(),
        scope: "run",
        scopeIds: [runId] as any,
        exportedBy: requestedBy,
      },
    });

    logInfo(`Finalized proof package ${proofPackage.id}`, { tenantId, packageHash });

    return {
      id: proofPackage.id,
      packageKey: proofPackage.packageKey,
      completenessScore,
      packageHash,
      evidenceCount: evidenceIds.length,
    };
  }

  private computeCompletenessScore(run: any, artifacts: any[]): number {
    let score = 0;

    // Factors for completeness
    const totalTransactions = run.sourceCount + run.targetCount;
    const hasProvenance = run.provenance.length > 0;
    const hasEvidence = artifacts.length > 0;
    const allMatchesAudited = run.matches.every((m: any) => m.matchType === "exact" || m.reviewed);

    if (totalTransactions > 0) score += 0.3;
    if (hasProvenance) score += 0.2;
    if (hasEvidence) score += 0.2;
    if (allMatchesAudited) score += 0.3;

    return Math.min(score, 1.0);
  }

  private generateDefaultNarrative(run: any): string {
    const matchRate = run.sourceCount > 0 ? (run.matchedCount / run.sourceCount) * 100 : 0;
    return (
      `Reconciliation run completed on ${run.completedAt?.toISOString() ?? "unknown"}. ` +
      `Analyzed ${run.sourceCount} source records and ${run.targetCount} target records. ` +
      `Successfully matched ${run.matchedCount} items (${matchRate.toFixed(1)}%). ` +
      `${run.unmatchedSourceCount + run.unmatchedTargetCount} exceptions were identified and processed.`
    );
  }

  private computePackageHash(
    tenantId: string,
    runId: string,
    packageType: string,
    summary: any,
    evidenceIds: string[],
    narrative: string
  ): string {
    return canonicalSha256({
      domain: "settler:proof-package:v2",
      tenantId,
      runId,
      packageType,
      summary,
      evidenceIds: [...evidenceIds].sort(),
      narrative,
    });
  }

  /**
   * Validates the integrity of an existing proof package
   */
  async validateProofPackage(proofPackageId: string, tenantId: string): Promise<boolean> {
    const pkg = await this.prisma.proofPackage.findFirst({
      where: { id: proofPackageId, tenantId },
    });

    if (!pkg) {
      logInfo(`[ProofPackage] Validation failed: Package not found or unauthorized`, {
        proofPackageId,
        tenantId,
        validationResult: "failed_not_found",
      });
      return false;
    }

    const recomputedHash = this.computePackageHash(
      tenantId,
      String((pkg.scopeIds as string[] | null)?.[0] ?? ""),
      pkg.packageType,
      pkg.summary,
      (pkg.evidenceIds as string[]) || [],
      pkg.narrative || ""
    );

    const isValid = recomputedHash === pkg.packageHash;

    logInfo(`[ProofPackage] Validation completed`, {
      validation: {
        proofPackageId,
        tenantId,
        originalHash: pkg.packageHash,
        recomputedHash,
        isValid,
      },
    });

    return isValid;
  }
}

/**
 * Binds ProofPackage and linked EvidenceArtifact rows in reconciliation run & bilateral Merkle root completion
 */
export async function createRunProofPackageWithArtifacts(
  prisma: PrismaClient,
  params: {
    tenantId: string;
    runId: string;
    merkleRoot?: string;
    inputFingerprint?: string;
    outputFingerprint?: string;
    ruleSetHash?: string;
    sourceBatch?: unknown;
    settlementManifest?: unknown;
    smtProofBranches?: unknown;
    packageType?: string;
  }
): Promise<{ proofPackageId: string; evidenceIds: string[]; packageHash: string }> {
  const { tenantId, runId, merkleRoot, inputFingerprint, outputFingerprint, ruleSetHash } = params;
  const evidenceArtifactModel = prisma.evidenceArtifact;
  const proofPackageModel = prisma.proofPackage;

  const evidenceIds: string[] = [];

  for (const [name, value] of [
    ["merkleRoot", merkleRoot],
    ["inputFingerprint", inputFingerprint],
    ["outputFingerprint", outputFingerprint],
    ["ruleSetHash", ruleSetHash],
  ] as const) {
    if (!value || !/^(?:sha256:)?[0-9a-f]{64}$/i.test(value)) {
      throw new Error(`${name} must be a SHA-256 commitment`);
    }
  }

  // 1. Source batch manifest artifact
  const sourcePayload = params.sourceBatch ?? {
    runId,
    tenantId,
    inputFingerprint,
  };
  const sourceHash = canonicalSha256(sourcePayload);
  const sourceArtifact = await evidenceArtifactModel.create({
    data: {
      tenantId,
      artifactType: "source_batch_manifest",
      artifactKey: `run:${runId}:source_batch:${Date.now()}`,
      payload: sourcePayload as Prisma.InputJsonValue,
      payloadHash: sourceHash,
      payloadSizeBytes: Buffer.byteLength(JSON.stringify(sourcePayload), "utf8"),
      sourceType: "source_batch",
      sourceId: runId,
      runId,
      reliabilityScore: 1,
      degraded: false,
    },
  });
  evidenceIds.push(sourceArtifact.id);

  // 2. Settlement manifest artifact
  const settlementPayload = params.settlementManifest ?? {
    runId,
    tenantId,
    outputFingerprint,
    ruleSetHash,
  };
  const settlementHash = canonicalSha256(settlementPayload);
  const settlementArtifact = await evidenceArtifactModel.create({
    data: {
      tenantId,
      artifactType: "settlement_manifest",
      artifactKey: `run:${runId}:settlement_manifest:${Date.now()}`,
      payload: settlementPayload as Prisma.InputJsonValue,
      payloadHash: settlementHash,
      payloadSizeBytes: Buffer.byteLength(JSON.stringify(settlementPayload), "utf8"),
      sourceType: "settlement_manifest",
      sourceId: runId,
      runId,
      reliabilityScore: 1,
      degraded: false,
    },
  });
  evidenceIds.push(settlementArtifact.id);

  // 3. Sparse Merkle Tree proof branches
  const smtPayload = params.smtProofBranches ?? {
    runId,
    tenantId,
    merkleRoot,
    depth: 256,
    verifiedBranches: false,
    reason: "proof_branches_not_supplied",
  };
  const smtHash = canonicalSha256(smtPayload);
  const smtArtifact = await evidenceArtifactModel.create({
    data: {
      tenantId,
      artifactType: "smt_proof_branches",
      artifactKey: `run:${runId}:smt_proof_branches:${Date.now()}`,
      payload: smtPayload as Prisma.InputJsonValue,
      payloadHash: smtHash,
      payloadSizeBytes: Buffer.byteLength(JSON.stringify(smtPayload), "utf8"),
      sourceType: "smt_engine",
      sourceId: runId,
      runId,
      reliabilityScore: params.smtProofBranches === undefined ? 0 : 0.5,
      degraded: true,
      degradedReason: "SMT branches require kernel verification before finalization",
    },
  });
  evidenceIds.push(smtArtifact.id);

  // 4. Create relational ProofPackage record
  const packageType = params.packageType || "run_summary";
  const packageKey = `proof:${packageType}:${runId}:${Date.now()}`;
  const summaryPayload = {
    runId,
    merkleRoot,
    inputFingerprint,
    outputFingerprint,
    ruleSetHash,
    evidenceCount: evidenceIds.length,
    verificationState: "pending_kernel_verification",
  };

  const packageHash = canonicalSha256({
    domain: "settler:proof-package:v2",
    tenantId,
    runId,
    packageType,
    summary: summaryPayload,
    evidenceHashes: [sourceHash, settlementHash, smtHash].sort(),
  });

  const proofPackage = await proofPackageModel.create({
    data: {
      tenantId,
      packageType,
      packageKey,
      evidenceIds: evidenceIds as any,
      summary: summaryPayload as Prisma.InputJsonValue,
      narrative: `Draft proof package for run ${runId}; SMT branches require kernel verification.`,
      completenessScore: params.smtProofBranches === undefined ? 0.67 : 0.8,
      packageHash,
      status: "draft",
      finalizedAt: null,
      scope: "run",
      scopeIds: [runId] as any,
      metadata: {
        runId,
        merkleRoot,
        inputFingerprint,
        outputFingerprint,
        ruleSetHash,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    proofPackageId: proofPackage.id,
    evidenceIds,
    packageHash,
  };
}
