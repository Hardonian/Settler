/**
 * Comprehensive Visual Regression Tests
 *
 * Tests critical routes across multiple viewports and themes.
 * All screenshots use deterministic settings (no animations, frozen time, consistent fonts).
 */

import { test, expect, Page, TestInfo } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Routes to test with their expected auth requirements
const VISUAL_TEST_ROUTES = [
  // Public marketing pages
  { path: "/", name: "homepage", auth: false },
  { path: "/trust", name: "trust", auth: false },
  { path: "/why-settler", name: "why-settler", auth: false },
  { path: "/vision", name: "vision", auth: false },
  { path: "/security", name: "security", auth: false },
  { path: "/docs", name: "docs", auth: false },
  { path: "/docs/getting-started", name: "docs-getting-started", auth: false },
  { path: "/docs/quickstart", name: "docs-quickstart", auth: false },
  { path: "/support", name: "support", auth: false },
  { path: "/signup", name: "signup", auth: false },
  { path: "/status", name: "status", auth: false },
  { path: "/about", name: "about", auth: false },
  { path: "/community", name: "community", auth: false },
  { path: "/changelog", name: "changelog", auth: false },
  { path: "/comparison", name: "comparison", auth: false },
  { path: "/benchmarks", name: "benchmarks", auth: false },

  // Console pages (auth required - may redirect)
  { path: "/console", name: "console", auth: true },
  { path: "/console/playground", name: "console-playground", auth: true },
  { path: "/console/billing", name: "console-billing", auth: true },

  // Demo pages
  { path: "/demo/reconciliation", name: "demo-reconciliation", auth: false },

  // Feature pages
  { path: "/engine", name: "engine", auth: false },
  { path: "/edge-ai", name: "edge-ai", auth: false },
  { path: "/builder", name: "builder", auth: false },
];

/**
 * Stabilize page for visual testing
 * - Disable CSS animations
 * - Freeze time
 * - Hide dynamic elements
 * - Wait for fonts to load
 */
async function stabilizePage(page: Page): Promise<void> {
  // Inject CSS to disable animations and hide dynamic elements
  await page.addStyleTag({
    content: `
      /* Disable all animations and transitions */
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0ms !important;
        animation-delay: 0ms !important;
      }
      
      /* Hide dynamic/time-based elements */
      [data-testid="timestamp"],
      [data-testid="dynamic-content"],
      .animate-shimmer,
      .animate-shine,
      .animate-pulse,
      time,
      .live-indicator,
      .typing-indicator {
        visibility: hidden !important;
      }
      
      /* Mask random avatars */
      [data-testid="user-avatar"],
      img[alt*="avatar"],
      .avatar-random {
        filter: blur(5px) !important;
      }
      
      /* Ensure consistent font rendering */
      body {
        font-feature-settings: normal !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
    `,
  });

  // Freeze time in page context
  await page.evaluate(() => {
    // Store original Date
    const OriginalDate = window.Date;
    const frozenTime = new OriginalDate("2024-01-15T12:00:00Z");

    // Override Date constructor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Date = class extends OriginalDate {
      constructor(...args: (string | number | Date)[]) {
        if (args.length === 0) {
          super(frozenTime);
        } else {
          super(...(args as [string | number | Date]));
        }
      }

      static now(): number {
        return frozenTime.getTime();
      }
    };

    // Override other time-related functions
    const frozenTimestamp = frozenTime.getTime();
    performance.now = () => frozenTimestamp;

    // Intercept and freeze any existing intervals/timeouts
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;

    // Replace with no-op versions for visual tests
    window.setInterval = (...args: Parameters<typeof originalSetInterval>) => {
      // Return fake interval ID that does nothing
      return originalSetTimeout(() => {}, 0) as unknown as number;
    };

    // Allow some timeouts but cap them
    window.setTimeout = (handler: TimerHandler, timeout?: number, ...restArgs: unknown[]) => {
      const cappedTimeout = timeout && timeout > 100 ? 100 : timeout;
      return originalSetTimeout(handler, cappedTimeout, ...restArgs);
    };
  });

  // Wait for fonts to be ready
  await page.evaluate(() => document.fonts.ready);

  // Wait for images to load
  await page.waitForLoadState("networkidle");

  // Additional wait for any lazy-loaded content
  await page.waitForTimeout(500);
}

/**
 * Wait for page to be visually stable
 */
async function waitForVisualStability(page: Page): Promise<void> {
  // Wait for all images to complete loading
  await page.waitForFunction(() => {
    const images = document.querySelectorAll("img");
    return Array.from(images).every((img) => img.complete);
  });

  // Wait for layout to settle
  await page.waitForTimeout(300);
}

/**
 * Get viewport name from test info
 */
