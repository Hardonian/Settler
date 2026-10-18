import express from "express";
import request from "supertest";
import { erpRouter } from "../src/routes/v2/erp";
import { erpJournalService } from "../src/services/erp/erp-journal-service";

describe("Autonomous ERP Journal Entry Service & Routes", () => {
  let app: express.Application;
  const TENANT_ID = "00000000-0000-4000-8000-000000000001";
  const OTHER_TENANT_ID = "00000000-0000-4000-8000-000000000002";

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/v2/erp", erpRouter);
  });

  describe("Journal Synthesis & GAAP Balance", () => {
    it("synthesizes a balanced journal entry from a triangular settlement", async () => {
      const res = await request(app)
        .post("/api/v2/erp/journal/synthesize")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: TENANT_ID,
          settlement: {
            orderReference: "ORD-ENTERPRISE-101",
            orderAmountCents: 15000, // $150.00
            capturedAmountCents: 15000,
            feeDeductedCents: 465, // $4.65 (2.9% + 30c)
            netSettledCents: 14535, // $145.35
            currency: "USD",
          },
          targetSystem: "NETSUITE",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const journal = res.body.data;
      expect(journal.isBalanced).toBe(true);
      expect(journal.totalDebitCents).toBe("15000");
      expect(journal.totalCreditCents).toBe("15000");
      expect(journal.merkleProofHash).toMatch(/^0x[a-f0-9]{64}$/);
      expect(journal.lines.length).toBe(3);
    });

    it("rejects cross-tenant request with 403", async () => {
      const res = await request(app)
        .post("/api/v2/erp/journal/synthesize")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: OTHER_TENANT_ID,
          settlement: {
            orderReference: "ORD-HACK-01",
            orderAmountCents: 1000,
          },
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Tenant mismatch");
    });

    it("rejects unauthenticated request without tenant context with 400", async () => {
      const res = await request(app)
        .post("/api/v2/erp/journal/synthesize")
        .send({
          settlement: {
            orderReference: "ORD-NO-TENANT",
            orderAmountCents: 1000,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid tenant context is required");
    });
  });

  describe("Native ERP Payload Exports", () => {
    let journalId: string;

    beforeAll(() => {
      const j = erpJournalService.synthesizeFromSettlement(TENANT_ID, {
        orderReference: "ORD-EXPORT-TEST",
        orderAmountCents: 20000,
        capturedAmountCents: 20000,
        feeDeductedCents: 600,
        netSettledCents: 19400,
        currency: "USD",
      });
      journalId = j.journalId;
    });

    it("exports to NetSuite SuiteTalk REST format", async () => {
      const res = await request(app)
        .get(`/api/v2/erp/journal/${journalId}/export?targetSystem=NETSUITE&subsidiaryId=2`)
        .set("x-tenant-id", TENANT_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { payload } = res.body.data;
      expect(payload.subsidiary.id).toBe("2");
      expect(payload.memo).toContain(res.body.data.merkleProofHash);
      expect(payload.line.items.length).toBe(3);
    });

    it("exports to SAP S/4HANA OData format", async () => {
      const res = await request(app)
        .get(`/api/v2/erp/journal/${journalId}/export?targetSystem=SAP_S4HANA&companyCode=US10`)
        .set("x-tenant-id", TENANT_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { payload } = res.body.data;
      expect(payload.CompanyCode).toBe("US10");
      expect(payload.AccountingDocumentType).toBe("SA");
      expect(payload.to_Item.results.length).toBe(3);

      const debitItem = payload.to_Item.results.find((i: any) => i.DebitCreditCode === "S");
      const creditItem = payload.to_Item.results.find((i: any) => i.DebitCreditCode === "H");
      expect(debitItem).toBeDefined();
      expect(creditItem).toBeDefined();
    });
  });

  describe("Tenant Chart of Accounts Management", () => {
    it("updates and retrieves tenant Chart of Accounts mapping", async () => {
      const customMapping = {
        cashClearingAccountCode: "10199",
        cashClearingAccountName: "Custom Stripe Clearing",
      };

      const postRes = await request(app)
        .post("/api/v2/erp/coa")
        .set("x-tenant-id", TENANT_ID)
        .send({ mapping: customMapping });

      expect(postRes.status).toBe(200);
      expect(postRes.body.data.cashClearingAccountCode).toBe("10199");

      const getRes = await request(app).get("/api/v2/erp/coa").set("x-tenant-id", TENANT_ID);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.cashClearingAccountCode).toBe("10199");
      expect(getRes.body.data.cashClearingAccountName).toBe("Custom Stripe Clearing");
    });
  });
});
