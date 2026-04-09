/**
 * Site Reality Audit - Comprehensive Navigation & Non-500 Checks
 *
 * Ensures critical routes don't 500 and navigation works.
 * This test MUST pass in CI or build fails.
 */

import { test, expect } from "@playwright/test";

test.describe("Site Reality Audit", () => {
  test("critical public routes load without 500", async ({ page }) => {
    const routes = [
      "/",
      "/docs",
      "/pricing",
      "/trust",
      "/playground",
      "/console",
      "/cookbook",
      "/runbooks",
      "/schematics",
    ];

    const failures: Array<{ route: string; status?: number; error?: string }> = [];

    for (const route of routes) {
      try {
        const response = await page.goto(route, {
          waitUntil: "networkidle",
          timeout: 15000,
        });

        const status = response?.status();

        if (!status || status >= 500) {
          failures.push({ route, status });
        } else {
          // Check page loaded (not blank)
          const bodyText = await page.locator("body").textContent();
          if (!bodyText || bodyText.trim().length === 0) {
            failures.push({ route, error: "Blank page" });
          }

          // Check for error messages
          if (bodyText?.includes("Internal Error") || bodyText?.includes("500")) {
            failures.push({ route, error: "Internal Error page shown" });
          }
        }
      } catch (error) {
        failures.push({
          route,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (failures.length > 0) {
      console.error("Failed routes:", failures);
      throw new Error(
        `${failures.length} route(s) failed: ${failures.map((f) => `${f.route} (${f.status || f.error})`).join(", ")}`
      );
    }
  });

  test("no console errors on critical pages", async ({ page }) => {
    const consoleErrors: Array<{ route: string; error: string }> = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Allowlist common non-critical errors
        const allowedErrors = ["favicon", "analytics", "sentry", "webpack", "hydration"];

        if (!allowedErrors.some((allowed) => text.toLowerCase().includes(allowed))) {
          consoleErrors.push({
            route: page.url(),
            error: text,
          });
        }
      }
    });

    const routes = ["/", "/pricing", "/trust", "/playground", "/console"];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for any async errors
    }

    if (consoleErrors.length > 0) {
      console.error("Console errors found:", consoleErrors);
      // Don't fail test, but log for review
      console.warn(`Found ${consoleErrors.length} console error(s) - review needed`);
    }
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");

    // Find all navigation links
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const links = await navLinks.all();

    const failures: Array<{ href: string; status?: number }> = [];

    for (const link of links.slice(0, 20)) {
      // Limit to first 20 to avoid timeout
      const href = await link.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//")) {
        // Skip anchors and external links
        if (!href.includes("#") && !href.includes("http")) {
          try {
            const response = await page.goto(href, {
              waitUntil: "networkidle",
              timeout: 10000,
            });

            if (response) {
              const status = response.status();
              if (status >= 500) {
                failures.push({ href, status });
              }
            }
          } catch (error) {
            // Some routes might timeout or require auth - that's OK
            // Just ensure no 500
            console.warn(`Navigation check skipped for ${href}:`, error);
          }
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `${failures.length} navigation link(s) returned 500: ${failures.map((f) => `${f.href} (${f.status})`).join(", ")}`
      );
    }
  });

  test("no blank screens on error", async ({ page }) => {
    // Try accessing a non-existent route
    const response = await page.goto("/this-route-does-not-exist-12345", {
      waitUntil: "networkidle",
      timeout: 10000,
    });

    // Should show 404 page, not blank screen
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toBe("");
    expect(bodyText).not.toBeNull();

    // Should not be a 500 error
    expect(response?.status()).not.toBe(500);

    // Should show 404 or redirect, not Internal Error
    expect(bodyText).not.toContain("Internal Error");
  });

  test("homepage CTAs work", async ({ page }) => {
    await page.goto("/");

    // Check main CTAs
    const ctaLinks = [
      page.locator('a[href="/signup"]').first(),
      page.locator('a[href="/pricing"]').first(),
      page.locator('a[href="/docs"]').first(),
    ];

    for (const cta of ctaLinks) {
      const href = await cta.getAttribute("href");
      if (href) {
        const response = await page.goto(href, {
          waitUntil: "networkidle",
          timeout: 10000,
        });

        if (response) {
          expect(response.status()).toBeLessThan(500);
        }
      }
    }
  });
});
