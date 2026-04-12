/**
 * Truth Pack Registry
 *
 * Manages the generation and verification of "Truth Packs" — deterministic
 * snapshots of all variables (data, rules, config, models) that lead
 * to a reconciliation outcome.
 *
 * Moat: Prior-run comparison truth + Audit/Export trust.
 */

import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { logInfo } from "../../utils/logger";

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
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        ingestion: {
          include: {
            source: true,
          },
        },
      },
    });

    if (!run || run.tenantId !== tenantId) {
      throw new Error(`Run ${runId} not found`);
    }

    // Capture the snapshot of the world
    const snapshot = await this.prisma.runSnapshot.findFirst({
      where: { reconJobId: runId }, // Assuming reconJobId links the snapshot for now
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
    await this.prisma.reconciliationRun.update({
      where: { id: runId },
      data: {
        metadata: {
          ...(run.metadata as any),
          truth_pack: truthPack,
        },
      },
    });

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
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId, tenantId },
      select: { metadata: true },
    });

    const pack = (run?.metadata as any)?.truth_pack;
    if (!pack) throw new Error(`Truth pack not found for run ${runId}`);
    return pack as TruthPack;
  }

  private hashJson(obj: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
  }

  private computeFingerprint(data: any): string {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }
}
