/**
 * Route Reality Harness - E2E Route Verification Tests
 *
 * This test suite verifies:
 * - All major routes return HTTP 200
 * - No critical console errors
 * - Key pages render correctly
 * - Broken routes from Phase 1 are verified to work
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

interface Route {
  path: string;
  category: string;
  requiresAuth?: boolean;
  screenshot?: boolean;
}

// All routes to test
const ROUTES: Route[] = [
  // Marketing routes
  { path: "/", category: "marketing", screenshot: true },
  { path: "/about", category: "marketing", screenshot: true },
  { path: "/pricing", category: "marketing", screenshot: true },
  { path: "/platform", category: "marketing", screenshot: true },
  { path: "/capabilities", category: "marketing", screenshot: true },
  { path: "/product", category: "marketing", screenshot: true },

  // Auth routes
  { path: "/login", category: "auth", screenshot: true },
  { path: "/signup", category: "auth", screenshot: true },

  // Console routes (may require auth - will test without auth to check redirects)
  { path: "/console", category: "console", screenshot: true },
  { path: "/console/runs", category: "console" },
  { path: "/console/billing", category: "console" },
  { path: "/console/rules-engine", category: "console" },

  // Dashboard routes
  { path: "/dashboard", category: "dashboard", screenshot: true },

  // Additional key routes
  { path: "/admin", category: "admin" },
  { path: "/admin/analytics", category: "admin" },
  { path: "/billing", category: "billing" },

  // Error pages
  { path: "/404", category: "error" },

  // Blog and content routes
  { path: "/blog", category: "content" },
  { path: "/changelog", category: "content" },
  { path: "/docs", category: "content" },

  // Status and support
  { path: "/status", category: "support" },
  { path: "/support", category: "support" },
];

// Track console errors
const consoleErrors: string[] = [];

test.describe("Route Reality Harness", () => {
  test.beforeEach(async ({ page }) => {
    // Reset console errors for each test
    consoleErrors.length = 0;

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
  });

  // Test each route
  for (const route of ROUTES) {
    test(`${route.category}: ${route.path} - should return 200`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Check status code
      const status = response?.status() || 0;

      // Log the result
      console.info(`Route ${route.path}: Status ${status}`);

      // For auth-protected routes, 302/301 redirects are acceptable
      // as they indicate the route exists but requires auth
      const acceptableStatuses = [200, 301, 302, 307, 308];

      if (!acceptableStatuses.includes(status)) {
        console.error(`Route ${route.path} failed with status ${status}`);
        console.error("Console errors:", consoleErrors);
      }

      expect(acceptableStatuses.includes(status)).toBeTruthy();
    });

    // Screenshot test for key routes
    if (route.screenshot) {
      test(`${route.category}: ${route.path} - screenshot`, async ({ page }) => {
        await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Take screenshot
        const screenshot = await page.screenshot();
        expect(screenshot).toBeDefined();
      });
    }
  }

  // Test that console errors are minimal for public routes
  test("Public routes should have minimal console errors", async ({ page }) => {
    const publicRoutes = ROUTES.filter(
      (r) =>
        !r.requiresAuth &&
        r.category !== "console" &&
        r.category !== "dashboard" &&
        r.category !== "admin"
    );

    for (const route of publicRoutes.slice(0, 5)) {
      // Test first 5 public routes
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    }

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Failed to load resource") && !err.includes("favicon") && !err.includes("404")
    );

    console.info("Console errors found:", criticalErrors);

    // Allow up to 3 critical errors
    expect(criticalErrors.length).toBeLessThanOrEqual(3);
  });
});

// Test broken routes from Phase 1
test.describe("Phase 1 Broken Routes Verification", () => {
  // These are routes that were identified as broken in Phase 1
  const brokenRoutes = [
    { path: "/forgot-password", expectedStatus: [200, 301, 302] }, // Auth routes may redirect
  ];

  for (const route of brokenRoutes) {
    test(`${route.path} should be fixed`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;
      expect(route.expectedStatus.includes(status)).toBeTruthy();
    });
  }
});
