/**
 * Cross-Rail Settlement Graph & Multi-Processor Arbitrage Engine
 *
 * The neutral cryptographic referee across Payment Processors (Stripe, PayPal, Adyen),
 * Open-Banking Settlement Feeds (Plaid / ISO 20022 camt.053), and ERP General Ledgers.
 *
 * Capabilities that no single rail (Stripe, Plaid, or PayPal) can execute in isolation:
 * 1. Cross-Rail Double-Credit / Chargeback + Refund Arbitrage Detection:
 *    Detects when an order suffers both a card-network chargeback on one processor/flow
 *    and an RMA/API refund or credit across another flow (200% principal loss).
 * 2. Rolling Reserve & Holdback Waterfall Decomposition:
 *    Decomposes Plaid bank deposits into Gross Captures, Contractual Fees, Hidden Fee/FX
 *    Slippage, Refunds, Chargebacks, Rolling Reserve Withheld, and Matured Reserve Released.
 * 3. Multi-Rail Effective Take-Rate & Hidden FX Spread Telemetry:
 *    Computes true all-in cost of acceptance in basis points (bps) per rail (contractual bps +
 *    scheme/downgrade slippage bps + embedded FX spread bps + dispute drag bps).
 * 4. RFC 6962 Domain-Separated Merkle Attestation (0x00 leaf / 0x01 internal node).
 */

import { createHash } from "node:crypto";

export type SettlementRailId = "stripe" | "paypal" | "adyen" | "braintree" | "checkout" | "custom";

export type CrossRailEventKind =
  "CAPTURE" | "REFUND" | "CHARGEBACK" | "CHARGEBACK_REVERSAL" | "RESERVE_HOLD" | "RESERVE_RELEASE";

export interface CrossRailProcessorEvent {
  id: string;
  tenantId: string;
  rail: SettlementRailId;
  payoutBatchId: string;
  orderId: string;
  customerId?: string;
  arn?: string;
  kind: CrossRailEventKind;
  /** Gross amount in settlement currency minor units (e.g. USD cents) */
  grossAmountCents: bigint;
  /** Contractual processor fee expected in minor units */
  contractualFeeCents: bigint;
  /** Actual processor fee deducted in minor units */
  actualFeeCents: bigint;
  /** Embedded FX spread loss vs. mid-market rate in minor units (0n if same-currency) */
  fxSpreadLossCents?: bigint;
  currency: string;
  occurredAt: string;
}

export interface PlaidBankSettlementSweep {
  plaidTransactionId: string;
  tenantId: string;
  rail: SettlementRailId;
  payoutBatchId: string;
  achTraceNumber?: string;
  bankDescriptor: string;
  depositedAmountCents: bigint;
  currency: string;
  settledAt: string;
}

export interface CrossRailArbitrageAlert {
  alertType:
    | "CROSS_RAIL_DOUBLE_REFUND_CHARGEBACK"
    | "DUPLICATE_CROSS_RAIL_REFUND"
    | "UNEXPLAINED_PAYOUT_SHORTFALL"
    | "EXCESSIVE_FX_SPREAD_DRIFT";
  severity: "HIGH" | "CRITICAL";
  orderId: string;
  railsInvolved: SettlementRailId[];
  eventIds: string[];
  exposureCents: bigint;
  explanation: string;
}

export interface PayoutWaterfallDecomposition {
  payoutBatchId: string;
  rail: SettlementRailId;
  plaidTransactionId: string | null;
  grossCapturesCents: bigint;
  contractualFeesCents: bigint;
  feeSlippageCents: bigint;
  fxSpreadLossCents: bigint;
  refundsCents: bigint;
  chargebacksCents: bigint;
  reserveWithheldCents: bigint;
  reserveReleasedCents: bigint;
  expectedBankDepositCents: bigint;
  actualBankDepositCents: bigint;
  unexplainedVarianceCents: bigint;
  status: "PENNY_EXACT" | "SLIPPAGE_EXPLAINED" | "VARIANCE_BREAK" | "IN_TRANSIT";
  leafHash: string;
}

export interface RailTakeRateBenchmark {
  rail: SettlementRailId;
  grossVolumeCents: bigint;
  contractualFeeBps: number;
  feeSlippageBps: number;
  fxSpreadBps: number;
  disputeDragBps: number;
  effectiveAllInTakeRateBps: number;
  recoverableLeakageCents: bigint;
}

