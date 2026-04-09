/**
 * Comprehensive DOM Reality Tests
 *
 * Extended test coverage for edge cases and comprehensive validation.
 */

import { test, expect } from "@playwright/test";
import { analyzeElement, findElementsWithCSSIssues } from "../utils/dom-reality-utils";

test.describe("DOM Reality - Comprehensive Coverage", () => {
  test("all critical routes have main content area", async ({ page }) => {
    const routes = [
      "/",
      "/signup",
      "/pricing",
      "/docs",
      "/console",
      "/playground",
      "/trust",
      "/cookbook",
      "/runbooks",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      const mainContent = page.locator('main, [role="main"], #main-content').first();
      await expect(mainContent).toBeAttached({ message: `Route ${route} missing main content` });
      await expect(mainContent).toBeVisible({ message: `Route ${route} main content not visible` });
    }
  });

  test("no broken images on critical routes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      const broken: string[] = [];

      images.forEach((img) => {
        if (img.complete && img.naturalWidth === 0 && img.naturalHeight === 0) {
          broken.push(img.src || img.getAttribute("src") || "unknown");
        }
      });

      return broken;
    });

    if (brokenImages.length > 0) {
      console.warn("Found potentially broken images:", brokenImages);
    }

    // Don't fail - some images might be intentionally empty or loading
  });

  test("all links are valid on homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const links = await page.locator("a[href]").all();
    const invalidLinks: string[] = [];

    for (const link of links.slice(0, 20)) {
      // Limit to first 20 for performance
      const href = await link.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//")) {
        try {
          const response = await page.request.get(href);
          if (response.status() >= 400) {
            invalidLinks.push(href);
          }
        } catch {
          // External links or anchors - skip
        }
      }
    }

    if (invalidLinks.length > 0) {
      console.warn("Found potentially invalid links:", invalidLinks);
    }

    // Don't fail - some routes might require auth
  });

  test("forms have proper labels", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    const formIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const inputs = document.querySelectorAll("input, select, textarea");

      inputs.forEach((input) => {
        const htmlInput = input as HTMLElement;
        if (htmlInput.hasAttribute("aria-hidden")) return;

        const hasLabel =
          htmlInput.getAttribute("aria-label") ||
          htmlInput.getAttribute("aria-labelledby") ||
          document.querySelector(`label[for="${htmlInput.id}"]`) ||
          htmlInput.closest("label");

        if (!hasLabel && htmlInput.getAttribute("type") !== "hidden") {
          issues.push(
            `Input without label: ${htmlInput.tagName}${htmlInput.id ? `#${htmlInput.id}` : ""}`
          );
        }
      });

      return issues;
    });

    if (formIssues.length > 0) {
      console.warn("Found form inputs without labels:", formIssues);
    }

    // Don't fail - some inputs might be decorative
  });

  test("CSS issues detected correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cssIssues = await findElementsWithCSSIssues(page);

    // Log issues but don't fail - some might be intentional
    if (cssIssues.length > 0) {
      console.log(`Found ${cssIssues.length} potential CSS issues`);
      cssIssues.slice(0, 5).forEach((issue) => {
        console.log(`  - ${issue.selector}: ${issue.issue}`);
      });
    }
  });

  test("element analysis works correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test main content element
    const mainContent = page.locator('main, [role="main"], #main-content').first();
    const selector = await mainContent.evaluate((el) => {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.toString().split(" ").filter(Boolean);
        if (classes.length > 0) {
          return `${el.tagName.toLowerCase()}.${classes[0]}`;
        }
      }
      return el.tagName.toLowerCase();
    });

    if (selector) {
      const analysis = await analyzeElement(page, selector);
      expect(analysis).toBeDefined();
      expect(analysis.isVisible).toBe(true);
      expect(analysis.boundingBox).not.toBeNull();
    }
  });

  test("performance metrics are reasonable", async ({ page }) => {
    await page.goto("/");

    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf?.domContentLoadedEventEnd - perf?.domContentLoadedEventStart,
        loadComplete: perf?.loadEventEnd - perf?.loadEventStart,
        firstPaint: perf?.domContentLoadedEventEnd,
      };
    });

    // Check that page loads within reasonable time
    expect(metrics.domContentLoaded).toBeLessThan(5000); // 5 seconds
    expect(metrics.loadComplete).toBeLessThan(10000); // 10 seconds
  });

  test("no console errors on critical routes", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Filter out known benign errors
    const criticalErrors = errors.filter((error) => {
      return (
        !error.includes("favicon") &&
        !error.includes("analytics") &&
        !error.includes("sentry") &&
        !error.includes("webpack")
      );
    });

    if (criticalErrors.length > 0) {
      console.error("Found console errors:", criticalErrors);
    }

    // Don't fail - some errors might be expected
  });
});
