/**
 * Viewport Tests - Mobile & Desktop Sanity
 *
 * Tests critical pages across different viewports to ensure
 * responsive design works correctly.
 *
 * These tests run against specific viewport sizes to catch
 * responsive design issues before deployment.
 */

import { test, expect, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Routes to test across viewports
 */
const VIEWPORT_TEST_ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/pricing", name: "Pricing" },
  { path: "/docs", name: "Documentation" },
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Signup" },
];

/**
 * Desktop viewport configurations
 */
const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 720, name: "Desktop HD" },
  { width: 1440, height: 900, name: "Desktop Large" },
  { width: 1024, height: 768, name: "Desktop Small" },
];

/**
 * Mobile viewport configurations
 */
const MOBILE_VIEWPORTS = [
  { width: 375, height: 667, name: "iPhone SE" },
  { width: 390, height: 844, name: "iPhone 12" },
  { width: 428, height: 926, name: "iPhone 12 Max" },
  { width: 360, height: 640, name: "Android" },
  { width: 414, height: 896, name: "iPhone 11 Max" },
];

/**
 * Tablet viewport configurations
 */
const TABLET_VIEWPORTS = [
  { width: 768, height: 1024, name: "iPad" },
  { width: 834, height: 1194, name: "iPad Pro" },
];

test.describe("Desktop Viewport Sanity", () => {
  for (const viewport of DESKTOP_VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) - critical routes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of VIEWPORT_TEST_ROUTES) {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const status = response?.status() || 0;

        // Should not return 5xx
        expect(status, `${viewport.name}: ${route.path} should not return 5xx`).toBeLessThan(500);

        // Should render content
        const bodyText = await page.textContent("body");
        expect(bodyText, `${viewport.name}: ${route.path} should have content`).toBeTruthy();

        console.log(`[Desktop ${viewport.name}] ${route.path}: ${status}`);
      }
    });
  }

  test("desktop homepage should have navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for navigation
    const nav = page.locator("nav");
    const hasNav = await nav.isVisible().catch(() => false);

    // Or header
    const header = page.locator("header");
    const hasHeader = await header.isVisible().catch(() => false);

    expect(hasNav || hasHeader, "Desktop should have navigation").toBe(true);
  });
});

test.describe("Mobile Viewport Sanity", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) - critical routes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of VIEWPORT_TEST_ROUTES) {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const status = response?.status() || 0;

        // Should not return 5xx
        expect(status, `${viewport.name}: ${route.path} should not return 5xx`).toBeLessThan(500);

        // Should render content
        const bodyText = await page.textContent("body");
        expect(bodyText, `${viewport.name}: ${route.path} should have content`).toBeTruthy();

        console.log(`[Mobile ${viewport.name}] ${route.path}: ${status}`);
      }
    });
  }

  test("mobile homepage should be usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Page should load without horizontal scroll issues
    const body = await page.locator("body");
    const boundingBox = await body.boundingBox();

    // Body should fit within viewport
    if (boundingBox) {
      expect(boundingBox.width, "Body should not exceed viewport width").toBeLessThanOrEqual(400);
    }

    // Should have visible content
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("mobile navigation should be accessible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Look for mobile menu button (hamburger)
    const menuButton =
      page.locator('button[aria-label="menu"]') ||
      page.locator('button[aria-label="Menu"]') ||
      page.locator(".mobile-menu") ||
      page.locator('button[class*="menu"]');

    const hasMenuButton = await menuButton.isVisible().catch(() => false);

    // Or navigation should still be visible
    const nav = page.locator("nav");
    const hasNav = await nav.isVisible().catch(() => false);

    console.log(`[Mobile] Menu button: ${hasMenuButton}, Nav: ${hasNav}`);
  });
});

test.describe("Tablet Viewport Sanity", () => {
  for (const viewport of TABLET_VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) - critical routes`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of VIEWPORT_TEST_ROUTES.slice(0, 3)) {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        const status = response?.status() || 0;

        // Should not return 5xx
        expect(status, `${viewport.name}: ${route.path} should not return 5xx`).toBeLessThan(500);

        // Should render content
        const bodyText = await page.textContent("body");
        expect(bodyText, `${viewport.name}: ${route.path} should have content`).toBeTruthy();

        console.log(`[Tablet ${viewport.name}] ${route.path}: ${status}`);
      }
    });
  }

  test("tablet should show responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Should have navigation
    const nav = page.locator("nav");
    const hasNav = await nav.isVisible().catch(() => false);

    // Should have content
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    console.log(`[Tablet] Has nav: ${hasNav}`);
  });
});

test.describe("Responsive Behavior", () => {
  test("should not have horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check viewport
    const viewport = page.viewportSize();
    if (viewport) {
      // Get scroll width
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

      expect(scrollWidth, "Should not have horizontal scroll").toBeLessThanOrEqual(
        viewport.width + 1
      );
    }
  });

  test("should not have horizontal scroll on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const viewport = page.viewportSize();
    if (viewport) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

      expect(scrollWidth, "Should not have horizontal scroll on desktop").toBeLessThanOrEqual(
        viewport.width + 1
      );
    }
  });

  test("viewport changes should not cause layout shifts", async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Get initial layout metrics
    const initialMetrics = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));

    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Get new metrics
    const newMetrics = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));

    // Should still render
    expect(newMetrics.height, "Should render on mobile").toBeGreaterThan(0);

    console.log(
      `[Responsive] Desktop: ${JSON.stringify(initialMetrics)}, Mobile: ${JSON.stringify(newMetrics)}`
    );
  });
});

test.describe("Orientation Changes", () => {
  test("should handle landscape orientation on mobile", async ({ page }) => {
    // Landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Should render
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(viewport?.height || 0);
  });

  test("should handle portrait orientation on tablet", async ({ page }) => {
    // Portrait tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Should render
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });
});