export interface CrossRailSettlementGraphReport {
  tenantId: string;
  currency: string;
  waterfalls: PayoutWaterfallDecomposition[];
  arbitrageAlerts: CrossRailArbitrageAlert[];
  railBenchmarks: RailTakeRateBenchmark[];
  recommendedPrimaryRail: SettlementRailId | null;
  summary: {
    totalGrossCapturesCents: bigint;
    totalBankDepositedCents: bigint;
    totalRecoverableLeakageCents: bigint;
    totalArbitrageExposureCents: bigint;
    netRollingReserveBalanceCents: bigint;
  };
  merkleRootSha256: string;
}

function rfc6962Leaf(payload: string): string {
  return createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(payload, "utf8")]))
    .digest("hex");
}

function rfc6962Node(leftHex: string, rightHex: string): string {
  return createHash("sha256")
    .update(
      Buffer.concat([
        Buffer.from([0x01]),
        Buffer.from(leftHex, "hex"),
        Buffer.from(rightHex, "hex"),
      ])
    )
    .digest("hex");
}

function computeRfc6962MerkleRoot(leafHashes: string[]): string {
  if (leafHashes.length === 0) {
    return createHash("sha256")
      .update(Buffer.from([0x00]))
      .digest("hex");
  }
  let level = [...leafHashes].sort();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]!;
      const right = i + 1 < level.length ? level[i + 1]! : left;
      next.push(rfc6962Node(left, right));
    }
    level = next;
  }
  return level[0]!;
}

function toBps(numeratorCents: bigint, denominatorCents: bigint): number {
  if (denominatorCents <= 0n) return 0;
  return Number((numeratorCents * 100000n) / denominatorCents) / 10;
}

