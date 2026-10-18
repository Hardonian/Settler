/**
 * Autonomous Continuous Settlement Daemon (Phase 4 & Beyond)
 *
 * Sovereign financial automation service:
 * 1. Executes 3-way triangular reconciliation across streaming order, gateway, and bank legs.
 * 2. Autonomously routes detected fee discrepancies and unsettled captures into Revenue OS dispute claims.
 * 3. Mines recurring exception patterns to synthesize draft policy rules.
 * 4. Generates deterministic SHA-256 Merkle root proofs per settlement epoch.
 *
 * Strict Multi-Tenancy Invariant: Every execution requires and enforces tenantId.
 */

import crypto from "crypto";
import {
  reconcileTriangular,
  OrderRecord,
  GatewayCaptureRecord,
  TriangularReconciliationResult,
} from "@settler/reconciliation-core";
import { synthesizeRulesFromAdjudications, AdjudicationMemoryRecord } from "@settler/edge-ai-core";
import {
  revenueOsRecoveryService,
  DiscrepancyInputItem,
} from "../recovery/revenue-os-recovery-service";

export interface DaemonCycleRequest {
  tenantId: string;
  orders: any[];
  captures: any[];
  sweeps: any[];
  adjudicationHistory?: AdjudicationMemoryRecord[];
}

export interface DaemonCycleResult {
  cycleId: string;
  tenantId: string;
  executedAt: string;
  triangularResult: {
    totalTriangles: number;
    perfectMatches: number;
    timingDrift: number;
    feeVariance: number;
    unsettledLegs: number;
    stateRoot: string;
  };
  recoveryClaimsGenerated: Array<{
    claimId: string;
    processor: string;
    amountCents: number;
    type: string;
  }>;
  synthesizedRulesCount: number;
  aggregateEpochRoot: string;
  status: "COMPLETED" | "PARTIAL_DRIFT";
}

export class AutoSettlementDaemon {
  private static instance: AutoSettlementDaemon;

  public static getInstance(): AutoSettlementDaemon {
    if (!AutoSettlementDaemon.instance) {
      AutoSettlementDaemon.instance = new AutoSettlementDaemon();
    }
    return AutoSettlementDaemon.instance;
  }

