/**
 * Proof Package Orchestrator
 *
 * Assembles verifiable "Proof Packages" for reconciliation runs.
 * Incorporates snapshots, provenance, adjudications, and evidence artifacts.
 *
 * Purpose: Move from "Trust us, it's matched" to "Here is the proof of the match".
 */

import crypto from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import { logInfo } from "../../utils/logger";

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
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
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

    if (!run || run.tenantId !== tenantId) {
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

    // 3. Generate Package Key
    const packageKey = `proof:${packageType}:${runId}:${Date.now()}`;

    // 4. Compute Completeness Score
    const completenessScore = this.computeCompletenessScore(run, artifacts);

    // 5. Generate Narrative if not provided
    const narrative = request.narrative || this.generateDefaultNarrative(run);

    // 6. Build Package Summary
    const summary = {
      runId,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
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
    const packageHash = this.computePackageHash(summary, evidenceIds, narrative);

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
    return (
      `Reconciliation run completed on ${run.completedAt?.toLocaleString()}. ` +
      `Analyzed ${run.sourceCount} source records and ${run.targetCount} target records. ` +
      `Successfully matched ${run.matchedCount} items (${((run.matchedCount / run.sourceCount) * 100).toFixed(1)}%). ` +
      `${run.unmatchedSourceCount + run.unmatchedTargetCount} exceptions were identified and processed.`
    );
  }

  private computePackageHash(summary: any, evidenceIds: string[], narrative: string): string {
    const payload = JSON.stringify({
      summary,
      evidenceIds: evidenceIds.sort(),
      narrative,
      salt: "settler_moat_v1",
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }
}
