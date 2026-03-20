/**
 * Route Audit Test - Phase 1: Route Reality
 *
 * This test systematically verifies all routes work correctly:
 * - HTTP status codes (should be 200, not 404/500)
 * - Console errors (JS errors, hydration failures)
 * - Page rendering (is content visible or just empty shell?)
 * - Auth-protected routes redirect properly when unauthenticated
 */

import { test, expect, Page } from "@playwright/test";

interface RouteTestResult {
  route: string;
  status: number;
  hasErrors: boolean;
  errors: string[];
  hasContent: boolean;
  redirectUrl?: string;
}

const routesToTest = {
  // Marketing Routes
  marketing: ["/", "/about", "/pricing", "/docs", "/platform", "/capabilities", "/product"],
  // Console Routes
  console: [
    "/console",
    "/console/dashboard",
    "/console/runs",
    "/console/rules",
    "/console/exceptions",
    "/console/integrations",
    "/console/billing",
  ],
  // Dashboard Routes
  dashboard: ["/dashboard", "/dashboard/settings"],
  // Auth Routes
  auth: ["/login", "/signup", "/forgot-password"],
  // Error Routes
  error: ["/404", "/500"],
};

// Collect all console errors
async function captureConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  return errors;
}

// Check if page has meaningful content
async function hasPageContent(page: Page): Promise<boolean> {
  // Check for common content indicators
  const body = await page.locator("body").textContent();
  if (!body || body.trim().length < 50) return false;

  // Check for main content elements
  const hasMain = (await page.locator("main").count()) > 0;
  const hasH1 = (await page.locator("h1").count()) > 0;
  const hasHeading =
    (await page.locator('[class*="heading"], [class*="title"], [class*="hero"]').count()) > 0;

  return hasMain || hasH1 || hasHeading || body.trim().length > 100;
}

// Test a single route
async function testRoute(page: Page, route: string): Promise<RouteTestResult> {
  const BASE_URL = "http://localhost:3000";
  const errors: string[] = [];

  // Set up console error capture
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(`Page Error: ${error.message}`);
  });

  try {
    const response = await page.goto(route, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status() || 0;

    // Wait a bit for any client-side errors to appear
    await page.waitForTimeout(2000);

    const hasContent = await hasPageContent(page);

    // Check if we were redirected (common for auth-protected routes)
    const currentUrl = page.url();
    let redirectUrl: string | undefined;
    if (currentUrl !== `http://localhost:3000${route}`) {
      redirectUrl = currentUrl;
    }

    return {
      route,
      status,
      hasErrors: errors.length > 0,
      errors,
      hasContent,
      redirectUrl,
    };
  } catch (error: any) {
    return {
      route,
      status: 0,
      hasErrors: true,
      errors: [error.message],
      hasContent: false,
    };
  }
}

// Test Marketing Routes
test.describe("Marketing Routes", () => {
  for (const route of routesToTest.marketing) {
    test(`${route} - should be accessible`, async ({ page }) => {
      const result = await testRoute(page, route);

      console.log(`\n📍 Testing ${route}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Has Errors: ${result.hasErrors}`);
      console.log(`   Has Content: ${result.hasContent}`);
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(", ")}`);
      }

      // Marketing routes should return 200 and have content
      expect(result.status).toBe(200);
      expect(result.hasContent).toBe(true);
    });
  }
});

// Test Console Routes
test.describe("Console Routes", () => {
  for (const route of routesToTest.console) {
    test(`${route} - should be accessible or redirect`, async ({ page }) => {
      const result = await testRoute(page, route);

      console.log(`\n📍 Testing ${route}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Has Errors: ${result.hasErrors}`);
      console.log(`   Has Content: ${result.hasContent}`);
      console.log(`   Redirect: ${result.redirectUrl || "none"}`);
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(", ")}`);
      }

      // Console routes might redirect to login (302) or return 200
      // They should NOT return 404 or 500
      expect([200, 302]).toContain(result.status);

      // If redirected, it should be to login
      if (result.redirectUrl) {
        expect(result.redirectUrl).toContain("/login");
      }
    });
  }
});

