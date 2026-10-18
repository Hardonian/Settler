/**
 * Triangular Reconciliation & Rule Synthesis API Route Specifications
 *
 * Verifies end-to-end API endpoints for 3-way triangular matching
 * and adjudication memory rule synthesis with tenant isolation.
 */

import express from "express";
import request from "supertest";
import { triangularRouter } from "../src/routes/v2/triangular";
import { ruleSynthesisRouter } from "../src/routes/v2/rule-synthesis";

jest.unmock("@settler/reconciliation-core");

describe("Triangular Reconciliation & Rule Synthesis v2 APIs", () => {
  let app: express.Express;
  const tenantId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).tenantId = tenantId;
      next();
    });
    app.use("/api/v2/reconciliation/triangular", triangularRouter);
    app.use("/api/v2/rules/synthesize", ruleSynthesisRouter);
  });

  describe("POST /api/v2/reconciliation/triangular", () => {
    it("successfully performs 3-way triangular reconciliation across orders, captures, and deposits", async () => {
      const payload = {
        tenantId,
        orders: [
          {
            id: "ord_api_1",
            orderNumber: "ORD-API-001",
            amountCents: "15000",
            currency: "USD",
            timestamp: "2026-10-18T10:00:00Z",
          },
        ],
        captures: [
          {
            id: "cap_api_1",
            orderNumber: "ORD-API-001",
            gatewayTransactionId: "ch_api_1",
            grossAmountCents: "15000",
            feeCents: "465",
            netAmountCents: "14535",
            currency: "USD",
            timestamp: "2026-10-18T10:00:05Z",
          },
        ],
        deposits: [
          {
            id: "dep_api_1",
            reference: "DEP-API-001",
            depositAmountCents: "14535",
            currency: "USD",
            timestamp: "2026-10-18T14:00:00Z",
          },
        ],
      };

      const res = await request(app).post("/api/v2/reconciliation/triangular").send(payload);

      if (res.status !== 200) {
        console.error("Triangular test response body:", res.body);
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.perfectMatches).toHaveLength(1);
      expect(res.body.data.metrics.matchRatePercentage).toBe(100);
      expect(res.body.data.metrics.merkleRoot).toBeDefined();
    });

    it("rejects non-array inputs with 400", async () => {
      const res = await request(app)
        .post("/api/v2/reconciliation/triangular")
        .send({ orders: "not an array" })
        .expect(400);

      expect(res.body.error).toContain("must be arrays");
    });
  });

  describe("POST /api/v2/rules/synthesize", () => {
    it("synthesizes backtested rule proposals from adjudication memory", async () => {
      const res = await request(app)
        .post("/api/v2/rules/synthesize")
        .send({ tenantId, minSampleThreshold: 3 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.proposalsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.proposals[0].requiresPolicyToken).toBe(true);
      expect(res.body.proposals[0].status).toBe("DRAFT");
    });
  });
});