export function analyzeCrossRailSettlementGraph(input: {
  tenantId: string;
  currency?: string;
  processorEvents: CrossRailProcessorEvent[];
  plaidSweeps: PlaidBankSettlementSweep[];
}): CrossRailSettlementGraphReport {
  const { tenantId } = input;
  if (!tenantId || !tenantId.trim()) {
    throw new Error("tenantId is required");
  }
  const currency = (input.currency ?? "USD").toUpperCase();

  for (const ev of input.processorEvents) {
    if (ev.tenantId !== tenantId) {
      throw new Error(`Tenant mismatch on processor event ${ev.id}`);
    }
  }
  for (const sweep of input.plaidSweeps) {
    if (sweep.tenantId !== tenantId) {
      throw new Error(`Tenant mismatch on Plaid sweep ${sweep.plaidTransactionId}`);
    }
  }

  // 1. Index Plaid sweeps by payoutBatchId
  const sweepByBatchId = new Map<string, PlaidBankSettlementSweep>();
  for (const sweep of input.plaidSweeps) {
    sweepByBatchId.set(sweep.payoutBatchId, sweep);
  }

  // 2. Group processor events by payoutBatchId and by orderId (for cross-rail arbitrage detection)
  const eventsByBatchId = new Map<string, CrossRailProcessorEvent[]>();
  const eventsByOrderId = new Map<string, CrossRailProcessorEvent[]>();
  const eventsByRail = new Map<SettlementRailId, CrossRailProcessorEvent[]>();

  for (const ev of input.processorEvents) {
    const batchList = eventsByBatchId.get(ev.payoutBatchId);
    if (batchList) batchList.push(ev);
    else eventsByBatchId.set(ev.payoutBatchId, [ev]);

    const orderList = eventsByOrderId.get(ev.orderId);
    if (orderList) orderList.push(ev);
    else eventsByOrderId.set(ev.orderId, [ev]);

    const railList = eventsByRail.get(ev.rail);
    if (railList) railList.push(ev);
    else eventsByRail.set(ev.rail, [ev]);
  }

  // 3. Decompose each Payout Batch into a Penny-Exact Waterfall
  const waterfalls: PayoutWaterfallDecomposition[] = [];
  const sortedBatchIds = [...eventsByBatchId.keys()].sort();

  let totalGrossCapturesCents = 0n;
  let totalBankDepositedCents = 0n;
  let netRollingReserveBalanceCents = 0n;

  const arbitrageAlerts: CrossRailArbitrageAlert[] = [];

  for (const batchId of sortedBatchIds) {
    const batchEvents = eventsByBatchId.get(batchId)!;
    const rail = batchEvents[0]!.rail;
    const sweep = sweepByBatchId.get(batchId) ?? null;

    let grossCapturesCents = 0n;
    let contractualFeesCents = 0n;
    let actualFeesCents = 0n;
    let fxSpreadLossCents = 0n;
    let refundsCents = 0n;
    let chargebacksCents = 0n;
    let reserveWithheldCents = 0n;
    let reserveReleasedCents = 0n;

    for (const ev of batchEvents) {
      const fxLoss = ev.fxSpreadLossCents ?? 0n;
      fxSpreadLossCents += fxLoss;
      contractualFeesCents += ev.contractualFeeCents;
      actualFeesCents += ev.actualFeeCents;

      switch (ev.kind) {
        case "CAPTURE":
          grossCapturesCents += ev.grossAmountCents;
          break;
        case "REFUND":
          refundsCents += ev.grossAmountCents;
          break;
        case "CHARGEBACK":
          chargebacksCents += ev.grossAmountCents;
          break;
        case "CHARGEBACK_REVERSAL":
          chargebacksCents -= ev.grossAmountCents;
          break;
        case "RESERVE_HOLD":
          reserveWithheldCents += ev.grossAmountCents;
          break;
        case "RESERVE_RELEASE":
          reserveReleasedCents += ev.grossAmountCents;
          break;
      }
    }

    const feeSlippageCents =
      actualFeesCents > contractualFeesCents ? actualFeesCents - contractualFeesCents : 0n;

    // Net cash expected to hit the corporate bank account via Plaid
    const expectedBankDepositCents =
      grossCapturesCents -
      actualFeesCents -
      fxSpreadLossCents -
      refundsCents -
      chargebacksCents -
      reserveWithheldCents +
      reserveReleasedCents;

    const actualBankDepositCents = sweep ? sweep.depositedAmountCents : 0n;
    const unexplainedVarianceCents = sweep
      ? actualBankDepositCents >= expectedBankDepositCents
        ? actualBankDepositCents - expectedBankDepositCents
        : expectedBankDepositCents - actualBankDepositCents
      : 0n;

    totalGrossCapturesCents += grossCapturesCents;
    totalBankDepositedCents += actualBankDepositCents;
    netRollingReserveBalanceCents += reserveWithheldCents - reserveReleasedCents;

    let status: PayoutWaterfallDecomposition["status"] = "IN_TRANSIT";
    if (sweep) {
      if (unexplainedVarianceCents > 0n) {
        status = "VARIANCE_BREAK";
        arbitrageAlerts.push({
          alertType: "UNEXPLAINED_PAYOUT_SHORTFALL",
          severity: "CRITICAL",
          orderId: batchId,
          railsInvolved: [rail],
          eventIds: batchEvents.map((e) => e.id),
          exposureCents: unexplainedVarianceCents,
          explanation: `Plaid bank sweep ${sweep.plaidTransactionId} (${actualBankDepositCents}c) differs from processor waterfall (${expectedBankDepositCents}c) by ${unexplainedVarianceCents}c.`,
        });
      } else if (feeSlippageCents > 0n || fxSpreadLossCents > 0n) {
        status = "SLIPPAGE_EXPLAINED";
      } else {
        status = "PENNY_EXACT";
      }
    }

    const leafHash = rfc6962Leaf(
      `${tenantId}:${batchId}:${rail}:${grossCapturesCents}:${actualFeesCents}:${fxSpreadLossCents}:${refundsCents}:${chargebacksCents}:${reserveWithheldCents}:${reserveReleasedCents}:${actualBankDepositCents}:${status}`
    );

    waterfalls.push({
      payoutBatchId: batchId,
      rail,
      plaidTransactionId: sweep?.plaidTransactionId ?? null,
      grossCapturesCents,
      contractualFeesCents,
      feeSlippageCents,
      fxSpreadLossCents,
      refundsCents,
      chargebacksCents,
      reserveWithheldCents,
      reserveReleasedCents,
      expectedBankDepositCents,
      actualBankDepositCents,
      unexplainedVarianceCents,
      status,
      leafHash,
    });
  }

  // 4. Detect Cross-Rail Double-Refund + Chargeback Arbitrage per Order
  const sortedOrderIds = [...eventsByOrderId.keys()].sort();
  for (const orderId of sortedOrderIds) {
    const orderEvents = eventsByOrderId.get(orderId)!;
    const refunds = orderEvents.filter((e) => e.kind === "REFUND");
    const chargebacks = orderEvents.filter((e) => e.kind === "CHARGEBACK");
    const reversals = orderEvents.filter((e) => e.kind === "CHARGEBACK_REVERSAL");

    if (refunds.length > 0 && chargebacks.length > reversals.length) {
      const railsInvolved = [...new Set(orderEvents.map((e) => e.rail))];
      const refundLoss = refunds.reduce((acc, r) => acc + r.grossAmountCents, 0n);
      arbitrageAlerts.push({
        alertType: "CROSS_RAIL_DOUBLE_REFUND_CHARGEBACK",
        severity: "CRITICAL",
        orderId,
        railsInvolved,
        eventIds: [...refunds, ...chargebacks].map((e) => e.id),
        exposureCents: refundLoss,
        explanation: `Order ${orderId} incurred both an active card-network chargeback and ${refunds.length} refund(s) across [${railsInvolved.join(", ")}], causing a duplicate principal outflow of ${refundLoss}c.`,
      });
    } else if (refunds.length > 1) {
      const captures = orderEvents.filter((e) => e.kind === "CAPTURE");
      const totalCaptured = captures.reduce((acc, c) => acc + c.grossAmountCents, 0n);
      const totalRefunded = refunds.reduce((acc, r) => acc + r.grossAmountCents, 0n);
      if (totalCaptured > 0n && totalRefunded > totalCaptured) {
        const railsInvolved = [...new Set(refunds.map((e) => e.rail))];
        const excessRefund = totalRefunded - totalCaptured;
        arbitrageAlerts.push({
          alertType: "DUPLICATE_CROSS_RAIL_REFUND",
          severity: "HIGH",
          orderId,
          railsInvolved,
          eventIds: refunds.map((e) => e.id),
          exposureCents: excessRefund,
          explanation: `Order ${orderId} was refunded ${totalRefunded}c across [${railsInvolved.join(", ")}] against ${totalCaptured}c captured (excess outflow: ${excessRefund}c).`,
        });
      }
    }
  }

  // 5. Compute Multi-Rail Effective Take-Rate Benchmarks
  const railBenchmarks: RailTakeRateBenchmark[] = [];
  let totalRecoverableLeakageCents = 0n;

  for (const [rail, railEvents] of eventsByRail.entries()) {
    let grossVolumeCents = 0n;
    let contractualFees = 0n;
    let feeSlippage = 0n;
    let fxSpread = 0n;
    let disputeFeeDrag = 0n;

    for (const ev of railEvents) {
      if (ev.kind === "CAPTURE") {
        grossVolumeCents += ev.grossAmountCents;
      }
      contractualFees += ev.contractualFeeCents;
      if (ev.actualFeeCents > ev.contractualFeeCents) {
        const slip = ev.actualFeeCents - ev.contractualFeeCents;
        if (ev.kind === "CHARGEBACK") {
          disputeFeeDrag += slip;
        } else {
          feeSlippage += slip;
        }
      }
      fxSpread += ev.fxSpreadLossCents ?? 0n;
    }

    const recoverableLeakageCents = feeSlippage + fxSpread + disputeFeeDrag;
    totalRecoverableLeakageCents += recoverableLeakageCents;

    const contractualFeeBps = toBps(contractualFees, grossVolumeCents);
    const feeSlippageBps = toBps(feeSlippage, grossVolumeCents);
    const fxSpreadBps = toBps(fxSpread, grossVolumeCents);
    const disputeDragBps = toBps(disputeFeeDrag, grossVolumeCents);
    const effectiveAllInTakeRateBps =
      Math.round((contractualFeeBps + feeSlippageBps + fxSpreadBps + disputeDragBps) * 10) / 10;

    railBenchmarks.push({
      rail,
      grossVolumeCents,
      contractualFeeBps,
      feeSlippageBps,
      fxSpreadBps,
      disputeDragBps,
      effectiveAllInTakeRateBps,
      recoverableLeakageCents,
    });
  }

  railBenchmarks.sort((a, b) => a.effectiveAllInTakeRateBps - b.effectiveAllInTakeRateBps);
  const recommendedPrimaryRail = railBenchmarks[0]?.rail ?? null;

  const totalArbitrageExposureCents = arbitrageAlerts.reduce((acc, a) => acc + a.exposureCents, 0n);

  const merkleRootSha256 = computeRfc6962MerkleRoot(waterfalls.map((w) => w.leafHash));

  return {
    tenantId,
    currency,
    waterfalls,
    arbitrageAlerts,
    railBenchmarks,
    recommendedPrimaryRail,
    summary: {
      totalGrossCapturesCents,
      totalBankDepositedCents,
      totalRecoverableLeakageCents,
      totalArbitrageExposureCents,
      netRollingReserveBalanceCents,
    },
    merkleRootSha256,
  };
}
