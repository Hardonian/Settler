import express from "express";
import request from "supertest";
import {
  TriangularWebhookAdapter,
  triangularWebhookAdapter,
} from "../src/services/ingestion/triangular-webhook-adapter";
import { triangularRouter } from "../src/routes/v2/triangular";

describe("Triangular Webhook Ingestion Adapter", () => {
  let adapter: TriangularWebhookAdapter;
  const TENANT_ID = "00000000-0000-4000-8000-000000000001";
  const ORDER_REF = "ORD-2026-X999";

  beforeEach(() => {
    adapter = new TriangularWebhookAdapter();
  });

  describe("Real-Time Multi-Party Webhook Convergence", () => {
    it("stages individual legs and triggers reconciliation when triplet converges", async () => {
      // Step 1: Ingest Shopify order webhook
      const orderRes = await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "shopify",
        eventType: "orders/create",
        payload: {
          id: "shopify_order_101",
          name: ORDER_REF,
          current_total_price: "250.00",
          currency: "USD",
          created_at: new Date().toISOString(),
        },
      });

      expect(orderRes.ingestedLeg).toBe("order");
      expect(orderRes.converged).toBe(false);

      // Verify staging state
      let staging = adapter.getStagingStatus(TENANT_ID);
      expect(staging.stagedOrdersCount).toBe(1);
      expect(staging.stagedCapturesCount).toBe(0);
      expect(staging.stagedSweepsCount).toBe(0);

      // Step 2: Ingest Stripe payment_intent capture webhook
      const captureRes = await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "stripe",
        eventType: "payment_intent.succeeded",
        payload: {
          id: "pi_stripe_ch_101",
          amount: 25000, // $250.00 in cents
          currency: "usd",
          description: ORDER_REF,
          feeDeductedCents: 755, // $7.55 processor fee
          created: Math.floor(Date.now() / 1000),
        },
      });

      expect(captureRes.ingestedLeg).toBe("capture");
      expect(captureRes.converged).toBe(false);

      staging = adapter.getStagingStatus(TENANT_ID);
      expect(staging.stagedOrdersCount).toBe(1);
      expect(staging.stagedCapturesCount).toBe(1);

      // Step 3: Ingest Stripe payout sweep webhook -> triplet converges!
      const sweepRes = await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "stripe",
        eventType: "payout.paid",
        payload: {
          id: "po_bank_sweep_101",
          amount: 24245, // $242.45 net bank deposit
          currency: "usd",
          metadata: { order_id: ORDER_REF },
          destination: "ba_chase_operating_1",
          arrival_date: Math.floor(Date.now() / 1000),
        },
      });

      expect(sweepRes.ingestedLeg).toBe("sweep");
      expect(sweepRes.converged).toBe(true);
      expect(sweepRes.settlement).toBeDefined();
      expect(sweepRes.settlement?.orderReference).toBe(ORDER_REF);
      expect(sweepRes.settlement?.orderAmountCents).toBe(25000);
      expect(sweepRes.settlement?.capturedAmountCents).toBe(25000);
      expect(sweepRes.settlement?.netSettledCents).toBe(24245);

      // Verify legs were evicted from staging upon convergence
      staging = adapter.getStagingStatus(TENANT_ID);
      expect(staging.stagedOrdersCount).toBe(0);
      expect(staging.stagedCapturesCount).toBe(0);
      expect(staging.stagedSweepsCount).toBe(0);
      expect(staging.convergedSettlementsCount).toBe(1);
    });

    it("handles Adyen capture and Plaid sweep legs with generic formats", async () => {
      const ref = "ORD-ADYEN-PLAID-55";

      // Generic Order
      await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "generic",
        payload: {
          legType: "order",
          orderReference: ref,
          amountCents: 10000,
          currency: "EUR",
        },
      });

      // Adyen Capture
      await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "adyen",
        payload: {
          pspReference: "adyen_psp_9988",
          merchantReference: ref,
          amount: { value: 10000, currency: "EUR" },
          fee: 250,
        },
      });

      // Plaid Transfer Sweep -> Triplet converges!
      const sweepRes = await adapter.ingestWebhookEvent({
        tenantId: TENANT_ID,
        adapter: "plaid",
        payload: {
          transfer_id: "plaid_tr_77",
          reference: ref,
          amount: 97.5,
          iso_currency_code: "EUR",
        },
      });

      expect(sweepRes.converged).toBe(true);
      expect(sweepRes.settlement?.orderReference).toBe(ref);
    });
  });

  describe("API v2 Triangular Ingestion Endpoints", () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use("/api/v2/reconciliation/triangular", triangularRouter);
    });

    it("ingests webhook event via POST /ingest", async () => {
      const res = await request(app)
        .post("/api/v2/reconciliation/triangular/ingest")
        .set("x-tenant-id", TENANT_ID)
        .send({
          tenantId: TENANT_ID,
          adapter: "shopify",
          payload: {
            name: "API-ORD-77",
            current_total_price: "100.00",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ingestedLeg).toBe("order");
    });

    it("fetches staging status via GET /staging", async () => {
      const res = await request(app)
        .get("/api/v2/reconciliation/triangular/staging")
        .set("x-tenant-id", TENANT_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stagedOrdersCount).toBeDefined();
      expect(res.body.data.recentSettlements).toBeInstanceOf(Array);
    });
  });
});
