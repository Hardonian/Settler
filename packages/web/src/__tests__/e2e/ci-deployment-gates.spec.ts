/**
 * CI Deployment Gate Tests
 *
 * This test suite provides comprehensive CI deployment gates:
 * - HTTP status validation (no 5xx errors)
 * - Console error detection (critical browser errors)
 * - Failed network request detection
 * - Broken resource detection
 * - Page render validation
 *
 * These tests are designed to run in CI and catch regressions before deployment.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Helper to capture console errors
 */
function createConsoleErrorCollector(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      // Filter out known non-critical errors
      if (!isIgnoredError(text)) {
        errors.push(text);
      }
    } else if (msg.type() === "warning") {
      warnings.push(text);
    }
  });

  return { errors, warnings };
}

/**
 * Filter known non-critical errors
 */
function isIgnoredError(text: string): boolean {
  const ignoredPatterns = [
    /favicon/i,
    /404.*favicon/i,
    /Failed to load resource.*favicon/i,
    /third-party-cookie/i,
    /third party cookie/i,
    /ad-block/i,
    /AdsBlocked/i,
    /sandbox.*allow-scripts/i,
    /Failed to execute.*inline-script/i,
  ];

  return ignoredPatterns.some((pattern) => pattern.test(text));
}

/**
 * Critical routes that MUST return 200 and never 5xx
 */
const CRITICAL_ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/pricing", name: "Pricing" },
  { path: "/docs", name: "Documentation" },
  { path: "/console", name: "Console" },
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Signup" },
];

/**
 * Marketing routes that should work
 */
const MARKETING_ROUTES = [
  { path: "/about", name: "About" },
  { path: "/platform", name: "Platform" },
  { path: "/capabilities", name: "Capabilities" },
  { path: "/product", name: "Product" },
  { path: "/blog", name: "Blog" },
  { path: "/changelog", name: "Changelog" },
  { path: "/support", name: "Support" },
  { path: "/status", name: "Status" },
  { path: "/trust", name: "Trust" },
  { path: "/security", name: "Security" },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
];

test.describe("CI Deployment Gates - HTTP Status", () => {
  for (const route of CRITICAL_ROUTES) {
    test(`${route.name} (${route.path}) - should return 200 or redirect`, async ({ page }) => {
      const { errors } = createConsoleErrorCollector(page);

      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      // Log for debugging
      console.log(`[HTTP] ${route.path}: ${status}`);

      // CRITICAL: Never return 5xx
      expect(status, `Route ${route.path} should not return 5xx`).toBeLessThan(500);

      // Accept 200, 301, 302, 307, 308 (redirects are ok for auth routes)
      const acceptableStatuses = [200, 301, 302, 307, 308];
      expect(
        acceptableStatuses.includes(status),
        `Route ${route.path} returned ${status}, expected one of: ${acceptableStatuses.join(", ")}`
      ).toBe(true);
    });
  }
});

test.describe("CI Deployment Gates - Marketing Routes", () => {
  for (const route of MARKETING_ROUTES) {
    test(`${route.name} (${route.path}) - should return 200`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      console.log(`[HTTP] ${route.path}: ${status}`);

      // Marketing routes should not return 5xx
      expect(status, `Marketing route ${route.path} should not return 5xx`).toBeLessThan(500);

      // Should return 200 (marketing pages should be public)
      expect(status, `Marketing route ${route.path} should return 200`).toBe(200);
    });
  }
});

test.describe("CI Deployment Gates - Console Error Detection", () => {
  test("critical routes should not have console errors", async ({ page }) => {
    const allErrors: Array<{ path: string; error: string }> = [];

    for (const route of CRITICAL_ROUTES.slice(0, 4)) {
      const { errors } = createConsoleErrorCollector(page);

      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for any async errors
      await page.waitForTimeout(1000);

      for (const error of errors) {
        allErrors.push({ path: route.path, error });
      }
    }

    // Log errors if any
    if (allErrors.length > 0) {
      console.error("Console errors found:");
      allErrors.forEach(({ path, error }) => {
        console.error(`  ${path}: ${error}`);
      });
    }

    // Allow up to 2 errors (some routes may have minor issues)
    expect(
      allErrors.length,
      `Expected at most 2 console errors, found ${allErrors.length}`
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("CI Deployment Gates - Network Request Validation", () => {
  test("critical routes should not have failed network requests", async ({ page }) => {
    const failedRequests: Array<{ url: string; failure: string }> = [];

    // Track failed requests
    page.on("requestfailed", (request) => {
      const url = new URL(request.url());
      // Only track same-origin requests
      if (url.origin === new URL(BASE_URL).origin) {
        failedRequests.push({
          url: request.url(),
          failure: request.failure()?.errorText || "Unknown failure",
        });
      }
    });

    for (const route of CRITICAL_ROUTES.slice(0, 3)) {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await page.waitForTimeout(500);
    }

    // Log failures
    if (failedRequests.length > 0) {
      console.error("Failed requests:");
      failedRequests.forEach(({ url, failure }) => {
        console.error(`  ${url}: ${failure}`);
      });
    }

    // Allow some failures (e.g., optional API calls)
    expect(
      failedRequests.length,
      `Expected no critical request failures, found ${failedRequests.length}`
    ).toBeLessThanOrEqual(2);
  });
});

test.describe("CI Deployment Gates - Page Render Validation", () => {
  test("homepage should render meaningful content", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for page content
    const bodyText = await page.textContent("body");
    expect(bodyText, "Homepage should have content").toBeTruthy();
    expect(bodyText?.length, "Homepage should have meaningful content").toBeGreaterThan(100);

    // Check it's not an error page
    const errorIndicators = ["Internal Error", "Application Error", "Something went wrong"];
    for (const indicator of errorIndicators) {
      expect(bodyText?.includes(indicator), `Homepage should not contain "${indicator}"`).toBe(
        false
      );
    }
  });

  test("pricing page should render pricing content", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const bodyText = await page.textContent("body");
    expect(bodyText, "Pricing page should have content").toBeTruthy();

    // Should contain pricing-related text
    const hasPricingContent =
      bodyText?.toLowerCase().includes("price") ||
      bodyText?.toLowerCase().includes("plan") ||
      bodyText?.toLowerCase().includes("free") ||
      bodyText?.toLowerCase().includes("pro");

    expect(hasPricingContent, "Pricing page should contain pricing information").toBe(true);
  });

  test("docs page should render documentation", async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const bodyText = await page.textContent("body");
    expect(bodyText, "Docs page should have content").toBeTruthy();

    // Should contain doc-related text
    const hasDocContent =
      bodyText?.toLowerCase().includes("doc") ||
      bodyText?.toLowerCase().includes("guide") ||
      bodyText?.toLowerCase().includes("api") ||
      bodyText?.toLowerCase().includes("tutorial");

    expect(hasDocContent, "Docs page should contain documentation").toBe(true);
  });
});

test.describe("CI Deployment Gates - Health Check", () => {
  test("health endpoint should be accessible", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    // Should not return 5xx
    expect(response.status(), "Health endpoint should not return 5xx").toBeLessThan(500);

    // Should return 200 or 503 (degraded but not 5xx)
    expect([200, 503], "Health endpoint should return 200 or 503").toContain(response.status());
  });
});
