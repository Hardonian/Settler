import { analyzeCrossRailSettlementGraph } from "./cross-rail-settlement-graph";

describe("analyzeCrossRailSettlementGraph", () => {
  const tenantId = "tenant_enterprise_01";

  it("decomposes Plaid bank settlement sweeps with rolling reserves, fee slippage, and FX spread loss", () => {
    const report = analyzeCrossRailSettlementGraph({
      tenantId,
      currency: "USD",
      processorEvents: [
        {
          id: "ev_stripe_cap_1",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_101",
          orderId: "ord_1001",
          kind: "CAPTURE",
          grossAmountCents: 1_000_000n, // $10,000.00
          contractualFeeCents: 22_000n, // 220 bps ($220.00)
          actualFeeCents: 25_500n, // $255.00 ($35.00 scheme/downgrade fee slippage)
          fxSpreadLossCents: 12_000n, // $120.00 hidden FX conversion spread
          currency: "USD",
          occurredAt: "2026-10-20T10:00:00Z",
        },
        {
          id: "ev_stripe_ref_1",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_101",
          orderId: "ord_1002",
          kind: "REFUND",
          grossAmountCents: 50_000n, // $500.00 refund
          contractualFeeCents: 0n,
          actualFeeCents: 0n,
          currency: "USD",
          occurredAt: "2026-10-20T11:00:00Z",
        },
        {
          id: "ev_stripe_res_hold",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_101",
          orderId: "reserve_pool",
          kind: "RESERVE_HOLD",
          grossAmountCents: 100_000n, // $1,000.00 rolling reserve withheld (10%)
          contractualFeeCents: 0n,
          actualFeeCents: 0n,
          currency: "USD",
          occurredAt: "2026-10-20T12:00:00Z",
        },
        {
          id: "ev_stripe_res_rel",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_101",
          orderId: "reserve_pool",
          kind: "RESERVE_RELEASE",
          grossAmountCents: 40_000n, // $400.00 prior rolling reserve released
          contractualFeeCents: 0n,
          actualFeeCents: 0n,
          currency: "USD",
          occurredAt: "2026-10-20T12:05:00Z",
        },
      ],
      plaidSweeps: [
        {
          plaidTransactionId: "plaid_tx_9901",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_101",
          achTraceNumber: "021000029481726",
          bankDescriptor: "STRIPE TRANSFER PO_101",
          // Expected deposit: 1,000,000 - 25,500 - 12,000 - 50,000 - 100,000 + 40,000 = 852,500
          depositedAmountCents: 852_500n,
          currency: "USD",
          settledAt: "2026-10-22T08:00:00Z",
        },
      ],
    });

    expect(report.waterfalls).toHaveLength(1);
    const wf = report.waterfalls[0]!;
    expect(wf.status).toBe("SLIPPAGE_EXPLAINED");
    expect(wf.grossCapturesCents).toBe(1_000_000n);
    expect(wf.contractualFeesCents).toBe(22_000n);
    expect(wf.feeSlippageCents).toBe(3_500n);
    expect(wf.fxSpreadLossCents).toBe(12_000n);
    expect(wf.reserveWithheldCents).toBe(100_000n);
    expect(wf.reserveReleasedCents).toBe(40_000n);
    expect(wf.expectedBankDepositCents).toBe(852_500n);
    expect(wf.actualBankDepositCents).toBe(852_500n);
    expect(wf.unexplainedVarianceCents).toBe(0n);
    expect(report.summary.netRollingReserveBalanceCents).toBe(60_000n);
    expect(report.summary.totalRecoverableLeakageCents).toBe(15_500n);
    expect(report.merkleRootSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("detects cross-rail double-refund + chargeback arbitrage across Stripe and PayPal", () => {
    const report = analyzeCrossRailSettlementGraph({
      tenantId,
      currency: "USD",
      processorEvents: [
        {
          id: "ev_cap_shared_order",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_200",
          orderId: "ord_arbitrage_77",
          kind: "CAPTURE",
          grossAmountCents: 250_000n, // $2,500.00
          contractualFeeCents: 5_000n,
          actualFeeCents: 5_000n,
          currency: "USD",
          occurredAt: "2026-10-21T09:00:00Z",
        },
        {
          id: "ev_cb_stripe",
          tenantId,
          rail: "stripe",
          payoutBatchId: "po_stripe_200",
          orderId: "ord_arbitrage_77",
          kind: "CHARGEBACK",
          grossAmountCents: 250_000n, // $2,500.00 issuer chargeback on Stripe
          contractualFeeCents: 0n,
          actualFeeCents: 1_500n, // $15.00 dispute fee
          currency: "USD",
          occurredAt: "2026-10-22T14:00:00Z",
        },
        {
          id: "ev_refund_paypal",
          tenantId,
          rail: "paypal",
          payoutBatchId: "po_paypal_300",
          orderId: "ord_arbitrage_77",
          kind: "REFUND",
          grossAmountCents: 250_000n, // $2,500.00 automated RMA refund triggered on PayPal
          contractualFeeCents: 0n,
          actualFeeCents: 0n,
          currency: "USD",
          occurredAt: "2026-10-22T15:00:00Z",
        },
        {
          id: "ev_cap_paypal_volume",
          tenantId,
          rail: "paypal",
          payoutBatchId: "po_paypal_300",
          orderId: "ord_normal_88",
          kind: "CAPTURE",
          grossAmountCents: 1_000_000n,
          contractualFeeCents: 29_000n,
          actualFeeCents: 34_000n,
          fxSpreadLossCents: 20_000n,
          currency: "USD",
          occurredAt: "2026-10-22T10:00:00Z",
        },
      ],
      plaidSweeps: [],
    });

    const doubleCreditAlert = report.arbitrageAlerts.find(
      (a) => a.alertType === "CROSS_RAIL_DOUBLE_REFUND_CHARGEBACK"
    );
    expect(doubleCreditAlert).toBeDefined();
    expect(doubleCreditAlert?.orderId).toBe("ord_arbitrage_77");
    expect(doubleCreditAlert?.exposureCents).toBe(250_000n);
    expect(doubleCreditAlert?.railsInvolved).toEqual(expect.arrayContaining(["stripe", "paypal"]));

    // Benchmarks: Stripe effective all-in take rate (200 bps + 6 bps dispute drag = 206 bps)
    // vs PayPal effective all-in take rate (290 bps + 50 bps slippage + 200 bps FX = 540 bps)
    expect(report.recommendedPrimaryRail).toBe("stripe");
    expect(report.railBenchmarks).toHaveLength(2);
    expect(report.railBenchmarks[0]!.rail).toBe("stripe");
    expect(report.railBenchmarks[1]!.rail).toBe("paypal");
  });

  it("rejects cross-tenant events and sweeps with Tenant mismatch", () => {
    expect(() =>
      analyzeCrossRailSettlementGraph({
        tenantId,
        processorEvents: [
          {
            id: "ev_bad",
            tenantId: "other_tenant",
            rail: "stripe",
            payoutBatchId: "po_1",
            orderId: "ord_1",
            kind: "CAPTURE",
            grossAmountCents: 1000n,
            contractualFeeCents: 10n,
            actualFeeCents: 10n,
            currency: "USD",
            occurredAt: "2026-10-20T00:00:00Z",
          },
        ],
        plaidSweeps: [],
      })
    ).toThrow(/Tenant mismatch/);
  });
});
