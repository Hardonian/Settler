/**
 * TigerBeetle Live Parity Invariant Monitor
 *
 * Provides real-time continuous invariant verification across dual-ledger topologies:
 * 1. Double-Entry Balance Parity: sum(posted_debits) == sum(posted_credits)
 * 2. Two-Phase Invariant: sum(pending_debits) == sum(pending_credits)
 * 3. Cross-Ledger Parity: TigerBeetle settlement clearing account volume == Relational Postgres matched volume
 *
 * Implements strict tenant scoping and deterministic drift telemetry.
 */

import crypto from "crypto";
import {
  TigerBeetleCDCService,
  AccountBalanceSnapshot,
  BalanceParityReport,
} from "./tigerbeetle-cdc-service";
import { logInfo, logWarn, logError } from "../../utils/logger";

export interface LedgerParityProof {
  proofId: string;
  tenantId: string;
  epoch: number;
  isBalanced: boolean;
  driftDetected: boolean;
  driftMagnitudeCents: number;
  driftRootCause?: "TIMING_SKEW_PENDING" | "RELATIONAL_DROP" | "ORPHAN_TRANSFER" | "NONE";
  tigerbeetlePostedDebitCents: string;
  tigerbeetlePostedCreditCents: string;
  tigerbeetlePendingDebitCents: string;
  tigerbeetlePendingCreditCents: string;
  relationalMatchedVolumeCents: string;
  verifiedAt: string;
  epochMerkleRoot: string;
  signature: string;
}

export interface InvariantEvaluationOptions {
  relationalMatchedVolumeCents?: bigint;
  allowTimingSkew?: boolean;
}

export class TigerBeetleParityMonitor {
  private cdcService: TigerBeetleCDCService;
  private tenantProofs: Map<string, LedgerParityProof[]> = new Map();
  private lastVerificationTimes: Map<string, string> = new Map();

  constructor(cdcService?: TigerBeetleCDCService) {
    this.cdcService = cdcService ?? new TigerBeetleCDCService();
  }

  public getCDCService(): TigerBeetleCDCService {
    return this.cdcService;
  }

