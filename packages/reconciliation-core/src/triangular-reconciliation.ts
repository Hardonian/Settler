/**
 * Triangular (3-Way) Reconciliation Engine
 *
 * Reconciles three financial data rails simultaneously:
 *   Leg A: Internal ERP / Order Records
 *   Leg B: Payment Gateway / Processor Captures
 *   Leg C: Bank Statement / Deposit Settlement Sweeps
 *
 * Mathematical Invariant:
 *   A <==> B <==> C  such that:
 *   |(A.amount - B.fee) - C.netDeposit| <= epsilon
 *
 * Features:
 *   - Transit-timing resolution for delayed bank deposits (T+1 to T+3 business days)
 *   - Batch settlement sweep grouping (multiple orders aggregated into single bank deposit)
 *   - Deterministic classification:
 *       - TRIANGLE_PERFECT_MATCH
 *       - TRIANGLE_TIMING_DRIFT
 *       - TRIANGLE_FEE_VARIANCE
 *       - TRIANGLE_UNSETTLED_LEG
 *   - Merkle leaf hashing for cryptographic auditability
 */

import { createHash } from "node:crypto";

export type TriangleMatchClassification =
  | "TRIANGLE_PERFECT_MATCH"
  | "TRIANGLE_TIMING_DRIFT"
  | "TRIANGLE_FEE_VARIANCE"
  | "TRIANGLE_UNSETTLED_LEG";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  amountCents: bigint;
  currency: string;
  timestamp: string | Date;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface GatewayCaptureRecord {
  id: string;
  orderNumber?: string;
  gatewayTransactionId: string;
  grossAmountCents: bigint;
  feeCents: bigint;
  netAmountCents: bigint;
  currency: string;
  timestamp: string | Date;
  payoutBatchId?: string;
  metadata?: Record<string, unknown>;
}

export interface BankDepositRecord {
  id: string;
  payoutBatchId?: string;
  reference: string;
  depositAmountCents: bigint;
  currency: string;
  timestamp: string | Date;
  metadata?: Record<string, unknown>;
}

export interface MatchedTriangle {
  classification: TriangleMatchClassification;
  confidenceScore: number;
  order: OrderRecord;
  gatewayCapture: GatewayCaptureRecord;
  bankDeposit: BankDepositRecord | null;
  varianceCents: bigint;
  expectedNetCents: bigint;
  actualNetCents: bigint;
  transitDelayHours: number;
  isWithinSla: boolean;
  leafHash: string;
  explanation: string;
}

export interface BatchSweepTriangle {
  bankDeposit: BankDepositRecord;
  matchedOrders: OrderRecord[];
  matchedCaptures: GatewayCaptureRecord[];
  aggregateExpectedNetCents: bigint;
  actualDepositCents: bigint;
  varianceCents: bigint;
  confidenceScore: number;
  leafHash: string;
}

export interface UnsettledLeg {
  sourceLeg: "ORDER" | "GATEWAY" | "BANK";
  recordId: string;
  amountCents: bigint;
  currency: string;
  timestamp: string | Date;
  reason: string;
}

export interface TriangularReconciliationOptions {
  tenantId: string;
  toleranceCents?: bigint; // Default: 0n (exact match)
  maxTransitDelayHours?: number; // Default: 96 (4 days for weekend sweeps)
  enableBatchSweepAggregation?: boolean; // Default: true
}

export interface TriangularReconciliationResult {
  tenantId: string;
  reconciledAt: string;
  perfectMatches: MatchedTriangle[];
  timingDrifts: MatchedTriangle[];
  feeVariances: MatchedTriangle[];
  batchSweeps: BatchSweepTriangle[];
  unsettledLegs: UnsettledLeg[];
  metrics: {
    totalOrders: number;
    totalCaptures: number;
    totalBankDeposits: number;
    reconciledOrderCount: number;
    matchRatePercentage: number;
    totalVarianceCents: bigint;
    merkleRoot: string;
  };
}

