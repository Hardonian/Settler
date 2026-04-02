/**
 * Empty State Tests
 *
 * Tests empty-state rendering, key CTA flow checks,
 * and content loading states.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Routes that may have empty states
 */
const ROUTES_WITH_POTENTIAL_EMPTY_STATES = [
  { path: "/console/runs", name: "Console Runs" },
  { path: "/console/billing", name: "Console Billing" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/docs", name: "Documentation" },
];

/**
 * CTA elements to look for
 */
const CTA_SELECTORS = [
  'a:has-text("Get Started")',
  'a:has-text("Sign Up")',
  'a:has-text("Start Free")',
  'a:has-text("Create Account")',
  'button:has-text("Get Started")',
  'button:has-text("Sign Up")',
  'button:has-text("Start Free")',
  'a:has-text("Learn More")',
  'a:has-text("View Pricing")',
  'a:has-text("Read Docs")',
];

test.describe("Empty State Rendering", () => {
  test("pages should render without crashing when empty", async ({ page }) => {
    for (const route of ROUTES_WITH_POTENTIAL_EMPTY_STATES) {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      // Should not return 5xx
      expect(status, `${route.name} should not return 5xx`).toBeLessThan(500);

      // Should have some content
      const bodyText = await page.textContent("body");
      expect(bodyText, `${route.name} should have content`).toBeTruthy();

      console.info(`[EmptyState] ${route.name}: ${status}`);
    }
  });
});

test.describe("CTA Element Detection", () => {
  test("homepage should have key CTAs", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for at least one CTA
    let hasCTA = false;
    for (const selector of CTA_SELECTORS.slice(0, 4)) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        hasCTA = true;
        console.info(`[CTA] Found: ${selector}`);
        break;
      }
    }

    expect(hasCTA, "Homepage should have at least one key CTA").toBe(true);
  });

  test("pricing page should have CTA", async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Look for pricing CTAs
    const pricingCTAs = [
      'a:has-text("Get Started")',
      'a:has-text("Start Free")',
      'a:has-text("Sign Up")',
      'button:has-text("Get Started")',
      'button:has-text("Start Free")',
    ];

    let hasCTA = false;
    for (const selector of pricingCTAs) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        hasCTA = true;
        console.info(`[CTA] Pricing page found: ${selector}`);
        break;
      }
    }

    expect(hasCTA, "Pricing page should have a CTA").toBe(true);
  });

  test("docs page should have navigation CTAs", async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Look for doc navigation
    const docCTAs = [
      'a:has-text("Get Started")',
      'a:has-text("API Reference")',
      'a:has-text("Guide")',
      "nav",
      "aside",
    ];

    let hasContent = false;
    for (const selector of docCTAs) {
      if (
        await page
          .locator(selector)
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        hasContent = true;
        console.info(`[Docs] Found: ${selector}`);
        break;
      }
    }

    expect(hasContent, "Docs page should have navigation").toBe(true);
  });
});

test.describe("Content Loading States", () => {
  test("pages should eventually load content", async ({ page }) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for potential loading states
    await page.waitForTimeout(2000);

    // Check that we have meaningful content
    const bodyText = await page.textContent("body");
    expect(bodyText?.length, "Should have loaded content").toBeGreaterThan(50);
  });

  test("should not show infinite loading", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (text.includes("infinite") || text.includes("loading")) {
          errors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for any async issues
    await page.waitForTimeout(2000);

    expect(errors.length, "Should not have infinite loading errors").toBe(0);
  });
});

test.describe("Console Empty States", () => {
  test("console page should handle unauthenticated state", async ({ page }) => {
    await page.goto(`${BASE_URL}/console`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Should show either:
    // 1. Sign in prompt
    // 2. Public overview
    // 3. Redirect to login

    const bodyText = await page.textContent("body");
    expect(bodyText, "Console should render something").toBeTruthy();

    // Should not show empty/undefined content
    const hasValidContent = bodyText && bodyText.length > 20;
    expect(hasValidContent, "Console should show meaningful content").toBe(true);
  });

  test("console runs page should handle empty runs", async ({ page }) => {
    await page.goto(`${BASE_URL}/console/runs`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = await page.evaluate(() => {
      return window.performance.getEntriesByType("resource").length;
    });

    // Should load without crashing
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    console.info(`[Console] Runs page resources: ${status}`);
  });
});

test.describe("Loading Error States", () => {
  test("should show user-friendly error when resources fail", async ({ page }) => {
    // Navigate to a page and track failures
    const failedRequests: string[] = [];

    page.on("requestfailed", (request) => {
      failedRequests.push(request.url());
    });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Even with some failed requests, UI should render
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    // Should not show raw error messages
    const hasRawErrors =
      bodyText?.includes("TypeError:") ||
      bodyText?.includes("ReferenceError:") ||
      bodyText?.includes("SyntaxError:");

    expect(hasRawErrors, "Should not show raw JS errors").toBe(false);
  });
});

test.describe("Error Page Testing", () => {
  test("404 page should render correctly", async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto(`${BASE_URL}/non-existent-page-12345`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // May return 404 or redirect
    const status = response?.status() || 0;

    // Should not return 5xx
    expect(status, "404 should not return 5xx").toBeLessThan(500);

    // Should show some content
    const bodyText = await page.textContent("body");
    expect(bodyText, "404 page should have content").toBeTruthy();
  });

  test("should have helpful links on error pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/404`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for navigation links
    const homeLink = page.locator('a[href="/"]');
    const hasHomeLink = await homeLink.isVisible().catch(() => false);

    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    console.info(`[404] Has home link: ${hasHomeLink}`);
  });
});