  /**
   * Run an autonomous settlement cycle for a tenant
   */
  public async executeCycle(request: DaemonCycleRequest): Promise<DaemonCycleResult> {
    if (!request.tenantId) {
      throw new Error("Tenant mismatch: tenantId is required for autonomous settlement daemon");
    }

    const cycleId = `cycle_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const executedAt = new Date().toISOString();

    // Normalize and convert BigInt amounts from incoming JSON
    const parsedOrders: OrderRecord[] = (request.orders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber || o.orderReference || o.id,
      amountCents: BigInt(o.amountCents ?? 0),
      currency: o.currency || "USD",
      timestamp: o.timestamp || o.orderedAt || new Date().toISOString(),
      customerId: o.customerId,
      metadata: o.metadata,
    }));

    const parsedCaptures: GatewayCaptureRecord[] = (request.captures || []).map((c: any) => {
      const gross = BigInt(c.grossAmountCents ?? c.capturedAmountCents ?? 0);
      const fee = BigInt(c.feeCents ?? c.feeDeductedCents ?? 0);
      return {
        id: c.id,
        orderNumber: c.orderNumber || c.orderReference,
        gatewayTransactionId: c.gatewayTransactionId || c.id,
        grossAmountCents: gross,
        feeCents: fee,
        netAmountCents: c.netAmountCents ? BigInt(c.netAmountCents) : gross - fee,
        currency: c.currency || "USD",
        timestamp: c.timestamp || c.capturedAt || new Date().toISOString(),
        payoutBatchId: c.payoutBatchId,
        metadata: c.metadata,
      };
    });

    const parsedSweeps = (request.sweeps || []).map((s: any) => ({
      id: s.id,
      payoutBatchId: s.payoutBatchId || s.batchId,
      reference: s.reference || s.gatewayBatchReference || s.bankStatementLineId || s.id,
      depositAmountCents: BigInt(s.depositAmountCents ?? s.netDepositAmountCents ?? 0),
      currency: s.currency || "USD",
      timestamp: s.timestamp || s.settledAt || new Date().toISOString(),
      metadata: s.metadata,
    }));

    // 1. Triangular 3-Way Reconciliation
    const triResult: TriangularReconciliationResult = reconcileTriangular(
      parsedOrders,
      parsedCaptures,
      parsedSweeps,
      {
        tenantId: request.tenantId,
        toleranceCents: 0n,
      }
    );

    // 2. Autonomous Revenue OS Discrepancy Recovery Pipeline
    const recoveryClaimsGenerated: Array<{
      claimId: string;
      processor: string;
      amountCents: number;
      type: string;
    }> = [];

    const items: DiscrepancyInputItem[] = [];

    for (let idx = 0; idx < triResult.feeVariances.length; idx++) {
      const t = triResult.feeVariances[idx]!;
      const isStripe = t.gatewayCapture.gatewayTransactionId.startsWith("ch_");
      items.push({
        id: `disc_fee_${cycleId}_${idx}`,
        rootCause: "PROCESSOR_FEE_DEDUCTION",
        sourceAmount: Number(t.order.amountCents) / 100,
        varianceAmount: Number(t.varianceCents) / 100,
        currency: t.order.currency,
        processorName: isStripe ? "STRIPE" : "GENERIC",
        capturedAt: String(t.gatewayCapture.timestamp),
        sourceReferenceId: t.gatewayCapture.gatewayTransactionId,
      });
    }

    for (let idx = 0; idx < triResult.unsettledLegs.length; idx++) {
      const leg = triResult.unsettledLegs[idx]!;
      items.push({
        id: `disc_unsettled_${cycleId}_${idx}`,
        rootCause: "UNKNOWN_DISCREPANCY",
        sourceAmount: Number(leg.amountCents) / 100,
        varianceAmount: Number(leg.amountCents) / 100,
        currency: leg.currency,
        processorName: "GENERIC",
        capturedAt: String(leg.timestamp),
        sourceReferenceId: leg.recordId,
      });
    }

    if (items.length > 0) {
      // Generate claims through Revenue OS Recovery Service
      const claims = revenueOsRecoveryService.generateClaimsFromDiscrepancies(
        request.tenantId,
        items
      );

      for (const claim of claims) {
        recoveryClaimsGenerated.push({
          claimId: claim.id,
          processor: claim.processorName,
          amountCents: claim.totalClaimAmountMinorUnits,
          type: claim.claimType,
        });
      }
    }

    // 3. Exception Adjudication Mining & Rule Synthesis
    let synthesizedRulesCount = 0;
    if (request.adjudicationHistory && request.adjudicationHistory.length > 0) {
      const synthesized = synthesizeRulesFromAdjudications(
        request.adjudicationHistory,
        request.tenantId
      );
      synthesizedRulesCount = synthesized.length;
    }

    // 4. Compute Aggregate Epoch Root
    const aggregateEpochRoot = crypto
      .createHash("sha256")
      .update(
        `${request.tenantId}:${cycleId}:${triResult.metrics.merkleRoot}:${recoveryClaimsGenerated.length}:${synthesizedRulesCount}`
      )
      .digest("hex");

    return {
      cycleId,
      tenantId: request.tenantId,
      executedAt,
      triangularResult: {
        totalTriangles:
          triResult.perfectMatches.length +
          triResult.timingDrifts.length +
          triResult.feeVariances.length,
        perfectMatches: triResult.perfectMatches.length,
        timingDrift: triResult.timingDrifts.length,
        feeVariance: triResult.feeVariances.length,
        unsettledLegs: triResult.unsettledLegs.length,
        stateRoot: triResult.metrics.merkleRoot,
      },
      recoveryClaimsGenerated,
      synthesizedRulesCount,
      aggregateEpochRoot,
      status: triResult.unsettledLegs.length === 0 ? "COMPLETED" : "PARTIAL_DRIFT",
    };
  }
}

export const autoSettlementDaemon = AutoSettlementDaemon.getInstance();