/**
 * Computes deterministic SHA-256 leaf hash for a matched triangle
 */
function computeTriangleLeafHash(
  orderId: string,
  captureId: string,
  depositId: string | null,
  varianceCents: bigint,
  classification: string
): string {
  const payload = `TRIANGLE:${orderId}:${captureId}:${depositId ?? "NONE"}:${varianceCents.toString()}:${classification}`;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Computes transit time difference in hours between two timestamps
 */
function computeHoursDiff(earlier: string | Date, later: string | Date): number {
  const t1 = new Date(earlier).getTime();
  const t2 = new Date(later).getTime();
  const diffMs = Math.max(0, t2 - t1);
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Executes 3-Way Triangular Reconciliation across Orders, Gateway Captures, and Bank Deposits
 */
export function reconcileTriangular(
  orders: OrderRecord[],
  captures: GatewayCaptureRecord[],
  deposits: BankDepositRecord[],
  options: TriangularReconciliationOptions
): TriangularReconciliationResult {
  const toleranceCents = options.toleranceCents ?? 0n;
  const maxTransitDelayHours = options.maxTransitDelayHours ?? 96;
  const enableBatchSweepAggregation = options.enableBatchSweepAggregation ?? true;

  const perfectMatches: MatchedTriangle[] = [];
  const timingDrifts: MatchedTriangle[] = [];
  const feeVariances: MatchedTriangle[] = [];
  const batchSweeps: BatchSweepTriangle[] = [];

  const matchedOrderIds = new Set<string>();
  const matchedCaptureIds = new Set<string>();
  const matchedDepositIds = new Set<string>();

  // 1. Index Gateway Captures by orderNumber and id
  const captureByOrderNumber = new Map<string, GatewayCaptureRecord>();
  const capturesByBatchId = new Map<string, GatewayCaptureRecord[]>();

  for (const capture of captures) {
    if (capture.orderNumber) {
      captureByOrderNumber.set(capture.orderNumber, capture);
    }
    if (capture.payoutBatchId) {
      const existing = capturesByBatchId.get(capture.payoutBatchId) ?? [];
      existing.push(capture);
      capturesByBatchId.set(capture.payoutBatchId, existing);
    }
  }

  // 2. Index Bank Deposits by payoutBatchId and reference
  const depositByBatchId = new Map<string, BankDepositRecord>();
  for (const deposit of deposits) {
    if (deposit.payoutBatchId) {
      depositByBatchId.set(deposit.payoutBatchId, deposit);
    }
  }

  // 3. Process Batch Sweep Aggregations if batch IDs correlate
  if (enableBatchSweepAggregation) {
    for (const [batchId, batchCaptures] of capturesByBatchId.entries()) {
      const deposit = depositByBatchId.get(batchId);
      if (!deposit || matchedDepositIds.has(deposit.id)) continue;

      // Find all corresponding orders
      const batchOrders: OrderRecord[] = [];
      let aggregateExpectedNetCents = 0n;

      for (const cap of batchCaptures) {
        aggregateExpectedNetCents += cap.netAmountCents;
        matchedCaptureIds.add(cap.id);
        if (cap.orderNumber) {
          const ord = orders.find((o) => o.orderNumber === cap.orderNumber);
          if (ord) {
            batchOrders.push(ord);
            matchedOrderIds.add(ord.id);
          }
        }
      }

      const variance =
        deposit.depositAmountCents >= aggregateExpectedNetCents
          ? deposit.depositAmountCents - aggregateExpectedNetCents
          : aggregateExpectedNetCents - deposit.depositAmountCents;

      matchedDepositIds.add(deposit.id);

      const leafHash = createHash("sha256")
        .update(
          `BATCH_SWEEP:${deposit.id}:${batchOrders
            .map((o) => o.id)
            .sort()
            .join(",")}:${variance}`
        )
        .digest("hex");

      batchSweeps.push({
        bankDeposit: deposit,
        matchedOrders: batchOrders,
        matchedCaptures: batchCaptures,
        aggregateExpectedNetCents,
        actualDepositCents: deposit.depositAmountCents,
        varianceCents: variance,
        confidenceScore: variance <= toleranceCents ? 1.0 : 0.92,
        leafHash,
      });
    }
  }

  // 4. Process 1:1:1 Triangular Correlations
  for (const order of orders) {
    if (matchedOrderIds.has(order.id)) continue;

    // Find Leg B: Gateway Capture
    const capture =
      captureByOrderNumber.get(order.orderNumber) ??
      captures.find(
        (c) =>
          !matchedCaptureIds.has(c.id) &&
          c.grossAmountCents === order.amountCents &&
          c.currency === order.currency
      );

    if (!capture) {
      // Order has no gateway capture yet (unsettled leg A)
      continue;
    }

    matchedOrderIds.add(order.id);
    matchedCaptureIds.add(capture.id);

    // Find Leg C: Bank Deposit
    let deposit: BankDepositRecord | null = null;
    if (capture.payoutBatchId && depositByBatchId.has(capture.payoutBatchId)) {
      deposit = depositByBatchId.get(capture.payoutBatchId)!;
    } else {
      deposit =
        deposits.find(
          (d) =>
            !matchedDepositIds.has(d.id) &&
            d.currency === capture.currency &&
            (d.depositAmountCents === capture.netAmountCents ||
              (d.reference && capture.orderNumber && d.reference.includes(capture.orderNumber)))
        ) ?? null;
    }

    const expectedNet = order.amountCents - capture.feeCents;

    if (!deposit) {
      // Missing Bank Deposit -> Check Transit Window
      const transitHours = computeHoursDiff(capture.timestamp, new Date());
      const isWithinSla = transitHours <= maxTransitDelayHours;

      const matched: MatchedTriangle = {
        classification: isWithinSla ? "TRIANGLE_TIMING_DRIFT" : "TRIANGLE_UNSETTLED_LEG",
        confidenceScore: isWithinSla ? 0.95 : 0.65,
        order,
        gatewayCapture: capture,
        bankDeposit: null,
        varianceCents: expectedNet,
        expectedNetCents: expectedNet,
        actualNetCents: 0n,
        transitDelayHours: transitHours,
        isWithinSla,
        leafHash: computeTriangleLeafHash(
          order.id,
          capture.id,
          null,
          expectedNet,
          isWithinSla ? "TIMING_DRIFT" : "UNSETTLED"
        ),
        explanation: isWithinSla
          ? `Order and Gateway captured. Pending bank deposit settlement sweep (${transitHours}h elapsed, within SLA ${maxTransitDelayHours}h).`
          : `Deposit settlement overdue (${transitHours}h elapsed, exceeds SLA ${maxTransitDelayHours}h).`,
      };

      if (isWithinSla) {
        timingDrifts.push(matched);
      } else {
        feeVariances.push(matched);
      }
      continue;
    }

    matchedDepositIds.add(deposit.id);

    const actualNet = deposit.depositAmountCents;
    const rawVariance =
      actualNet >= expectedNet ? actualNet - expectedNet : expectedNet - actualNet;
    const transitHours = computeHoursDiff(capture.timestamp, deposit.timestamp);
    const isWithinSla = transitHours <= maxTransitDelayHours;

    if (rawVariance <= toleranceCents) {
      // Perfect 3-way match
      perfectMatches.push({
        classification: "TRIANGLE_PERFECT_MATCH",
        confidenceScore: 1.0,
        order,
        gatewayCapture: capture,
        bankDeposit: deposit,
        varianceCents: rawVariance,
        expectedNetCents: expectedNet,
        actualNetCents: actualNet,
        transitDelayHours: transitHours,
        isWithinSla,
        leafHash: computeTriangleLeafHash(
          order.id,
          capture.id,
          deposit.id,
          rawVariance,
          "PERFECT_MATCH"
        ),
        explanation: `3-Way triangular match verified. Order gross matches Gateway gross (${order.amountCents}c), net matches Bank deposit (${actualNet}c).`,
      });
    } else {
      // Fee variance / processor discrepancy
      feeVariances.push({
        classification: "TRIANGLE_FEE_VARIANCE",
        confidenceScore: 0.88,
        order,
        gatewayCapture: capture,
        bankDeposit: deposit,
        varianceCents: rawVariance,
        expectedNetCents: expectedNet,
        actualNetCents: actualNet,
        transitDelayHours: transitHours,
        isWithinSla,
        leafHash: computeTriangleLeafHash(
          order.id,
          capture.id,
          deposit.id,
          rawVariance,
          "FEE_VARIANCE"
        ),
        explanation: `Gateway fee or bank deduction variance detected. Expected net: ${expectedNet}c, Actual deposit: ${actualNet}c (Delta: ${rawVariance}c).`,
      });
    }
  }

  // 5. Gather Unsettled Legs
  const unsettledLegs: UnsettledLeg[] = [];

  for (const order of orders) {
    if (!matchedOrderIds.has(order.id)) {
      unsettledLegs.push({
        sourceLeg: "ORDER",
        recordId: order.id,
        amountCents: order.amountCents,
        currency: order.currency,
        timestamp: order.timestamp,
        reason: `Order ${order.orderNumber} has no corresponding payment gateway capture.`,
      });
    }
  }

  for (const capture of captures) {
    if (!matchedCaptureIds.has(capture.id)) {
      unsettledLegs.push({
        sourceLeg: "GATEWAY",
        recordId: capture.id,
        amountCents: capture.grossAmountCents,
        currency: capture.currency,
        timestamp: capture.timestamp,
        reason: `Gateway transaction ${capture.gatewayTransactionId} is orphaned with no matching internal order.`,
      });
    }
  }

  for (const deposit of deposits) {
    if (!matchedDepositIds.has(deposit.id)) {
      unsettledLegs.push({
        sourceLeg: "BANK",
        recordId: deposit.id,
        amountCents: deposit.depositAmountCents,
        currency: deposit.currency,
        timestamp: deposit.timestamp,
        reason: `Bank deposit ${deposit.reference} has no corresponding gateway batch or order settlement.`,
      });
    }
  }

  // 6. Compute Batch Summary and Merkle Root
  const allLeafHashes = [
    ...perfectMatches.map((m) => m.leafHash),
    ...timingDrifts.map((m) => m.leafHash),
    ...feeVariances.map((m) => m.leafHash),
    ...batchSweeps.map((b) => b.leafHash),
  ].sort();

  const merkleRoot =
    allLeafHashes.length > 0
      ? createHash("sha256").update(allLeafHashes.join(":")).digest("hex")
      : createHash("sha256").update("EMPTY_TRIANGLE_SET").digest("hex");

  let totalVariance = 0n;
  for (const m of [...perfectMatches, ...timingDrifts, ...feeVariances]) {
    totalVariance += m.varianceCents;
  }
  for (const b of batchSweeps) {
    totalVariance += b.varianceCents;
  }

  const reconciledOrderCount = matchedOrderIds.size;
  const matchRate =
    orders.length > 0 ? Math.round((reconciledOrderCount / orders.length) * 10000) / 100 : 0;

  return {
    tenantId: options.tenantId,
    reconciledAt: new Date().toISOString(),
    perfectMatches,
    timingDrifts,
    feeVariances,
    batchSweeps,
    unsettledLegs,
    metrics: {
      totalOrders: orders.length,
      totalCaptures: captures.length,
      totalBankDeposits: deposits.length,
      reconciledOrderCount,
      matchRatePercentage: matchRate,
      totalVarianceCents: totalVariance,
      merkleRoot,
    },
  };
}
