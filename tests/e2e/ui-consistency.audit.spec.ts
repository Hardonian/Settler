/**
 * UI Consistency & Functional Integrity Audit
 *
 * Automated audit that:
 * - Iterates through all routes for each viewport
 * - Captures console errors/warnings
 * - Detects network failures
 * - Identifies hydration mismatches
 * - Measures layout shift
 * - Checks responsive behavior
 * - Validates reduced motion support
 */

import { test, expect, Page, TestInfo } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// All routes to audit
const AUDIT_ROUTES = [
  // Marketing
  "/",
  "/trust",
  "/why-settler",
  "/vision",
  "/security",
  "/about",
  "/community",
  "/changelog",
  "/comparison",
  "/benchmarks",
  "/support",
  "/support/contact",

  // Docs
  "/docs",
  "/docs/getting-started",
  "/docs/quickstart",
  "/docs/sdk",
  "/docs/api",
  "/docs/auth",
  "/docs/cli",

  // Product
  "/engine",
  "/edge-ai",
  "/builder",

  // Console (auth pages - check graceful handling)
  "/console",
  "/console/playground",
  "/console/billing",

  // Demo
  "/demo/reconciliation",

  // Auth
  "/signup",
  "/verify",

  // Status
  "/status",
];

// Viewports to test
const AUDIT_VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 720 },
];

interface AuditIssue {
  route: string;
  viewport: string;
  type:
    | "console-error"
    | "console-warn"
    | "network-error"
    | "hydration"
    | "layout-shift"
    | "responsive"
    | "accessibility";
  severity: "BLOCKER" | "HIGH" | "MED" | "LOW";
  message: string;
  details?: string;
}

const auditResults: AuditIssue[] = [];

/**
 * Collect console errors and warnings
 */
async function collectConsoleIssues(page: Page, route: string, viewport: string): Promise<void> {
  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();

    // Filter out known non-critical errors
    const isNoise =
      text.includes("favicon") ||
      text.includes("analytics") ||
      text.includes("vercel") ||
      text.includes("sentry") ||
      text.includes("hot reload") ||
      text.includes("[HMR]");

    if (isNoise) return;

    if (type === "error") {
      auditResults.push({
        route,
        viewport,
        type: "console-error",
        severity: text.includes("hydrat") || text.includes("Hydrat") ? "HIGH" : "MED",
        message: text.substring(0, 200),
      });
    } else if (type === "warning") {
      // Only capture React warnings and critical warnings
      if (text.includes("React") || text.includes("Invalid") || text.includes("deprecated")) {
        auditResults.push({
          route,
          viewport,
          type: "console-warn",
          severity: "LOW",
          message: text.substring(0, 200),
        });
      }
    }
  });
}

/**
 * Collect network errors
 */
async function collectNetworkIssues(page: Page, route: string, viewport: string): Promise<void> {
  page.on("requestfailed", (request) => {
    const url = request.url();
    const failure = request.failure()?.errorText || "Unknown error";

    // Only track same-origin or critical external requests
    try {
      const requestUrl = new URL(url);
      const baseUrl = new URL(BASE_URL);

      if (requestUrl.origin === baseUrl.origin) {
        auditResults.push({
          route,
          viewport,
          type: "network-error",
          severity: "HIGH",
          message: `Failed request: ${requestUrl.pathname}`,
          details: failure,
        });
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();

    // Track 4xx/5xx errors (excluding auth-required routes)
    if (status >= 400) {
      try {
        const requestUrl = new URL(url);
        const baseUrl = new URL(BASE_URL);

        if (requestUrl.origin === baseUrl.origin) {
          // Skip auth-required routes
          const isAuthRoute = ["/console", "/dashboard"].some((r) =>
            requestUrl.pathname.startsWith(r)
          );

          if (!isAuthRoute || (status !== 401 && status !== 403)) {
            auditResults.push({
              route,
              viewport,
              type: "network-error",
              severity: status >= 500 ? "BLOCKER" : "HIGH",
              message: `${status} error: ${requestUrl.pathname}`,
            });
          }
        }
      } catch {
        // Ignore
      }
    }
  });
}

/**
 * Check for hydration mismatches
 */
async function detectHydrationIssues(page: Page, route: string, viewport: string): Promise<void> {
  // Check for hydration warning text in the DOM
  const bodyText = await page.textContent("body");

  if (
    bodyText?.includes("Hydration failed") ||
    (bodyText?.includes("hydrat") && bodyText.includes("mismatch"))
  ) {
    auditResults.push({
      route,
      viewport,
      type: "hydration",
      severity: "HIGH",
      message: "Hydration mismatch detected in page content",
    });
  }

  // Check for react-root with data-reactroot (indicates SSR worked)
  const hasReactRoot = (await page.locator("#__next, #root, [data-reactroot]").count()) > 0;
  if (!hasReactRoot && route !== "/404") {
    auditResults.push({
      route,
      viewport,
      type: "hydration",
      severity: "MED",
      message: "No React root element found - possible hydration failure",
    });
  }
}

/**
 * Measure layout shift (CLS)
 */
async function measureLayoutShift(page: Page, route: string, viewport: string): Promise<number> {
  const cls = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let cumulativeScore = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          const ls = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!ls.hadRecentInput) {
            cumulativeScore += ls.value;
          }
        }
      });

      try {
        observer.observe({ type: "layout-shift", buffered: true });
      } catch {
        // Layout-shift observer not supported
      }

      setTimeout(() => {
        observer.disconnect();
        resolve(cumulativeScore);
      }, 3000);
    });
  });

  if (cls > 0.1) {
    auditResults.push({
      route,
      viewport,
      type: "layout-shift",
      severity: cls > 0.25 ? "HIGH" : "MED",
      message: `High CLS detected: ${cls.toFixed(3)}`,
      details: "Layout shifts cause poor UX. CLS should be < 0.1",
    });
  }

  return cls;
}

