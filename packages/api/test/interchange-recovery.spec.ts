import express from "express";
import request from "supertest";
import { interchangeRouter } from "../src/routes/v2/interchange";

describe("Interchange++ Forensic Margin Recovery Routes & Service", () => {
  let app: express.Application;
  const TENANT_ID = "00000000-0000-4000-8000-000000000001";
  const OTHER_TENANT_ID = "00000000-0000-4000-8000-000000000002";

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      const tenantId = req.headers["x-tenant-id"];
      if (typeof tenantId === "string")
        (req as express.Request & { tenantId?: string }).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/recovery/interchange", interchangeRouter);
  });

  describe("Single Transaction Analysis & Claim Generation", () => {
    it("detects Level 2/3 downgrade on corporate card and generates recovery claim", async () => {
      const res = await request(app)
        .post("/api/v2/recovery/interchange/analyze")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: TENANT_ID,
          transaction: {
            transactionId: "tx_corp_b2b_991",
            orderReference: "ORD-CORP-991",
            amountCents: 500000, // $5,000.00
            currency: "USD",
            actualFeeCents: 14750, // 2.95% standard rate paid = $147.50
            cardBrand: "VISA",
            cardCategory: "CREDIT_COMMERCIAL_B2B",
            dataLevelProvided: "LEVEL_1", // Missing L2/L3 data
            hoursToCapture: 2,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { analysis, claim } = res.body.data;
      expect(analysis.isRecoveryEligible).toBe(true);
      expect(analysis.downgradeReason).toBe("DOWNGRADE_MISSING_LEVEL_3");
      expect(analysis.excessLeakageCents).toBeGreaterThan(0);
      expect(analysis.proofHash).toMatch(/^0x[a-f0-9]{64}$/);

      // Claim should have been automatically generated
      expect(claim).toBeDefined();
      expect(claim.tenantId).toBe(TENANT_ID);
      expect(claim.totalClaimAmountMinorUnits).toBe(analysis.excessLeakageCents);
      expect(claim.claimType).toBe("PROCESSOR_FEE_OVERCHARGE");
      expect(claim.evidencePackage[0]?.computedDeltaMinorUnits).toBe(analysis.excessLeakageCents);
    });

    it("rejects cross-tenant payload with 403 Tenant mismatch", async () => {
      const res = await request(app)
        .post("/api/v2/recovery/interchange/analyze")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: OTHER_TENANT_ID,
          transaction: {
            transactionId: "tx_cross_tenant_01",
            orderReference: "ORD-HACK-01",
            amountCents: 10000,
            currency: "USD",
            actualFeeCents: 250,
            cardBrand: "MASTERCARD",
            cardCategory: "CREDIT_CONSUMER",
            dataLevelProvided: "LEVEL_1",
            hoursToCapture: 2,
          },
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Tenant mismatch");
    });

    it("rejects unauthenticated request without tenant context with 400", async () => {
      const res = await request(app)
        .post("/api/v2/recovery/interchange/analyze")
        .send({
          transaction: {
            transactionId: "tx_no_tenant_01",
            amountCents: 10000,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid tenant context is required");
    });
  });

  describe("Portfolio Batch Evaluation & Reporting", () => {
    it("evaluates a batch of transactions and retrieves tenant report", async () => {
      const batchPayload = [
        {
          transactionId: "tx_b1",
          orderReference: "ORD-B1",
          amountCents: 100000, // $1,000.00
          currency: "USD",
          actualFeeCents: 2950, // 2.95% paid instead of Commercial L3
          cardBrand: "VISA" as const,
          cardCategory: "CREDIT_COMMERCIAL_B2B" as const,
          dataLevelProvided: "LEVEL_1" as const,
          hoursToCapture: 2,
        },
        {
          transactionId: "tx_b2",
          orderReference: "ORD-B2",
          amountCents: 200000, // $2,000.00
          currency: "USD",
          actualFeeCents: 3500, // $35.00 paid instead of regulated debit
          cardBrand: "VISA" as const,
          cardCategory: "DEBIT_REGULATED" as const,
          dataLevelProvided: "LEVEL_1" as const,
          hoursToCapture: 2,
        },
      ];

      const batchRes = await request(app)
        .post("/api/v2/recovery/interchange/batch")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: TENANT_ID,
          transactions: batchPayload,
          autoFileClaims: true,
        });

      expect(batchRes.status).toBe(200);
      expect(batchRes.body.success).toBe(true);

      const { report, claimsGenerated, totalClaimAmountCents } = batchRes.body.data;
      expect(report.totalTransactionsAnalyzed).toBe(2);
      expect(report.flaggedTransactions.length).toBe(2);
      expect(report.totalRecoverableLeakageCents).toBeGreaterThan(0);
      expect(claimsGenerated.length).toBe(1);
      expect(totalClaimAmountCents).toBe(report.totalRecoverableLeakageCents);

      // Verify GET /report retrieves the stored tenant report
      const reportRes = await request(app)
        .get("/api/v2/recovery/interchange/report")
        .set("x-tenant-id", TENANT_ID);

      expect(reportRes.status).toBe(200);
      expect(reportRes.body.success).toBe(true);
      expect(reportRes.body.data.totalTransactionsAnalyzed).toBe(2);
      expect(reportRes.body.data.totalRecoverableLeakageCents).toBe(
        report.totalRecoverableLeakageCents
      );
    });
  });
});
