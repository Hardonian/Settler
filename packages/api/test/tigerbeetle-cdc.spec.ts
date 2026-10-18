/**
 * TigerBeetle CDC Sync & Dual-Ledger Invariant Specification
 *
 * Verifies two-phase commit transitions (pending -> post / void),
 * 128-bit unsigned integer BigInt precision, double-entry parity verification,
 * and tenant boundary isolation.
 */

import { TigerBeetleCDCService } from "../src/services/ledger/tigerbeetle-cdc-service";

describe("TigerBeetle CDC Sync & Parity Verification", () => {
  let cdcService: TigerBeetleCDCService;
  const TENANT_A = "00000000-0000-4000-8000-000000000001";
  const TENANT_B = "00000000-0000-4000-8000-000000000002";

  beforeEach(() => {
    cdcService = new TigerBeetleCDCService();
  });

  it("handles 128-bit BigInt transfer amounts without float truncation", async () => {
    // Amount exceeding Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
    const largeAmount = 18_446_744_073_709_551_615n; // 2^64 - 1

    cdcService.recordTransfer(TENANT_A, {
      id: "tx_large_001",
      debitAccountId: "acc_asset_vault",
      creditAccountId: "acc_equity_reserve",
      amount: largeAmount,
    });

    const result = await cdcService.syncTenantBalances(TENANT_A);
    expect(result.syncedTransfers).toBe(1);

    const assetSnapshot = cdcService.getSnapshot(TENANT_A, "acc_asset_vault");
    expect(assetSnapshot).not.toBeNull();
    expect(assetSnapshot?.debitsPosted).toBe(largeAmount.toString());

    const equitySnapshot = cdcService.getSnapshot(TENANT_A, "acc_equity_reserve");
    expect(equitySnapshot).not.toBeNull();
    expect(equitySnapshot?.creditsPosted).toBe(largeAmount.toString());

    expect(result.parityReport.isBalanced).toBe(true);
  });

  it("processes two-phase commit state machine (pending -> post_pending_transfer)", async () => {
    const transferId = "tx_2pc_auth_001";
    const amount = 50_000n; // $500.00

    // Step 1: Authorization (pending transfer)
    cdcService.recordTransfer(TENANT_A, {
      id: transferId,
      debitAccountId: "acc_receivables",
      creditAccountId: "acc_settlement_escrow",
      amount,
      flags: { pending: true },
    });

    await cdcService.syncTenantBalances(TENANT_A);

    let debitAcc = cdcService.getSnapshot(TENANT_A, "acc_receivables");
    expect(debitAcc?.debitsPending).toBe("50000");
    expect(debitAcc?.debitsPosted).toBe("0");

    // Step 2: Capture / Settlement Posting (post_pending_transfer)
    cdcService.recordTransfer(TENANT_A, {
      id: "tx_2pc_capture_001",
      debitAccountId: "acc_receivables",
      creditAccountId: "acc_settlement_escrow",
      amount,
      flags: { postPendingTransfer: true },
    });

    await cdcService.syncTenantBalances(TENANT_A);

    debitAcc = cdcService.getSnapshot(TENANT_A, "acc_receivables");
    expect(debitAcc?.debitsPending).toBe("0");
    expect(debitAcc?.debitsPosted).toBe("50000");
    expect(debitAcc?.netBalance).toBe(500.0);
  });

  it("handles voided authorizations without increasing posted balance", async () => {
    const amount = 25_000n; // $250.00

    // Step 1: Pending auth
    cdcService.recordTransfer(TENANT_A, {
      id: "tx_auth_void_01",
      debitAccountId: "acc_card_hold",
      creditAccountId: "acc_clearing",
      amount,
      flags: { pending: true },
    });

    await cdcService.syncTenantBalances(TENANT_A);

    // Step 2: Void pending transfer
    cdcService.recordTransfer(TENANT_A, {
      id: "tx_auth_void_02",
      debitAccountId: "acc_card_hold",
      creditAccountId: "acc_clearing",
      amount,
      flags: { voidPendingTransfer: true },
    });

    await cdcService.syncTenantBalances(TENANT_A);

    const debitAcc = cdcService.getSnapshot(TENANT_A, "acc_card_hold");
    expect(debitAcc?.debitsPending).toBe("0");
    expect(debitAcc?.debitsPosted).toBe("0");
    expect(debitAcc?.netBalance).toBe(0);
  });

  it("verifies double-entry ledger balance parity", async () => {
    cdcService.recordTransfer(TENANT_A, {
      id: "tx_bal_1",
      debitAccountId: "acc_bank",
      creditAccountId: "acc_sales",
      amount: 100_000n,
    });

    cdcService.recordTransfer(TENANT_A, {
      id: "tx_bal_2",
      debitAccountId: "acc_processing_fees",
      creditAccountId: "acc_bank",
      amount: 3_000n,
    });

    const result = await cdcService.syncTenantBalances(TENANT_A);
    expect(result.parityReport.isBalanced).toBe(true);
    expect(result.parityReport.totalDebits).toBe("103000");
    expect(result.parityReport.totalCredits).toBe("103000");
    expect(result.parityReport.epochRootHash).toBeDefined();
  });

  it("enforces tenant boundary isolation across CDC projections", async () => {
    cdcService.recordTransfer(TENANT_A, {
      id: "tx_tenant_a",
      debitAccountId: "acc_exclusive_alpha",
      creditAccountId: "acc_escrow_alpha",
      amount: 75_000n,
    });

    await cdcService.syncTenantBalances(TENANT_A);

    // Tenant B must have zero snapshots
    const snapshotsB = cdcService.listSnapshots(TENANT_B);
    expect(snapshotsB.length).toBe(0);

    const crossLookup = cdcService.getSnapshot(TENANT_B, "acc_exclusive_alpha");
    expect(crossLookup).toBeNull();
  });
});