/**
 * Check responsive behavior
 */
async function checkResponsiveBehavior(
  page: Page,
  route: string,
  viewport: string,
  width: number
): Promise<void> {
  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (hasHorizontalScroll) {
    auditResults.push({
      route,
      viewport,
      type: "responsive",
      severity: "HIGH",
      message: "Horizontal scroll detected - content overflow",
    });
  }

  // Check for elements off-screen or with negative positioning
  const offScreenElements = await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    let count = 0;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth) {
        count++;
      }
    });
    return count;
  });

  if (offScreenElements > 5) {
    auditResults.push({
      route,
      viewport,
      type: "responsive",
      severity: "MED",
      message: `${offScreenElements} elements positioned off-screen`,
    });
  }

  // Check touch targets on mobile
  if (width <= 768) {
    const smallTouchTargets = await page.evaluate(() => {
      const clickable = document.querySelectorAll("button, a, input, [role='button']");
      let smallCount = 0;
      clickable.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          smallCount++;
        }
      });
      return smallCount;
    });

    if (smallTouchTargets > 10) {
      auditResults.push({
        route,
        viewport,
        type: "responsive",
        severity: "MED",
        message: `${smallTouchTargets} touch targets smaller than 44x44px`,
        details: "WCAG recommends minimum 44x44px touch targets",
      });
    }
  }
}

/**
 * Check reduced motion support
 */
async function checkReducedMotion(page: Page): Promise<boolean> {
  const supportsReducedMotion = await page.evaluate(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    return mediaQuery.matches;
  });

  // Check if animations respect reduced motion
  const hasUnstoppedAnimations = await page.evaluate(() => {
    const animated = document.querySelectorAll("[class*='animate-'], [class*='transition-']");
    let unstopped = 0;
    animated.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.animationDuration !== "0.01ms" && style.animationDuration !== "0s") {
        unstopped++;
      }
    });
    return unstopped;
  });

  if (supportsReducedMotion && hasUnstoppedAnimations > 5) {
    return false; // Not properly respecting reduced motion
  }

  return true;
}

