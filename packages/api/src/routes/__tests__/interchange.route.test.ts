import express from "express";
import request from "supertest";
import interchangeRouter from "../v1/interchange";

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../../middleware/auth", () => ({
  authMiddleware: (req: any, _res: any, next: () => void) => {
    req.tenantId = req.tenantId || "tenant-test-interchange";
    req.userId = req.userId || "user-test-interchange";
    next();
  },
}));

describe("Interchange++ Forensic Margin Recovery API", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
      req.tenantId = "tenant-test-interchange";
      req.userId = "user-test-interchange";
      next();
    });
    app.use("/api/v1/interchange", interchangeRouter);
  });

  it("GET /api/v1/interchange/rates returns statutory caps and card scheme benchmarks", async () => {
    const res = await request(app).get("/api/v1/interchange/rates");
    expect(res.status).toBe(200);
    expect(res.body.data.durbinStatutoryCap.fixedCents).toBe(22);
    expect(res.body.data.commercialB2B.level3TargetBps).toBe(180);
    expect(res.body.data.networkAssessments.visa.rateBps).toBe(14);
  });

  it("POST /api/v1/interchange/analyze evaluates commercial card missing Level 3 data", async () => {
    const payload = {
      transactionId: "tx_comm_1001",
      orderReference: "INV-2026-909",
      amountCents: 100000, // $1,000.00
      actualFeeCents: 2950, // $29.50 (2.95%)
      currency: "USD",
      cardBrand: "VISA",
      cardCategory: "CREDIT_COMMERCIAL_B2B",
      dataLevelProvided: "LEVEL_1",
      hoursToCapture: 12,
      hasSalesTaxAmount: false,
      hasLineItemDetail: false,
      hasCustomerCode: false,
    };

    const res = await request(app).post("/api/v1/interchange/analyze").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data.analysis.downgradeReason).toBe("DOWNGRADE_MISSING_LEVEL_3");
    expect(res.body.data.analysis.isRecoveryEligible).toBe(true);
    expect(res.body.data.analysis.excessLeakageCents).toBeGreaterThan(0);
    expect(res.body.data.enrichment).not.toBeNull();
    expect(res.body.data.enrichment.enrichmentReady).toBe(true);
    expect(res.body.data.enrichment.synthesizedEnrichment.suggestedCommodityCode).toBe("43211500");
  });

  it("POST /api/v1/interchange/analyze flags EIRF settlement timing breaches", async () => {
    const payload = {
      transactionId: "tx_eirf_2002",
      orderReference: "ORDER-8812",
      amountCents: 50000, // $500.00
      actualFeeCents: 1500, // $15.00
      currency: "USD",
      cardBrand: "MASTERCARD",
      cardCategory: "CREDIT_CONSUMER",
      dataLevelProvided: "LEVEL_1",
      hoursToCapture: 72, // >48h delay
    };

    const res = await request(app).post("/api/v1/interchange/analyze").send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data.analysis.downgradeReason).toBe("DOWNGRADE_EIRF_TIMING_BREACH");
    expect(res.body.data.analysis.recommendedRemediation).toContain("72 hours");
  });

  it("POST /api/v1/interchange/portfolio aggregates portfolio leakage and projected annual recovery", async () => {
    const transactions = [
      {
        transactionId: "tx_01",
        orderReference: "ORD-01",
        amountCents: 200000,
        actualFeeCents: 5900,
        currency: "USD",
        cardBrand: "VISA" as const,
        cardCategory: "CREDIT_COMMERCIAL_B2B" as const,
        dataLevelProvided: "LEVEL_1" as const,
        hoursToCapture: 12,
      },
      {
        transactionId: "tx_02",
        orderReference: "ORD-02",
        amountCents: 50000,
        actualFeeCents: 1475,
        currency: "USD",
        cardBrand: "MASTERCARD" as const,
        cardCategory: "CREDIT_CONSUMER" as const,
        dataLevelProvided: "LEVEL_1" as const,
        hoursToCapture: 96, // EIRF
      },
      {
        transactionId: "tx_03",
        orderReference: "ORD-03",
        amountCents: 10000,
        actualFeeCents: 120,
        currency: "USD",
        cardBrand: "VISA" as const,
        cardCategory: "DEBIT_REGULATED" as const,
        dataLevelProvided: "LEVEL_1" as const,
        hoursToCapture: 10,
      },
    ];

    const res = await request(app).post("/api/v1/interchange/portfolio").send({ transactions });

    expect(res.status).toBe(200);
    const { report } = res.body.data;
    expect(report.totalTransactionsAnalyzed).toBe(3);
    expect(report.totalGrossVolumeCents).toBe(260000);
    expect(report.totalRecoverableLeakageCents).toBeGreaterThan(0);
    expect(report.projectedAnnualRecoveryCents).toBeGreaterThan(0);
    expect(report.downgradeCounts.DOWNGRADE_MISSING_LEVEL_3).toBe(1);
    expect(report.downgradeCounts.DOWNGRADE_EIRF_TIMING_BREACH).toBe(1);
  });

  it("POST /api/v1/interchange/enrich-l3 synthesizes missing line-item and tax data", async () => {
    const res = await request(app).post("/api/v1/interchange/enrich-l3").send({
      transactionId: "tx_l3_99",
      cardBrand: "VISA",
      amountCents: 150000,
    });

    expect(res.status).toBe(200);
    const { audit } = res.body.data;
    expect(audit.qualifiedTier).toBe("STANDARD_DOWNGRADE_EIRF");
    expect(audit.targetTier).toBe("COMMERCIAL_LEVEL_3");
    expect(audit.enrichmentReady).toBe(true);
    expect(audit.synthesizedEnrichment.suggestedTaxCents).toBe(12375); // 8.25%
    expect(audit.synthesizedEnrichment.suggestedCommodityCode).toBe("43211500");
  });
});