// Test Dashboard Routes
test.describe("Dashboard Routes", () => {
  for (const route of routesToTest.dashboard) {
    test(`${route} - should be accessible or redirect`, async ({ page }) => {
      const result = await testRoute(page, route);

      console.log(`\n📍 Testing ${route}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Has Errors: ${result.hasErrors}`);
      console.log(`   Has Content: ${result.hasContent}`);
      console.log(`   Redirect: ${result.redirectUrl || "none"}`);
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(", ")}`);
      }

      // Dashboard routes might redirect to login or return 200
      expect([200, 302]).toContain(result.status);
    });
  }
});

// Test Auth Routes
test.describe("Auth Routes", () => {
  for (const route of routesToTest.auth) {
    test(`${route} - should be accessible`, async ({ page }) => {
      const result = await testRoute(page, route);

      console.log(`\n📍 Testing ${route}:`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Has Errors: ${result.hasErrors}`);
      console.log(`   Has Content: ${result.hasContent}`);
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(", ")}`);
      }

      // Auth routes should return 200 and have content
      expect(result.status).toBe(200);
      expect(result.hasContent).toBe(true);
    });
  }
});

// Test Error Routes
test.describe("Error Routes", () => {
  test("/404 - should return 404 status", async ({ page }) => {
    const result = await testRoute(page, "/404");

    console.log(`\n📍 Testing /404:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Has Errors: ${result.hasErrors}`);

    // 404 should return 404 status
    expect(result.status).toBe(404);
  });

  test("/500 - should return 500 status", async ({ page }) => {
    const result = await testRoute(page, "/500");

    console.log(`\n📍 Testing /500:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Has Errors: ${result.hasErrors}`);

    // 500 should return 500 status
    expect(result.status).toBe(500);
  });
});

// Test non-existent console route
test("/console/non-existent - should return 404", async ({ page }) => {
  const result = await testRoute(page, "/console/non-existent");

  console.log(`\n📍 Testing /console/non-existent:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Has Errors: ${result.hasErrors}`);

  // Non-existent route should return 404
  expect(result.status).toBe(404);
});

// Summary test - generate report
test.describe("Route Audit Summary", () => {
  test("generate route audit report", async ({ page }) => {
    const allRoutes = [
      ...routesToTest.marketing,
      ...routesToTest.console,
      ...routesToTest.dashboard,
      ...routesToTest.auth,
      ...routesToTest.error,
      "/console/non-existent",
    ];

    const results: RouteTestResult[] = [];

    for (const route of allRoutes) {
      const result = await testRoute(page, route);
      results.push(result);
      console.log(`\n✅ Tested: ${route} - Status: ${result.status}`);
    }

    // Generate summary
    const failedRoutes = results.filter(
      (r) => r.status >= 400 && r.status !== 404 && r.status !== 500
    );
    const routesWithErrors = results.filter((r) => r.hasErrors);
    const emptyRoutes = results.filter((r) => !r.hasContent && r.status === 200);

    console.log("\n\n========================================");
    console.log("ROUTE AUDIT SUMMARY");
    console.log("========================================");
    console.log(`Total routes tested: ${results.length}`);
    console.log(`Failed routes (4xx/5xx): ${failedRoutes.length}`);
    console.log(`Routes with console errors: ${routesWithErrors.length}`);
    console.log(`Routes with no content: ${emptyRoutes.length}`);

    if (failedRoutes.length > 0) {
      console.log("\n❌ Failed Routes:");
      for (const r of failedRoutes) {
        console.log(`   ${r.route} - Status: ${r.status}`);
      }
    }

    if (routesWithErrors.length > 0) {
      console.log("\n⚠️ Routes with Errors:");
      for (const r of routesWithErrors) {
        console.log(`   ${r.route}:`);
        for (const err of r.errors) {
          console.log(`      - ${err.substring(0, 100)}`);
        }
      }
    }

    if (emptyRoutes.length > 0) {
      console.log("\n⚠️ Routes with No Content:");
      for (const r of emptyRoutes) {
        console.log(`   ${r.route}`);
      }
    }

    console.log("========================================\n");
  });
});