function getViewportName(testInfo: TestInfo): string {
  const projectName = testInfo.project.name;
  if (projectName.includes("mobile")) return "mobile";
  if (projectName.includes("tablet")) return "tablet";
  if (projectName.includes("desktop-dark")) return "desktop-dark";
  if (projectName.includes("desktop")) return "desktop";
  return "unknown";
}

/**
 * Check if a page redirected (auth gate, etc.)
 */
async function checkForRedirect(page: Page, originalPath: string): Promise<boolean> {
  const currentUrl = new URL(page.url());
  return currentUrl.pathname !== originalPath;
}

test.describe("Visual Regression - Public Pages", () => {
  // Filter to only public pages
  const publicRoutes = VISUAL_TEST_ROUTES.filter((r) => !r.auth);

  for (const route of publicRoutes) {
    test(`${route.name} - initial load`, async ({ page }, testInfo) => {
      // Navigate to page
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Accept 200-399 status codes (redirects OK)
      expect(response?.status()).toBeLessThan(400);

      // Stabilize the page for screenshot
      await stabilizePage(page);
      await waitForVisualStability(page);

      // Take screenshot with viewport-specific name
      const viewportName = getViewportName(testInfo);
      const screenshotName = `${route.name}-${viewportName}.png`;

      await expect(page).toHaveScreenshot(screenshotName, {
        fullPage: true,
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });

    test(`${route.name} - scrolled state`, async ({ page }, testInfo) => {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await stabilizePage(page);

      // Scroll down 30% of page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight * 0.3);
      });

      await waitForVisualStability(page);

      const viewportName = getViewportName(testInfo);
      const screenshotName = `${route.name}-scrolled-${viewportName}.png`;

      // Screenshot viewport only (not full page) for scrolled state
      await expect(page).toHaveScreenshot(screenshotName, {
        fullPage: false,
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });
  }
});

test.describe("Visual Regression - Console Pages (Auth Required)", () => {
  const consoleRoutes = VISUAL_TEST_ROUTES.filter((r) => r.auth);

  for (const route of consoleRoutes) {
    test(`${route.name} - handles auth gracefully`, async ({ page }, testInfo) => {
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await stabilizePage(page);
      await waitForVisualStability(page);

      // Check if redirected to signup/login
      const wasRedirected = await checkForRedirect(page, route.path);

      const viewportName = getViewportName(testInfo);
      const screenshotName = wasRedirected
        ? `${route.name}-redirected-${viewportName}.png`
        : `${route.name}-${viewportName}.png`;

      await expect(page).toHaveScreenshot(screenshotName, {
        fullPage: true,
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    });
  }
});

test.describe("Visual Regression - Error States", () => {
  test("404 page", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/non-existent-page-12345`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await stabilizePage(page);
    await waitForVisualStability(page);

    const viewportName = getViewportName(testInfo);
    await expect(page).toHaveScreenshot(`error-404-${viewportName}.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("error boundary - simulated", async ({ page }, testInfo) => {
    // Navigate to a page and inject an error boundary test
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await stabilizePage(page);

    // Simulate error state by hiding main content
    await page.addStyleTag({
      content: `
        main { display: none !important; }
        .error-boundary-fallback { 
          display: flex !important; 
          padding: 2rem;
          text-align: center;
        }
      `,
    });

    const viewportName = getViewportName(testInfo);
    await expect(page).toHaveScreenshot(`error-boundary-${viewportName}.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - Component States", () => {
  test("docs page with code blocks", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/docs/quickstart`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await stabilizePage(page);
    await waitForVisualStability(page);

    // Scroll to any code blocks
    const codeBlock = page.locator("pre, code").first();
    if (await codeBlock.isVisible().catch(() => false)) {
      await codeBlock.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }

    const viewportName = getViewportName(testInfo);
    await expect(page).toHaveScreenshot(`docs-code-blocks-${viewportName}.png`, {
      fullPage: false, // Viewport only to focus on code
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("navigation expanded state", async ({ page }, testInfo) => {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await stabilizePage(page);

    // Try to expand mobile navigation if on mobile viewport
    const menuButton = page
      .locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
      .first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }

    const viewportName = getViewportName(testInfo);
    await expect(page).toHaveScreenshot(`navigation-expanded-${viewportName}.png`, {
      fullPage: false,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - CLS Stability", () => {
  test("homepage layout shift score", async ({ page }) => {
    // Track layout shifts using PerformanceObserver
    const clsPromise = page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEntry[]) {
            const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
            if (!layoutShift.hadRecentInput) {
              cls += layoutShift.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });

        // Resolve after 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 3000);
      });
    });

    await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const cls = await clsPromise;

    // CLS should be less than 0.1 for good UX
    expect(cls).toBeLessThan(0.1);
  });
});
