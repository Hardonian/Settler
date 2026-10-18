import express from "express";
import request from "supertest";
import {
  TigerBeetleParityMonitor,
  tigerBeetleParityMonitor,
} from "../src/services/ledger/tigerbeetle-parity-monitor";
import { parityRouter } from "../src/routes/v2/parity";

describe("TigerBeetle Dual-Ledger Parity Monitor", () => {
  let monitor: TigerBeetleParityMonitor;
  const TENANT_A = "11111111-1111-4111-8111-111111111111";
  const TENANT_B = "22222222-2222-4222-8222-222222222222";

  beforeEach(() => {
    monitor = new TigerBeetleParityMonitor();
  });

  describe("Invariant Evaluations", () => {
    it("confirms dual-ledger parity when double-entry and two-phase transfers balance", async () => {
      const cdc = monitor.getCDCService();
      cdc.registerAccount(TENANT_A, {
        accountId: "acc_bank_clearing",
        name: "Bank Settlement Clearing",
        type: "asset",
      });
      cdc.registerAccount(TENANT_A, {
        accountId: "acc_merchant_payable",
        name: "Merchant Payables",
        type: "liability",
      });

      cdc.recordTransfer(TENANT_A, {
        id: "tx_001",
        debitAccountId: "acc_bank_clearing",
        creditAccountId: "acc_merchant_payable",
        amount: 250_000n, // $2,500.00
      });

      const proof = await monitor.evaluateTenantInvariants(TENANT_A, {
        relationalMatchedVolumeCents: 250_000n,
      });

      expect(proof.isBalanced).toBe(true);
      expect(proof.driftDetected).toBe(false);
      expect(proof.driftMagnitudeCents).toBe(0);
      expect(proof.driftRootCause).toBe("NONE");
      expect(proof.tigerbeetlePostedDebitCents).toBe("250000");
      expect(proof.tigerbeetlePostedCreditCents).toBe("250000");
      expect(proof.epochMerkleRoot).toHaveLength(64);
      expect(proof.signature).toHaveLength(64);
    });

    it("detects orphan transfer drift when debits and credits do not match", async () => {
      const cdc = monitor.getCDCService();
      cdc.registerAccount(TENANT_A, {
        accountId: "acc_escrow",
        name: "Escrow",
        type: "asset",
      });

      // Directly update snapshot to create unbalanced state
      const snap = cdc.getSnapshot(TENANT_A, "acc_escrow")!;
      snap.debitsPosted = "50000";
      snap.creditsPosted = "0";

      const proof = await monitor.evaluateTenantInvariants(TENANT_A);

      expect(proof.isBalanced).toBe(false);
      expect(proof.driftDetected).toBe(true);
      expect(proof.driftRootCause).toBe("ORPHAN_TRANSFER");
    });

    it("detects cross-ledger discrepancy when TigerBeetle clearing diverges from Postgres relational volume", async () => {
      const cdc = monitor.getCDCService();
      cdc.registerAccount(TENANT_A, {
        accountId: "acc_settlement_clearing",
        name: "Settlement Clearing",
        type: "asset",
      });
      cdc.registerAccount(TENANT_A, {
        accountId: "acc_payout_liability",
        name: "Payout Liability",
        type: "liability",
      });

      cdc.recordTransfer(TENANT_A, {
        id: "tx_002",
        debitAccountId: "acc_settlement_clearing",
        creditAccountId: "acc_payout_liability",
        amount: 100_000n,
      });

      // Expecting 150_000 cents in relational DB -> 50_000 cents drift
      const proof = await monitor.evaluateTenantInvariants(TENANT_A, {
        relationalMatchedVolumeCents: 150_000n,
      });

      expect(proof.driftDetected).toBe(true);
      expect(proof.driftMagnitudeCents).toBe(50_000);
      expect(proof.driftRootCause).toBe("RELATIONAL_DROP");
    });
  });

  describe("API v2 Parity Endpoints", () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use("/api/v2/ledger/parity", parityRouter);
    });

    it("evaluates invariants via POST /verify with valid tenant context", async () => {
      const res = await request(app)
        .post("/api/v2/ledger/parity/verify")
        .set("x-tenant-id", TENANT_A)
        .send({
          tenantId: TENANT_A,
          relationalMatchedVolumeCents: "0",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.proofId).toMatch(/^proof_tb_/);
      expect(res.body.data.tenantId).toBe(TENANT_A);
    });

    it("rejects cross-tenant mismatch with 403", async () => {
      const res = await request(app)
        .post("/api/v2/ledger/parity/verify")
        .set("x-tenant-id", TENANT_A)
        .send({
          tenantId: TENANT_B, // Mismatched target
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Tenant mismatch");
    });

    it("retrieves status and proofs via GET /status", async () => {
      // Run evaluation first
      await tigerBeetleParityMonitor.evaluateTenantInvariants(TENANT_A);

      const res = await request(app)
        .get(`/api/v2/ledger/parity/status?tenantId=${TENANT_A}`)
        .set("x-tenant-id", TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tenantId).toBe(TENANT_A);
      expect(res.body.data.historicalProofs).toBeInstanceOf(Array);
      expect(res.body.data.historicalProofs.length).toBeGreaterThan(0);
    });
  });
});