  /**
   * Evaluates all three core dual-ledger invariants for a specific tenant.
   */
  public async evaluateTenantInvariants(
    tenantId: string,
    options: InvariantEvaluationOptions = {}
  ): Promise<LedgerParityProof> {
    if (!tenantId) {
      throw new Error("Tenant ID is required for invariant evaluation");
    }

    // 1. Sync pending transfers via CDC service to refresh relational snapshots
    const syncResult = await this.cdcService.syncTenantBalances(tenantId);
    const parityReport: BalanceParityReport = syncResult.parityReport;
    const snapshots: AccountBalanceSnapshot[] = this.cdcService.listSnapshots(tenantId);

    // 2. Compute aggregate debit/credit quantities in native BigInt
    let totalPostedDebits = 0n;
    let totalPostedCredits = 0n;
    let totalPendingDebits = 0n;
    let totalPendingCredits = 0n;
    let clearingAccountVolume = 0n;

    for (const snap of snapshots) {
      totalPostedDebits += BigInt(snap.debitsPosted);
      totalPostedCredits += BigInt(snap.creditsPosted);
      totalPendingDebits += BigInt(snap.debitsPending);
      totalPendingCredits += BigInt(snap.creditsPending);

      if (snap.accountId.includes("clearing") || snap.accountId.includes("settlement")) {
        clearingAccountVolume += BigInt(snap.debitsPosted);
      }
    }

    // 3. Evaluate Invariants
    const doubleEntryBalanced = totalPostedDebits === totalPostedCredits;
    const twoPhaseBalanced = totalPendingDebits === totalPendingCredits;

    // Cross-ledger check (if relational volume provided)
    const expectedRelational = options.relationalMatchedVolumeCents ?? clearingAccountVolume;
    const crossLedgerDelta =
      clearingAccountVolume > expectedRelational
        ? clearingAccountVolume - expectedRelational
        : expectedRelational - clearingAccountVolume;

    const driftMagnitudeCents = Number(crossLedgerDelta);
    let driftDetected = !doubleEntryBalanced || !twoPhaseBalanced || driftMagnitudeCents > 0;
    let driftRootCause: LedgerParityProof["driftRootCause"] = "NONE";

    if (!doubleEntryBalanced) {
      driftDetected = true;
      driftRootCause = "ORPHAN_TRANSFER";
      logError(
        "Dual-ledger invariant breach: sum(debits) != sum(credits)",
        new Error("Imbalanced"),
        {
          tenantId,
          totalPostedDebits: totalPostedDebits.toString(),
          totalPostedCredits: totalPostedCredits.toString(),
        }
      );
    } else if (!twoPhaseBalanced) {
      driftDetected = true;
      driftRootCause = "TIMING_SKEW_PENDING";
      logWarn("Pending two-phase balance skew detected across accounts", {
        tenantId,
        totalPendingDebits: totalPendingDebits.toString(),
        totalPendingCredits: totalPendingCredits.toString(),
      });
    } else if (driftMagnitudeCents > 0) {
      driftDetected = true;
      driftRootCause = "RELATIONAL_DROP";
      logWarn(
        "Cross-ledger discrepancy between TigerBeetle clearing and Postgres relational volume",
        {
          tenantId,
          driftMagnitudeCents,
        }
      );
    }

    // 4. Generate deterministic epoch Merkle root
    const epochMerkleRoot = parityReport.epochRootHash;

    // 5. Sign the attestation proof
    const verifiedAt = new Date().toISOString();
    const proofId = `proof_tb_${crypto.randomUUID()}`;
    const secret =
      process.env.PROOF_COMMITMENT_SECRET || "settler-tigerbeetle-invariants-master-key";
    const signaturePayload = `${proofId}:${tenantId}:${parityReport.epoch}:${epochMerkleRoot}:${!driftDetected}:${driftMagnitudeCents}`;
    const signature = crypto.createHmac("sha256", secret).update(signaturePayload).digest("hex");

    const proof: LedgerParityProof = {
      proofId,
      tenantId,
      epoch: parityReport.epoch,
      isBalanced: doubleEntryBalanced && twoPhaseBalanced,
      driftDetected,
      driftMagnitudeCents,
      driftRootCause,
      tigerbeetlePostedDebitCents: totalPostedDebits.toString(),
      tigerbeetlePostedCreditCents: totalPostedCredits.toString(),
      tigerbeetlePendingDebitCents: totalPendingDebits.toString(),
      tigerbeetlePendingCreditCents: totalPendingCredits.toString(),
      relationalMatchedVolumeCents: expectedRelational.toString(),
      verifiedAt,
      epochMerkleRoot,
      signature,
    };

    // Store proof in historical memory
    if (!this.tenantProofs.has(tenantId)) {
      this.tenantProofs.set(tenantId, []);
    }
    this.tenantProofs.get(tenantId)!.unshift(proof);
    if (this.tenantProofs.get(tenantId)!.length > 50) {
      this.tenantProofs.get(tenantId)!.pop();
    }
    this.lastVerificationTimes.set(tenantId, verifiedAt);

    logInfo("Completed TigerBeetle dual-ledger parity check", {
      tenantId,
      epoch: parityReport.epoch,
      isBalanced: proof.isBalanced,
      driftDetected: proof.driftDetected,
    });

    return proof;
  }

  /**
   * Retrieves historical proofs for a tenant
   */
  public getTenantProofs(tenantId: string): LedgerParityProof[] {
    return this.tenantProofs.get(tenantId) ?? [];
  }

  /**
   * Returns latest parity status overview
   */
  public getParityStatus(tenantId: string): {
    tenantId: string;
    lastVerifiedAt: string | null;
    latestProof: LedgerParityProof | null;
    accountCount: number;
    healthy: boolean;
  } {
    const proofs = this.getTenantProofs(tenantId);
    const latestProof = proofs.length > 0 ? proofs[0]! : null;
    const snapshots = this.cdcService.listSnapshots(tenantId);

    return {
      tenantId,
      lastVerifiedAt: this.lastVerificationTimes.get(tenantId) ?? null,
      latestProof,
      accountCount: snapshots.length,
      healthy: latestProof ? !latestProof.driftDetected : true,
    };
  }
}

export const tigerBeetleParityMonitor = new TigerBeetleParityMonitor();
