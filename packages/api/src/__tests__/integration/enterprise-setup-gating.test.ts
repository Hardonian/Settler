import express from "express";
import request from "supertest";
import enterpriseRouter from "../../routes/enterprise";

describe("Enterprise route setup gating", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/enterprise", enterpriseRouter);

  it("returns 503 + setupRequired for roles endpoint", async () => {
    const response = await request(app).get("/api/enterprise/roles");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: "ENTERPRISE_SETUP_REQUIRED",
      setupRequired: true,
      retryable: false,
    });
  });

  it("returns 503 + setupRequired for webhooks endpoint", async () => {
    const response = await request(app)
      .post("/api/enterprise/webhooks")
      .send({
        url: "https://example.com/webhooks",
        events: ["recon.completed"],
      });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: "ENTERPRISE_SETUP_REQUIRED",
      setupRequired: true,
      retryable: false,
    });
  });
});