test.describe("UI Consistency Audit", () => {
  test.afterAll(async () => {
    // Output audit summary
    console.log("\n" + "=".repeat(80));
    console.log("UI CONSISTENCY AUDIT RESULTS");
    console.log("=".repeat(80));

    if (auditResults.length === 0) {
      console.log("✅ No issues found!");
    } else {
      const bySeverity = {
        BLOCKER: auditResults.filter((i) => i.severity === "BLOCKER"),
        HIGH: auditResults.filter((i) => i.severity === "HIGH"),
        MED: auditResults.filter((i) => i.severity === "MED"),
        LOW: auditResults.filter((i) => i.severity === "LOW"),
      };

      console.log(`\nTotal Issues: ${auditResults.length}`);
      console.log(`  BLOCKER: ${bySeverity.BLOCKER.length}`);
      console.log(`  HIGH: ${bySeverity.HIGH.length}`);
      console.log(`  MED: ${bySeverity.MED.length}`);
      console.log(`  LOW: ${bySeverity.LOW.length}`);

      // Output issues by severity
      ["BLOCKER", "HIGH", "MED"].forEach((severity) => {
        const issues = bySeverity[severity as keyof typeof bySeverity];
        if (issues.length > 0) {
          console.log(`\n${severity} Issues:`);
          issues.forEach((issue) => {
            console.log(`  [${issue.type}] ${issue.route} (${issue.viewport})`);
            console.log(`    ${issue.message}`);
            if (issue.details) console.log(`    Details: ${issue.details}`);
          });
        }
      });
    }

    console.log("\n" + "=".repeat(80));
  });

  for (const route of AUDIT_ROUTES) {
    for (const viewport of AUDIT_VIEWPORTS) {
      test(`${route} - ${viewport.name} viewport`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Clear previous console/network listeners
        page.removeAllListeners("console");
        page.removeAllListeners("requestfailed");
        page.removeAllListeners("response");

        // Set up collection
        await collectConsoleIssues(page, route, viewport.name);
        await collectNetworkIssues(page, route, viewport.name);

        // Navigate
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Wait for page to settle
        await page.waitForTimeout(1000);

        // Run checks
        await detectHydrationIssues(page, route, viewport.name);
        await measureLayoutShift(page, route, viewport.name);
        await checkResponsiveBehavior(page, route, viewport.name, viewport.width);

        // Check page didn't 500
        const status = response?.status() ?? 0;
        if (status >= 500) {
          auditResults.push({
            route,
            viewport: viewport.name,
            type: "network-error",
            severity: "BLOCKER",
            message: `Server error ${status} on ${route}`,
          });
        }

        // Verify page has content
        const bodyText = await page.textContent("body");
        if (!bodyText || bodyText.length < 50) {
          auditResults.push({
            route,
            viewport: viewport.name,
            type: "hydration",
            severity: "HIGH",
            message: "Page content is empty or very short",
          });
        }
      });
    }
  }
});

test.describe("UI Consistency Audit - Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const respectsMotion = await checkReducedMotion(page);

    expect(respectsMotion).toBe(true);
  });

  test("animations disabled in reduced motion mode", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check computed styles for animations
    const animationDurations = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const durations: string[] = [];
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.animationName !== "none") {
          durations.push(style.animationDuration);
        }
      });
      return durations;
    });

    // All animations should be essentially instant (0.01ms or 0s)
    const hasLongAnimations = animationDurations.some(
      (d) => d !== "0.01ms" && d !== "0s" && parseFloat(d) > 0.1
    );

    expect(hasLongAnimations).toBe(false);
  });
});

test.describe("UI Consistency Audit - Theme Consistency", () => {
  for (const viewport of AUDIT_VIEWPORTS) {
    test(`theme switching - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Test light mode
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(`${BASE_URL}/`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const lightModeBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Test dark mode
      await page.emulateMedia({ colorScheme: "dark" });
      await page.reload({ waitUntil: "networkidle" });

      const darkModeBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Background colors should be different
      expect(lightModeBg).not.toBe(darkModeBg);
    });
  }
});

test.describe("UI Consistency Audit - Navigation Flows", () => {
  test("navigation menu works across viewports", async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/`);

    // Look for mobile menu button
    const menuButton = page
      .locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
      .first();
    const hasMobileMenu = await menuButton.isVisible().catch(() => false);

    if (hasMobileMenu) {
      await menuButton.click();
      await page.waitForTimeout(300);

      // Menu should be visible after click
      const nav = page.locator("nav, [role='navigation']").first();
      await expect(nav).toBeVisible();
    }

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/`);

    // Navigation should be visible without clicking
    const desktopNav = page.locator("nav, [role='navigation']").first();
    await expect(desktopNav).toBeVisible();
  });

  test("footer links are accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();

    // Check footer links
    const footerLinks = footer.locator("a");
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);

    // All footer links should be visible and clickable
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = footerLinks.nth(i);
      await expect(link).toBeVisible();
    }
  });
});

test.describe("UI Consistency Audit - Form Consistency", () => {
  test("signup form is accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    // Form should exist
    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    // Inputs should have labels
    const inputs = form.locator("input");
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");
      const id = await input.getAttribute("id");

      // Should have some form of label
      const hasLabel = ariaLabel || ariaLabelledBy || placeholder;

      if (!hasLabel) {
        // Check for associated label element
        const label = form.locator(`label[for="${id}"]`);
        const hasLabelElement = (await label.count()) > 0;

        if (!hasLabelElement) {
          auditResults.push({
            route: "/signup",
            viewport: "desktop",
            type: "accessibility",
            severity: "MED",
            message: `Input without label found in signup form`,
          });
        }
      }
    }
  });
});
