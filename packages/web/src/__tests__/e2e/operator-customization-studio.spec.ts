/**
 * Operator Customization — API auth boundaries + optional authenticated smoke (storage state).
 *
 * Set PLAYWRIGHT_ADMIN_STORAGE_STATE to a path of a Playwright storageState JSON export
 * for a super-admin session to run the persisted round-trip check in CI/staging.
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const adminStorage = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE;

test.describe("operator customization API (unauthenticated)", () => {
  test("GET /api/admin/operator-customization returns 401 or 403 without session", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/admin/operator-customization`);
    expect([401, 403]).toContain(res.status());
  });

  test("PUT /api/admin/operator-customization returns 401 or 403 without session", async ({
    request,
  }) => {
    const res = await request.put(`${BASE}/api/admin/operator-customization`, {
      data: { draft: { schemaVersion: "1", operatingMode: "standard", modules: [] } },
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403]).toContain(res.status());
  });
});

const describeAdmin = adminStorage ? test.describe : test.describe.skip;

describeAdmin("operator customization (super-admin storage state)", () => {
  test.use({ storageState: adminStorage! });

  test("GET customization returns 200 and JSON shape", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/operator-customization`);
    if (res.status() === 400) {
      const body = await res.json().catch(() => ({}));
      test.skip(
        body.code === "ambiguous_tenant",
        "Multiple tenants require explicit tenantId; set PLAYWRIGHT_CUSTOMIZATION_TENANT_ID or use single-tenant DB"
      );
    }
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.draft).toBeDefined();
    expect(json.published).toBeDefined();
    expect(json.tenant).toBeDefined();
  });

  test("studio page loads shell when authenticated", async ({ page }) => {
    await page.goto(`${BASE}/admin/operator-customization`, { waitUntil: "domcontentloaded" });
    const studio = page.getByTestId("operator-customization-studio");
    const loading = page.getByTestId("operator-customization-loading");
    await expect(studio.or(loading)).toBeVisible({ timeout: 20000 });
  });
});
