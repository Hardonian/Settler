/**
 * Truth Pack Registry
 *
 * Manages the generation and verification of "Truth Packs" — deterministic
 * snapshots of all variables (data, rules, config, models) that lead
 * to a reconciliation outcome.
 *
 * Moat: Prior-run comparison truth + Audit/Export trust.
 */

import { PrismaClient } from "@prisma/client";
import { canonicalSha256 } from "@settler/proofs";
import { logInfo } from "../../utils/logger";
import { createRunProofPackageWithArtifacts } from "./proof-package-orchestrator";

export interface TruthPack {
  fingerprint: string;
  runId: string;
  snapshotId: string;
  configHash: string;
  dataHash: string;
  ruleVersions: string[];
  engineVersion: string;
  timestamp: Date;
}

export class TruthPackRegistry {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a verifiable truth pack for a run
   */
  async sealTruthPack(runId: string, tenantId: string): Promise<TruthPack> {
    const run = await this.prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        ingestion: {
          include: {
            source: true,
          },
        },
      },
    });

    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    // Capture the snapshot of the world
    const snapshot = await this.prisma.runSnapshot.findFirst({
      where: { reconJobId: runId, tenantId }, // Assuming reconJobId links the snapshot for now
      orderBy: { createdAt: "desc" },
    });

    if (!snapshot) {
      // Degraded state: Create minimal snapshot if missing
      logInfo(`No snapshot found for run ${runId}, creating minimal truth pack`);
    }

    const configHash = snapshot?.jobConfig
      ? this.hashJson(snapshot.jobConfig)
      : "degraded:no_config";
    const dataHash = snapshot?.inputHash ?? "degraded:no_data_hash";
    const ruleVersions = (snapshot?.ruleVersions as string[]) ?? [];
    const engineVersion = snapshot?.engineVersion ?? "1.0.0";

    const fingerprint = this.computeFingerprint({
      runId,
      configHash,
      dataHash,
      ruleVersions,
      engineVersion,
      tenantId,
    });

    const truthPack: TruthPack = {
      fingerprint,
      runId,
      snapshotId: snapshot?.id ?? "manual_assembly",
      configHash,
      dataHash,
      ruleVersions,
      engineVersion,
      timestamp: new Date(),
    };

    // Store in metadata for now (or a dedicated table if we had one)
    await this.prisma.reconciliationRun.updateMany({
      where: { id: runId, tenantId },
      data: {
        metadata: {
          ...(run.metadata as any),
          truth_pack: truthPack,
        },
      },
    });

    const isSha256 = (value: string) => /^[0-9a-f]{64}$/i.test(value);
    if (isSha256(dataHash) && isSha256(configHash)) {
      await createRunProofPackageWithArtifacts(this.prisma, {
        tenantId,
        runId,
        merkleRoot: fingerprint,
        inputFingerprint: dataHash,
        outputFingerprint: fingerprint,
        ruleSetHash: configHash,
        packageType: "run_summary",
      });
    } else {
      logInfo(`Skipped proof package creation for degraded truth pack ${runId}`, { tenantId });
    }

    return truthPack;
  }

  /**
   * Compare two truth packs to explain divergence in outcomes
   */
  async explainDivergence(runIdA: string, runIdB: string, tenantId: string) {
    const packA = await this.getTruthPack(runIdA, tenantId);
    const packB = await this.getTruthPack(runIdB, tenantId);

    return {
      identical: packA.fingerprint === packB.fingerprint,
      differences: {
        configChanged: packA.configHash !== packB.configHash,
        dataChanged: packA.dataHash !== packB.dataHash,
        engineUpgraded: packA.engineVersion !== packB.engineVersion,
        rulesChanged: JSON.stringify(packA.ruleVersions) !== JSON.stringify(packB.ruleVersions),
      },
    };
  }

  private async getTruthPack(runId: string, tenantId: string): Promise<TruthPack> {
    const run = await this.prisma.reconciliationRun.findFirst({
      where: { id: runId, tenantId },
      select: { metadata: true },
    });

    const pack = (run?.metadata as any)?.truth_pack;
    if (!pack) throw new Error(`Truth pack not found for run ${runId}`);
    return pack as TruthPack;
  }

  private hashJson(obj: any): string {
    return canonicalSha256(obj);
  }

  private computeFingerprint(data: any): string {
    return canonicalSha256({ domain: "settler:truth-pack:v1", ...data });
  }
}
