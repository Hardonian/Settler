import { ContinuousT0Ledger, type StreamingLedgerEvent } from "./continuous-t0-ledger.js";

describe("Continuous T+0 Streaming Ledger", () => {
  const TENANT = "tenant_stream_alpha";

  it("processes streaming settlement events and maintains continuous trial balance with zero float drift", () => {
    const ledger = new ContinuousT0Ledger(TENANT, "USD");

    // 1. Process Gross Sale: $1,000.00 (100,000 cents)
    const tb1 = ledger.processEvent({
      eventId: "ev_sale_001",
      tenantId: TENANT,
      rail: "stripe",
      type: "SALE_CLEARED",
      amountCents: 100000n,
      currency: "USD",
      occurredAt: "2026-09-10T10:00:00Z",
      referenceId: "pi_12345",
    });

    expect(tb1.grossSalesCents).toBe(100000n);
    expect(tb1.unsettledObligationCents).toBe(100000n);
    expect(tb1.incrementalMerkleStateRoot).toMatch(/^[a-f0-9]{64}$/);

    // 2. Process Interchange & Processor Fee: $32.00 (3,200 cents)
    const tb2 = ledger.processEvent({
      eventId: "ev_fee_002",
      tenantId: TENANT,
      rail: "stripe",
      type: "PROCESSOR_FEE_POSTED",
      amountCents: 3200n,
      currency: "USD",
      occurredAt: "2026-09-10T10:00:01Z",
      referenceId: "fee_pi_12345",
    });

    expect(tb2.totalFeesPaidCents).toBe(3200n);
    expect(tb2.unsettledObligationCents).toBe(96800n); // 100,000 - 3,200

    // 3. Process Dispute Reserve Hold: $50.00 (5,000 cents)
    const tb3 = ledger.processEvent({
      eventId: "ev_res_003",
      tenantId: TENANT,
      rail: "stripe",
      type: "DISPUTE_RESERVE_HELD",
      amountCents: 5000n,
      currency: "USD",
      occurredAt: "2026-09-10T10:00:02Z",
      referenceId: "dp_hold_01",
    });

    expect(tb3.disputeReserveBalanceCents).toBe(5000n);
    expect(tb3.unsettledObligationCents).toBe(91800n); // 96,800 - 5,000

    // 4. Depository Bank Confirms Net Payout Deposit: $918.00 (91,800 cents)
    const tb4 = ledger.processEvent({
      eventId: "ev_dep_004",
      tenantId: TENANT,
      rail: "depository",
      type: "NET_DEPOSIT_CONFIRMED",
      amountCents: 91800n,
      currency: "USD",
      occurredAt: "2026-09-10T14:00:00Z",
      referenceId: "dep_chase_8910",
    });

    expect(tb4.netDepositoryCashReceivedCents).toBe(91800n);
    // Unsettled obligation is now fully closed (0 cents remaining!)
    expect(tb4.unsettledObligationCents).toBe(0n);
    expect(tb4.isBalancedZeroDrift).toBe(true);
  });

  it("strictly enforces tenant isolation on streaming events", () => {
    const ledger = new ContinuousT0Ledger(TENANT, "USD");

    expect(() =>
      ledger.processEvent({
        eventId: "ev_bad_tenant",
        tenantId: "tenant_adversary_beta",
        rail: "stripe",
        type: "SALE_CLEARED",
        amountCents: 5000n,
        currency: "USD",
        occurredAt: new Date(),
        referenceId: "ref_bad",
      })
    ).toThrow(/Tenant mismatch/);
  });
});
