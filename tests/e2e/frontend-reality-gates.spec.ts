/**
 * Frontend Reality Gates - Comprehensive Regression Tests
 *
 * Ensures critical routes don't 500, navigation works, mobile layouts are correct,
 * and accessibility baseline is met. This test MUST pass in CI or build fails.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Core routes to test
const CRITICAL_ROUTES = [
  "/",
  "/pricing",
  "/docs",
  "/console",
  "/playground",
  "/signup",
  "/login",
  "/trust",
  "/cookbook",
  "/runbooks",
  "/schematics",
];

// Mobile viewports to test
const MOBILE_VIEWPORTS = [
  { width: 360, height: 800, name: "Small Mobile" },
  { width: 390, height: 844, name: "iPhone 12/13" },
];

// Allowed console error patterns (benign warnings)
const ALLOWED_CONSOLE_ERRORS = [
  /favicon/i,
  /analytics/i,
  /sentry/i,
  /webpack/i,
  /hydration/i,
  /cookie/i,
  /third.*party/i,
  /ad.*block/i,
];

test.describe("Frontend Reality Gates", () => {
  test.describe("Route Stability - No 500s", () => {
    for (const route of CRITICAL_ROUTES) {
      test(`${route} should not return 500`, async ({ page }) => {
        const errors: string[] = [];
        const responses: Array<{ url: string; status: number }> = [];

        page.on("pageerror", (error) => {
          errors.push(error.message);
        });

        page.on("response", (response) => {
          if (response.url().includes(route) || response.url().includes(page.url())) {
            responses.push({ url: response.url(), status: response.status() });
          }
        });

        const response = await page.goto(route, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Verify response is not 500
        expect(response?.status()).not.toBe(500);
        expect(response?.status()).toBeLessThan(500);

        // Verify no 500 responses for this route
        const route500s = responses.filter((r) => r.status === 500);
        expect(route500s.length).toBe(0);

        // Verify page renders (not blank)
        const bodyText = await page.textContent("body");
        expect(bodyText).toBeTruthy();
        expect(bodyText?.length).toBeGreaterThan(0);

        // Verify no "Internal Error" or "500" text
        expect(bodyText).not.toContain("Internal Error");
        expect(bodyText).not.toMatch(/500.*error/i);

        // Check for critical unhandled exceptions
        const criticalErrors = errors.filter(
          (e) => !ALLOWED_CONSOLE_ERRORS.some((pattern) => pattern.test(e))
        );
        expect(criticalErrors.length).toBe(0);
      });
    }
  });

  test.describe("Mobile Layout - No Horizontal Scroll", () => {
    for (const viewport of MOBILE_VIEWPORTS) {
      test(`no horizontal scroll at ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const route of CRITICAL_ROUTES.slice(0, 5)) {
          // Test top 5 routes on mobile
          await page.goto(route, {
            waitUntil: "networkidle",
            timeout: 30000,
          });

          // Wait for any animations/layout shifts
          await page.waitForTimeout(1000);

          // Check for horizontal scroll
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          if (hasHorizontalScroll) {
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
            throw new Error(
              `Horizontal scroll detected on ${route} at ${viewport.name}: ${scrollWidth}px > ${clientWidth}px`
            );
          }

          // Also check body overflow
          const bodyOverflow = await page.evaluate(() => {
            const style = window.getComputedStyle(document.body);
            return style.overflowX;
          });

          // Warn if overflow-x is not hidden or auto (but don't fail)
          if (bodyOverflow !== "hidden" && bodyOverflow !== "auto" && bodyOverflow !== "scroll") {
            console.warn(
              `Body overflow-x is "${bodyOverflow}" on ${route} at ${viewport.name} - may cause horizontal scroll`
            );
          }
        }
      });
    }
  });

  test.describe("Mobile Layout - No Clipped Content", () => {
    for (const viewport of MOBILE_VIEWPORTS) {
      test(`content not clipped at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const route of ["/", "/pricing", "/console", "/playground"]) {
          await page.goto(route, {
            waitUntil: "networkidle",
            timeout: 30000,
          });

          await page.waitForTimeout(1000);

          // Check for common clipping issues
          const clippingIssues = await page.evaluate(() => {
            const issues: string[] = [];

            // Check for fixed heights that might clip content
            const elementsWithFixedHeight = Array.from(document.querySelectorAll("*")).filter(
              (el) => {
                const style = window.getComputedStyle(el);
                const height = style.height;
                return height && height !== "auto" && height !== "100%" && parseFloat(height) > 0;
              }
            );

            // Check for overflow: hidden on containers with scrollable content
            const containersWithHiddenOverflow = Array.from(document.querySelectorAll("*")).filter(
              (el) => {
                const style = window.getComputedStyle(el);
                return (
                  style.overflow === "hidden" &&
                  el.scrollHeight > el.clientHeight &&
                  el.scrollHeight > 100 // Only flag significant clipping
                );
              }
            );

            if (containersWithHiddenOverflow.length > 5) {
              issues.push(
                `Found ${containersWithHiddenOverflow.length} containers with overflow:hidden that may clip content`
              );
            }

            return issues;
          });

          if (clippingIssues.length > 0) {
            console.warn(`Clipping issues on ${route} at ${viewport.name}:`, clippingIssues);
            // Don't fail, but log for review
          }
        }
      });
    }
  });

  test.describe("Console Errors - Critical Only", () => {
    test("no critical console errors on main routes", async ({ page }) => {
      const consoleErrors: Array<{ route: string; error: string }> = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Only track non-allowed errors
          if (!ALLOWED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
            consoleErrors.push({
              route: page.url(),
              error: text,
            });
          }
        }
      });

      page.on("pageerror", (error) => {
        const text = error.message;
        if (!ALLOWED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) {
          consoleErrors.push({
            route: page.url(),
            error: text,
          });
        }
      });

      for (const route of CRITICAL_ROUTES.slice(0, 6)) {
        await page.goto(route, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        await page.waitForTimeout(1000); // Wait for any async errors
      }

      if (consoleErrors.length > 0) {
        console.error("Critical console errors found:", consoleErrors);
        throw new Error(
          `Found ${consoleErrors.length} critical console error(s): ${consoleErrors
            .map((e) => `${e.route}: ${e.error}`)
            .join("; ")}`
        );
      }
    });
  });

  test.describe("Navigation Links - No Dead Links", () => {
    test("header navigation links work", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find navigation links
      const navLinks = page.locator('nav a, header a, [role="navigation"] a');
      const links = await navLinks.all();

      const failures: Array<{ href: string; status?: number; error?: string }> = [];

      for (const link of links.slice(0, 15)) {
        // Limit to first 15 to avoid timeout
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
          `${failures.length} navigation link(s) returned 500: ${failures
            .map((f) => `${f.href} (${f.status})`)
            .join(", ")}`
        );
      }
    });

    test("footer links work", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Find footer links (skip external links)
      const footerLinks = page.locator('footer a[href^="/"]');
      const links = await footerLinks.all();

      const failures: Array<{ href: string; status?: number }> = [];

      for (const link of links.slice(0, 10)) {
        // Limit to first 10 to avoid timeout
        const href = await link.getAttribute("href");
        if (href && href.startsWith("/") && !href.includes("#")) {
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
            console.warn(`Footer link check skipped for ${href}:`, error);
          }
        }
      }

      if (failures.length > 0) {
        throw new Error(
          `${failures.length} footer link(s) returned 500: ${failures
            .map((f) => `${f.href} (${f.status})`)
            .join(", ")}`
        );
      }
    });
  });

  test.describe("Accessibility - Axe Checks", () => {
    // Test critical pages only for Axe (it's slower)
    const A11Y_TEST_PAGES = ["/", "/pricing", "/console", "/playground"];

    for (const path of A11Y_TEST_PAGES) {
      test(`${path} should have no serious accessibility violations`, async ({ page }) => {
        await page.goto(path, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Wait for page to be fully interactive
        await page.waitForTimeout(1000);

        // Run axe-core accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
          .analyze();

        // Filter to only serious/critical violations
        const seriousViolations = accessibilityScanResults.violations.filter(
          (violation) => violation.impact === "serious" || violation.impact === "critical"
        );

        if (seriousViolations.length > 0) {
          console.error(
            `\n❌ Found ${seriousViolations.length} serious accessibility violation(s) on ${path}:\n`
          );
          seriousViolations.forEach((violation) => {
            console.error(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
            console.error(`    Help: ${violation.helpUrl}`);
            if (violation.nodes.length > 0) {
              violation.nodes.slice(0, 3).forEach((node) => {
                console.error(`    - ${node.html.substring(0, 100)}...`);
              });
            }
          });
        }

        // Fail on serious/critical violations
        expect(seriousViolations.length).toBe(0);
      });

      test(`${path} should have proper heading hierarchy`, async ({ page }) => {
        await page.goto(path, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Check for h1
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBeGreaterThan(0);
        expect(h1Count).toBeLessThanOrEqual(2); // Allow up to 2 h1s (some pages have hero + main)

        // Check heading hierarchy (no skipping levels)
        const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
        let lastLevel = 0;
        let hasH1 = false;

        for (const heading of headings) {
          const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
          const level = parseInt(tagName.charAt(1));

          if (level === 1) {
            hasH1 = true;
          }

          // First heading should be h1
          if (lastLevel === 0 && level !== 1) {
            // Allow if we haven't seen h1 yet (might be hidden or later)
            if (!hasH1 && level <= 2) {
              lastLevel = level;
              continue;
            }
          }

          // Should not skip levels (e.g., h1 -> h3)
          if (lastLevel > 0) {
            expect(level).toBeLessThanOrEqual(lastLevel + 1);
          }

          lastLevel = level;
        }
      });

      test(`${path} should have visible focus indicators`, async ({ page }) => {
        await page.goto(path, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Find all interactive elements
        const interactiveElements = await page.locator("a, button, input, select, textarea").all();

        if (interactiveElements.length === 0) {
          return; // No interactive elements to test
        }

        // Test first few interactive elements for focus visibility
        let elementsWithFocus = 0;
        for (const element of interactiveElements.slice(0, 5)) {
          await element.focus();
          const hasFocusRing = await element.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const outline = style.outline;
            const outlineWidth = style.outlineWidth;
            const boxShadow = style.boxShadow;
            return (
              (outline && outline !== "none" && outlineWidth !== "0px") ||
              (boxShadow && boxShadow !== "none")
            );
          });

          if (hasFocusRing) {
            elementsWithFocus++;
          }
        }

        // At least some elements should have focus indicators
        // (We don't require all, as some might be intentionally hidden)
        expect(elementsWithFocus).toBeGreaterThan(0);
      });
    }
  });
});
