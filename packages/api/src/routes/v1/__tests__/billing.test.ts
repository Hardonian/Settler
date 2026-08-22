import request from "supertest";
import express from "express";
import { billingRouter } from "../billing";

jest.mock("../../../db", () => ({
  queryWithTenant: jest.fn().mockImplementation((tenantId: string, sql: string) => {
    if (sql.includes("SELECT tier")) {
      return Promise.resolve([]);
    }
    return Promise.resolve([]);
  }),
}));

describe("Billing API Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Attach dummy auth middleware simulating tenant resolution
    app.use((req, _res, next) => {
      (req as any).tenantId = "test-tenant-123";
      next();
    });
    app.use("/billing", billingRouter);
  });

  describe("GET /billing/status", () => {
    it("returns default tier when no billing record exists", async () => {
      const response = await request(app).get("/billing/status");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        tier: "free",
        currentUsage: 0,
        usageLimit: 1000,
        status: "active",
      });
    });

    it("returns 401 if tenantId is missing", async () => {
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use("/billing", billingRouter);

      const response = await request(unauthApp).get("/billing/status");
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });

  describe("POST /billing/checkout", () => {
    it("returns fallback checkout URL in dev when Stripe is not configured", async () => {
      const response = await request(app)
        .post("/billing/checkout")
        .send({ priceId: "price_123", tier: "pro" });

      expect(response.status).toBe(200);
      expect(response.body.url).toContain("https://checkout.stripe.com/pay/");
    });
  });

  describe("POST /billing/portal", () => {
    it("returns fallback portal URL in dev when Stripe is not configured", async () => {
      const response = await request(app).post("/billing/portal");
      expect(response.status).toBe(200);
      expect(response.body.url).toContain("https://billing.stripe.com/p/session/");
    });
  });
});
