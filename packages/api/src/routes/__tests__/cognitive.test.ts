import express from "express";
import request from "supertest";

const queryWithTenantMock = jest.fn();

jest.mock("../../db", () => ({
  queryWithTenant: (...args: unknown[]) => queryWithTenantMock(...args),
  query: jest.fn(),
  transaction: jest.fn(),
}));

jest.mock("../../middleware/authorization", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.unmock("@settler/reconciliation-core");

const { cognitiveRouter } = require("../cognitive");

describe("Cognitive API Routes", () => {
  const TENANT = "tenant_enterprise_01";
  const USER = "user_operator_99";

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).tenantId = TENANT;
    (req as any).userId = USER;
    (req as any).traceId = "trace_test_01";
    next();
  });
  app.use("/api/v1", cognitiveRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    queryWithTenantMock.mockResolvedValue([]);
  });

  describe("POST /api/v1/cognitive/ingest", () => {
    it("extracts records from raw statement text and verifies mathematical balance", async () => {
      const res = await request(app)
        .post("/api/v1/cognitive/ingest")
        .send({
          rawText: `
            2026-09-01 TXN_ALPHA_01 $500.00 Stripe Net Payout USD
            2026-09-02 TXN_BETA_02 $1,250.00 Shopify Daily Payout USD
          `,
          documentType: "bank_statement",
          defaultRail: "stripe_payout",
          defaultCurrency: "USD",
          declaredNetTotalCents: "175000",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recordsExtracted).toBe(2);
      expect(res.body.data.computedNetTotalCents).toBe("175000");
      expect(res.body.data.balanceVerification.isBalanced).toBe(true);
      expect(res.body.data.balanceVerification.verdict).toBe("EXACT_MATCH");
      expect(queryWithTenantMock).toHaveBeenCalledWith(
        TENANT,
        expect.stringContaining("INSERT INTO audit_logs"),
        expect.any(Array)
      );
    });

    it("rejects invalid payload missing rawText", async () => {
      const res = await request(app).post("/api/v1/cognitive/ingest").send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/cognitive/adjudicate", () => {
    it("diagnoses root causes and generates bounded self-healing plans", async () => {
      const res = await request(app)
        .post("/api/v1/cognitive/adjudicate")
        .send({
          rail: "stripe_payouts",
          currency: "USD",
          exceptions: [
            {
              breakId: "break_101",
              sourceAmountCents: "250000",
              targetAmountCents: "250000",
              currency: "USD",
              sourceTimestamp: "2026-09-01T00:00:00Z",
              targetTimestamp: "2026-09-04T12:00:00Z",
              rail: "stripe_payouts",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.exceptionsAnalyzed).toBe(1);
      expect(res.body.data.rootCauseAttributions.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.healingPlans.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.simulation.replaySafe).toBe(true);
      expect(res.body.data.simulation.floatDriftCents).toBe("0");
    });
  });

  describe("POST /api/v1/cognitive/audit", () => {
    it("returns 100% census audit dossier with SHA-256 Merkle root and WASM snippet", async () => {
      const res = await request(app)
        .post("/api/v1/cognitive/audit")
        .send({
          query: "Verify all Stripe EUR settlements reconcile with zero float drift",
          periodFrom: "2026-07-01",
          periodTo: "2026-09-30",
          runs: [
            {
              runId: "run_prod_01",
              stateRoot: "48c781e9d1e3d36b7617b0769cf3ddf4b9ec43ef19942a78bf9fb6416182ee20",
              matchedCount: 15000,
              totalVolumeCents: "150000000",
              currency: "EUR",
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.censusAudit.samplingCoveragePct).toBe(100);
      expect(res.body.data.censusAudit.totalTransactionsVerified).toBe(15000);
      expect(res.body.data.censusAudit.unallocatedCreditsCents).toBe("0");
      expect(res.body.data.aggregatedMerkleRoot).toHaveLength(64);
      expect(res.body.data.wasmVerificationScript).toContain("verify_manifest");
    });
  });

  describe("POST /api/v1/cognitive/synthesize-adapter", () => {
    it("synthesizes TypeScript connector driver and test vectors", async () => {
      const res = await request(app).post("/api/v1/cognitive/synthesize-adapter").send({
        connectorName: "brazil_pix",
        apiSpecification:
          "type PixTransaction = { transaction_id: string; amount_cents: number; currency: string; created_at: string; }",
        version: "1.0.0",
        authStrategy: "oauth2",
        paginationStrategy: "cursor",
        defaultCurrency: "BRL",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.connectorName).toBe("brazil_pix");
      expect(res.body.data.className).toBe("BrazilPixConnector");
      expect(res.body.data.generatedClassSource).toContain(
        "export class BrazilPixConnector implements Connector"
      );
      expect(res.body.data.sha256Digest).toHaveLength(64);
    });
  });

  describe("Tenant Isolation Guardrail", () => {
    it("rejects request if tenantId is missing or empty", async () => {
      const unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      unauthenticatedApp.use((req, _res, next) => {
        (req as any).tenantId = ""; // Missing tenant
        (req as any).userId = USER;
        next();
      });
      unauthenticatedApp.use("/api/v1", cognitiveRouter);

      const res = await request(unauthenticatedApp).post("/api/v1/cognitive/audit").send({
        query: "Audit Q3",
        periodFrom: "2026-07-01",
        periodTo: "2026-09-30",
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Tenant context invariant violation");
    });
  });
});
