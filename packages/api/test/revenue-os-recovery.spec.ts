/**
 * Revenue OS Autonomous Recovery Pipeline Specification
 *
 * Verifies processor dispute package generation, fee overcharge aggregation,
 * tenant isolation, and filing export bundles.
 */

import express from "express";
import request from "supertest";
import {
  RevenueOsRecoveryService,
  DiscrepancyInputItem,
} from "../src/services/recovery/revenue-os-recovery-service";
import { recoveryRouter } from "../src/routes/v2/recovery";

describe("Revenue OS Autonomous Recovery Pipeline", () => {
  const tenantA = "00000000-0000-4000-8000-00000000000a";
  const tenantB = "00000000-0000-4000-8000-00000000000b";
  let service: RevenueOsRecoveryService;

  beforeEach(() => {
    service = new RevenueOsRecoveryService();
  });

  it("generates processor fee overcharge claim from fee discrepancies", () => {
    const items: DiscrepancyInputItem[] = [
      {
        id: "disc_01",
        rootCause: "PROCESSOR_FEE_DEDUCTION",
        sourceAmount: 100.0,
        varianceAmount: 2.9,
        currency: "USD",
        processorName: "STRIPE",
      },
      {
        id: "disc_02",
        rootCause: "PROCESSOR_FEE_DEDUCTION",
        sourceAmount: 200.0,
        varianceAmount: 5.8,
        currency: "USD",
        processorName: "STRIPE",
      },
    ];

    const claims = service.generateClaimsFromDiscrepancies(tenantA, items);

    expect(claims).toHaveLength(1);
    const claim = claims[0]!;
    expect(claim.claimType).toBe("PROCESSOR_FEE_OVERCHARGE");
    expect(claim.totalClaimAmountMinorUnits).toBe(870); // $8.70 (870 cents)
    expect(claim.affectedTransactionsCount).toBe(2);
    expect(claim.evidencePackage).toHaveLength(1);
    expect(claim.claimHash).toBeDefined();
    expect(claim.status).toBe("READY_TO_FILE");
  });

  it("generates unsettled gateway capture claim for delayed sweeps", () => {
    const items: DiscrepancyInputItem[] = [
      {
        id: "disc_unsettled_01",
        rootCause: "SETTLEMENT_TIMING_DRIFT",
        sourceAmount: 350.0,
        varianceAmount: 350.0,
        currency: "USD",
        processorName: "ADYEN",
      },
    ];

    const claims = service.generateClaimsFromDiscrepancies(tenantA, items);

    expect(claims).toHaveLength(1);
    const claim = claims[0]!;
    expect(claim.claimType).toBe("UNSETTLED_GATEWAY_CAPTURE");
    expect(claim.totalClaimAmountMinorUnits).toBe(35000); // $350.00
    expect(claim.evidencePackage[0]!.evidenceType).toBe("TRANSIT_SLA_BREACH");
  });

  it("exports a verified dispute filing package with CSV line items", () => {
    const items: DiscrepancyInputItem[] = [
      {
        id: "disc_exp_01",
        rootCause: "PROCESSOR_FEE_DEDUCTION",
        sourceAmount: 150.0,
        varianceAmount: 4.35,
        currency: "USD",
        processorName: "STRIPE",
      },
    ];

    const claims = service.generateClaimsFromDiscrepancies(tenantA, items);
    const claimId = claims[0]!.id;

    const bundle = service.exportFilingBundle(tenantA, claimId);

    expect(bundle).not.toBeNull();
    expect(bundle!.claimId).toBe(claimId);
    expect(bundle!.tenantId).toBe(tenantA);
    expect(bundle!.formattedFilingPayload.lineItemsCsv).toContain("TransactionId,SourceReference");
    expect(bundle!.formattedFilingPayload.canonicalHash).toBeDefined();
  });

  it("strictly enforces multi-tenant boundary isolation across claims", () => {
    const itemsA: DiscrepancyInputItem[] = [
      {
        id: "disc_a",
        rootCause: "PROCESSOR_FEE_DEDUCTION",
        sourceAmount: 100.0,
        varianceAmount: 2.9,
        currency: "USD",
      },
    ];

    service.generateClaimsFromDiscrepancies(tenantA, itemsA);

    const claimsA = service.listClaims(tenantA);
    const claimsB = service.listClaims(tenantB);

    // Tenant B cannot access Tenant A's claims
    expect(claimsB.every((c) => c.tenantId === tenantB)).toBe(true);
    expect(claimsA.some((c) => c.tenantId === tenantB)).toBe(false);

    // Cross-tenant export attempt returns null
    const bundleCrossTenant = service.exportFilingBundle(tenantB, claimsA[0]!.id);
    expect(bundleCrossTenant).toBeNull();
  });

  describe("API v2 Recovery Routes", () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        (req as any).tenantId = tenantA;
        next();
      });
      app.use("/api/v2/recovery", recoveryRouter);
    });

    it("GET /api/v2/recovery/claims returns claims for the authenticated tenant", async () => {
      const res = await request(app).get("/api/v2/recovery/claims").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.tenantId).toBe(tenantA);
      expect(res.body.claimsCount).toBeGreaterThanOrEqual(1);
    });

    it("POST /api/v2/recovery/claims/generate generates and returns new claims", async () => {
      const res = await request(app)
        .post("/api/v2/recovery/claims/generate")
        .send({
          items: [
            {
              id: "item_api_01",
              rootCause: "PROCESSOR_FEE_DEDUCTION",
              sourceAmount: 50.0,
              varianceAmount: 1.45,
              currency: "USD",
              processorName: "STRIPE",
            },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.generatedClaimsCount).toBe(1);
      expect(res.body.claims[0].claimType).toBe("PROCESSOR_FEE_OVERCHARGE");
    });
  });
});
