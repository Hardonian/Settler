import {
  reconcileTriangular,
  OrderRecord,
  GatewayCaptureRecord,
  BankDepositRecord,
} from "../triangular-reconciliation.js";

describe("Triangular (3-Way) Reconciliation Engine", () => {
  const tenantId = "tenant-enterprise-triangular";

  it("identifies a perfect 3-way triangular match with zero variance", () => {
    const orders: OrderRecord[] = [
      {
        id: "ord_101",
        orderNumber: "ORD-2026-101",
        amountCents: 10000n, // $100.00
        currency: "USD",
        timestamp: "2026-10-18T10:00:00Z",
      },
    ];

    const captures: GatewayCaptureRecord[] = [
      {
        id: "cap_101",
        orderNumber: "ORD-2026-101",
        gatewayTransactionId: "ch_stripe_101",
        grossAmountCents: 10000n,
        feeCents: 320n, // $3.20 (2.9% + 30c)
        netAmountCents: 9680n, // $96.80
        currency: "USD",
        timestamp: "2026-10-18T10:00:02Z",
      },
    ];

    const deposits: BankDepositRecord[] = [
      {
        id: "dep_101",
        reference: "DEP-STRIPE-ORD-2026-101",
        depositAmountCents: 9680n, // $96.80
        currency: "USD",
        timestamp: "2026-10-18T14:30:00Z",
      },
    ];

    const result = reconcileTriangular(orders, captures, deposits, { tenantId });

    expect(result.perfectMatches).toHaveLength(1);
    expect(result.timingDrifts).toHaveLength(0);
    expect(result.feeVariances).toHaveLength(0);
    expect(result.unsettledLegs).toHaveLength(0);

    const match = result.perfectMatches[0]!;
    expect(match.classification).toBe("TRIANGLE_PERFECT_MATCH");
    expect(match.confidenceScore).toBe(1.0);
    expect(match.varianceCents).toBe(0n);
    expect(match.expectedNetCents).toBe(9680n);
    expect(match.actualNetCents).toBe(9680n);
    expect(match.leafHash).toBeDefined();
    expect(result.metrics.matchRatePercentage).toBe(100);
    expect(result.metrics.totalVarianceCents).toBe(0n);
    expect(result.metrics.merkleRoot).toBeDefined();
  });

  it("classifies transit timing drift when gateway is captured but bank deposit is pending within SLA", () => {
    const orders: OrderRecord[] = [
      {
        id: "ord_102",
        orderNumber: "ORD-2026-102",
        amountCents: 25000n,
        currency: "USD",
        timestamp: new Date().toISOString(),
      },
    ];

    const captures: GatewayCaptureRecord[] = [
      {
        id: "cap_102",
        orderNumber: "ORD-2026-102",
        gatewayTransactionId: "ch_stripe_102",
        grossAmountCents: 25000n,
        feeCents: 755n,
        netAmountCents: 24245n,
        currency: "USD",
        timestamp: new Date().toISOString(),
      },
    ];

    const deposits: BankDepositRecord[] = []; // No deposit yet

    const result = reconcileTriangular(orders, captures, deposits, {
      tenantId,
      maxTransitDelayHours: 48,
    });

    expect(result.perfectMatches).toHaveLength(0);
    expect(result.timingDrifts).toHaveLength(1);
    expect(result.timingDrifts[0]!.classification).toBe("TRIANGLE_TIMING_DRIFT");
    expect(result.timingDrifts[0]!.isWithinSla).toBe(true);
    expect(result.unsettledLegs).toHaveLength(0);
  });

  it("detects fee variance when bank deposit differs from gateway net settlement", () => {
    const orders: OrderRecord[] = [
      {
        id: "ord_103",
        orderNumber: "ORD-2026-103",
        amountCents: 50000n, // $500.00
        currency: "USD",
        timestamp: "2026-10-18T08:00:00Z",
      },
    ];

    const captures: GatewayCaptureRecord[] = [
      {
        id: "cap_103",
        orderNumber: "ORD-2026-103",
        gatewayTransactionId: "ch_stripe_103",
        grossAmountCents: 50000n,
        feeCents: 1480n,
        netAmountCents: 48520n, // Expected $485.20
        currency: "USD",
        timestamp: "2026-10-18T08:00:05Z",
      },
    ];

    const deposits: BankDepositRecord[] = [
      {
        id: "dep_103",
        reference: "DEP-STRIPE-ORD-2026-103",
        depositAmountCents: 48000n, // Bank deducted an extra $5.20 wire fee (520c)
        currency: "USD",
        timestamp: "2026-10-18T12:00:00Z",
      },
    ];

    const result = reconcileTriangular(orders, captures, deposits, {
      tenantId,
      toleranceCents: 0n,
    });

    expect(result.perfectMatches).toHaveLength(0);
    expect(result.feeVariances).toHaveLength(1);

    const feeVar = result.feeVariances[0]!;
    expect(feeVar.classification).toBe("TRIANGLE_FEE_VARIANCE");
    expect(feeVar.varianceCents).toBe(520n);
    expect(feeVar.expectedNetCents).toBe(48520n);
    expect(feeVar.actualNetCents).toBe(48000n);
    expect(result.metrics.totalVarianceCents).toBe(520n);
  });

  it("reconciles batch sweep aggregations where multiple orders roll into one deposit", () => {
    const batchId = "batch_sweep_999";

    const orders: OrderRecord[] = [
      {
        id: "ord_a",
        orderNumber: "ORD-BATCH-A",
        amountCents: 10000n,
        currency: "USD",
        timestamp: "2026-10-17T15:00:00Z",
      },
      {
        id: "ord_b",
        orderNumber: "ORD-BATCH-B",
        amountCents: 20000n,
        currency: "USD",
        timestamp: "2026-10-17T15:30:00Z",
      },
    ];

    const captures: GatewayCaptureRecord[] = [
      {
        id: "cap_a",
        orderNumber: "ORD-BATCH-A",
        gatewayTransactionId: "ch_a",
        grossAmountCents: 10000n,
        feeCents: 320n,
        netAmountCents: 9680n,
        currency: "USD",
        timestamp: "2026-10-17T15:00:05Z",
        payoutBatchId: batchId,
      },
      {
        id: "cap_b",
        orderNumber: "ORD-BATCH-B",
        gatewayTransactionId: "ch_b",
        grossAmountCents: 20000n,
        feeCents: 610n,
        netAmountCents: 19390n,
        currency: "USD",
        timestamp: "2026-10-17T15:30:05Z",
        payoutBatchId: batchId,
      },
    ];

    // Bank deposit aggregates both: 9680 + 19390 = 29070 ($290.70)
    const deposits: BankDepositRecord[] = [
      {
        id: "dep_sweep_999",
        payoutBatchId: batchId,
        reference: "STRIPE PAYOUT BATCH 999",
        depositAmountCents: 29070n,
        currency: "USD",
        timestamp: "2026-10-18T06:00:00Z",
      },
    ];

    const result = reconcileTriangular(orders, captures, deposits, {
      tenantId,
      enableBatchSweepAggregation: true,
    });

    expect(result.batchSweeps).toHaveLength(1);
    const sweep = result.batchSweeps[0]!;
    expect(sweep.matchedOrders).toHaveLength(2);
    expect(sweep.matchedCaptures).toHaveLength(2);
    expect(sweep.aggregateExpectedNetCents).toBe(29070n);
    expect(sweep.actualDepositCents).toBe(29070n);
    expect(sweep.varianceCents).toBe(0n);
    expect(result.unsettledLegs).toHaveLength(0);
  });

  it("flags isolated and orphan legs as unsettled", () => {
    const orders: OrderRecord[] = [
      {
        id: "ord_orphan",
        orderNumber: "ORD-ORPHAN-001",
        amountCents: 7500n,
        currency: "USD",
        timestamp: "2026-10-18T10:00:00Z",
      },
    ];

    const captures: GatewayCaptureRecord[] = [];
    const deposits: BankDepositRecord[] = [
      {
        id: "dep_orphan",
        reference: "MYSTERIOUS WIRE DEPOSIT",
        depositAmountCents: 120000n,
        currency: "USD",
        timestamp: "2026-10-18T10:00:00Z",
      },
    ];

    const result = reconcileTriangular(orders, captures, deposits, { tenantId });

    expect(result.perfectMatches).toHaveLength(0);
    expect(result.unsettledLegs).toHaveLength(2);
    expect(result.unsettledLegs.some((l) => l.sourceLeg === "ORDER")).toBe(true);
    expect(result.unsettledLegs.some((l) => l.sourceLeg === "BANK")).toBe(true);
  });
});
