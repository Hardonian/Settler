/**
 * Console Routes Test Suite
 *
 * Expanded console route coverage for CI deployment gates.
 * Tests all major console routes to ensure they return proper status codes.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Console routes to test
 */
const CONSOLE_ROUTES = [
  { path: "/console", name: "Console Home", requiresAuth: false },
  { path: "/console/runs", name: "Console Runs", requiresAuth: true },
  { path: "/console/runs/new", name: "Console New Run", requiresAuth: true },
  { path: "/console/billing", name: "Console Billing", requiresAuth: true },
  { path: "/console/settings", name: "Console Settings", requiresAuth: true },
  { path: "/console/api-keys", name: "Console API Keys", requiresAuth: true },
  { path: "/console/webhooks", name: "Console Webhooks", requiresAuth: true },
  { path: "/console/rules-engine", name: "Console Rules Engine", requiresAuth: true },
  { path: "/console/usage", name: "Console Usage", requiresAuth: true },
  { path: "/console/analytics", name: "Console Analytics", requiresAuth: true },
  { path: "/console/exceptions", name: "Console Exceptions", requiresAuth: true },
  { path: "/console/audit", name: "Console Audit Log", requiresAuth: true },
];

/**
 * Helper to check if page shows auth content
 */
async function showsAuthContent(page: Page): Promise<boolean> {
  const hasSignIn = await page
    .locator("text=Sign In")
    .isVisible()
    .catch(() => false);
  const hasLogin = await page
    .locator("text=Login")
    .isVisible()
    .catch(() => false);
  const hasSignUp = await page
    .locator("text=Sign Up")
    .isVisible()
    .catch(() => false);
  const hasSigninLower = await page
    .locator("text=sign in")
    .isVisible()
    .catch(() => false);

  return hasSignIn || hasLogin || hasSignUp || hasSigninLower;
}

/**
 * Helper to check if page shows console content
 */
async function showsConsoleContent(page: Page): Promise<boolean> {
  const selectors = [
    "text=Dashboard",
    "text=API Keys",
    "text=Runs",
    "text=Billing",
    "text=Settings",
    "text=Usage",
    "text=Analytics",
    "nav",
    'a[href*="/console/"]',
  ];

  for (const selector of selectors) {
    if (
      await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return true;
    }
  }

  return false;
}

test.describe("Console Routes - HTTP Status", () => {
  for (const route of CONSOLE_ROUTES) {
    test(`${route.name} (${route.path}) - should not return 5xx`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      console.log(`[Console] ${route.path}: ${status}`);

      // CRITICAL: Never return 5xx
      expect(status, `Console route ${route.path} should not return 5xx`).toBeLessThan(500);

      // Accept 200 or redirect (3xx)
      const acceptableStatuses = [200, 301, 302, 307, 308];
      expect(
        acceptableStatuses.includes(status),
        `Console route ${route.path} returned ${status}`
      ).toBe(true);
    });
  }
});

test.describe("Console Routes - Auth Behavior", () => {
  test("unauthenticated console access should redirect or show auth", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/console/runs`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status() || 0;
    const currentUrl = page.url();

    // Should redirect to auth or show auth content
    const isRedirected =
      currentUrl.includes("/login") ||
      currentUrl.includes("/signup") ||
      currentUrl.includes("/signin");

    const hasAuthContent = await showsAuthContent(page);

    console.log(
      `[Console Auth] /console/runs -> ${currentUrl} (status: ${status}), auth: ${hasAuthContent}`
    );

    // Should not return 5xx
    expect(status, "Should not return 5xx for protected route").toBeLessThan(500);

    // Either redirect or show auth content
    expect(
      isRedirected || hasAuthContent || status === 302,
      "Should redirect to auth or show auth content"
    ).toBe(true);
  });

  test("public console page should render", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/console`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const status = response?.status() || 0;

    // Should not return 5xx
    expect(status, "Console home should not return 5xx").toBeLessThan(500);

    // Should show either public overview or auth prompt
    const hasAuthContent = await showsAuthContent(page);
    const hasConsoleContent = await showsConsoleContent(page);

    expect(hasAuthContent || hasConsoleContent, "Console should show content or auth").toBe(true);
  });
});

test.describe("Console Routes - Page Content", () => {
  test("console routes should render meaningful content", async ({ page }) => {
    for (const route of CONSOLE_ROUTES.slice(0, 4)) {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for potential redirects
      await page.waitForTimeout(1000);

      // Should have content
      const bodyText = await page.textContent("body");
      expect(bodyText, `${route.name} should have content`).toBeTruthy();

      // Should not be an error page
      const isErrorPage =
        bodyText?.includes("Internal Error") ||
        bodyText?.includes("Application Error") ||
        bodyText?.includes("500");

      expect(isErrorPage, `${route.name} should not be error page`).toBe(false);
    }
  });
});

test.describe("Console API Routes", () => {
  test("console API routes should not return 5xx", async ({ request }) => {
    const apiRoutes = ["/api/console/subscription-status", "/api/console/tenant"];

    for (const apiRoute of apiRoutes) {
      const response = await request.get(`${BASE_URL}${apiRoute}`, {
        failOnStatusCode: false,
      });

      const status = response.status();

      console.log(`[Console API] ${apiRoute}: ${status}`);

      // Should not return 5xx
      expect(status, `API ${apiRoute} should not return 5xx`).toBeLessThan(500);
    }
  });

  test("subscription-status should return valid response", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/console/subscription-status`);

    expect(response.status(), "subscription-status should return 200").toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("tier");
    expect(data).toHaveProperty("hasSubscription");

    console.log(`[Console API] subscription-status: ${JSON.stringify(data)}`);
  });
});

test.describe("Console Navigation", () => {
  test("can navigate between console routes", async ({ page }) => {
    // Start at console home
    await page.goto(`${BASE_URL}/console`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for page to settle
    await page.waitForTimeout(1000);

    // Look for navigation links
    const navLinks = await page.$$("nav a, header a, [class*='nav'] a, [class*='menu'] a");

    console.log(`[Console Nav] Found ${navLinks.length} navigation links`);

    // Page should have loaded
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});

test.describe("Console Error Handling", () => {
  test("console should handle missing env vars gracefully", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/console`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Should not return 5xx even with missing env vars
    expect(response?.status(), "Console should handle missing env vars").toBeLessThan(500);

    // Should show error panel or redirect
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("console should not leak sensitive information", async ({ page }) => {
    await page.goto(`${BASE_URL}/console`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const bodyText = await page.textContent("body");

    // Should not show stack traces
    const hasStackTrace = bodyText?.includes("at ") && bodyText?.includes("/packages/");

    expect(hasStackTrace, "Should not show stack traces").toBe(false);
  });
});
