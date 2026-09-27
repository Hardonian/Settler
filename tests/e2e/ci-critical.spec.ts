import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:4000";

test.describe("CI critical production journeys", () => {
  test("landing page presents the reconciliation value proposition", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Deterministic reconciliation. Verifiable audit evidence.",
      })
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();
  });

  for (const route of ["/docs", "/pricing", "/trust"]) {
    test(`${route} is a real production page`, async ({ request }) => {
      const response = await request.get(route);
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      expect(body).not.toMatch(/Internal Server Error|Application error: a server-side exception/i);
    });
  }

  test("marketing responses carry the baseline browser security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(response.status()).toBe(200);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  test("API health reports operational status", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.status).toBe("ok");
  });

  test("protected API rejects unauthenticated access with a typed error", async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/jobs`);
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message || body.detail).toBeTruthy();
  });

  test("console API rejects unauthenticated access without a server error", async ({ request }) => {
    const response = await request.get("/api/console/api-keys");
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message).toBeTruthy();
  });
});
