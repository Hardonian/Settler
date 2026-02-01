import { defineConfig, devices } from "@playwright/test";
import { loadEnvFiles } from "./scripts/load-env-for-tests";

// Load environment variables from .env files (same priority as Next.js)
loadEnvFiles();

/**
 * Playwright Configuration for Settler
 *
 * Includes:
 * - Standard E2E tests (chromium, firefox, webkit)
 * - Visual regression with 3 viewports (mobile, tablet, desktop)
 * - DOM Reality enforcement tests
 * - UI Consistency Audit
 */

// Base URL for tests
const BASE_URL =
  process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Workers: 1 in CI for stability, undefined (auto) locally
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all navigation
    baseURL: BASE_URL,

    // Collect trace on first retry
    trace: "on-first-retry",

    // Capture screenshots on failure
    screenshot: "only-on-failure",

    // Record video on failure
    video: "retain-on-failure",

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Shared context options
    locale: "en-US",
    timezoneId: "America/New_York",
  },

  // Configure projects for major browsers + visual regression
  projects: [
    // Standard E2E tests
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.audit\.spec\.ts/, /.*dom-reality.*/],
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.audit\.spec\.ts/, /.*dom-reality.*/],
    },

    // Visual Regression: Mobile viewport (light mode)
    {
      name: "visual-mobile-light",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["iPhone SE"],
        deviceScaleFactor: 2,
        colorScheme: "light",
        contextOptions: {
          reducedMotion: "reduce",
        },
      },
    },

    // Visual Regression: Mobile viewport (dark mode)
    {
      name: "visual-mobile-dark",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["iPhone SE"],
        deviceScaleFactor: 2,
        colorScheme: "dark",
        contextOptions: {
          reducedMotion: "reduce",
        },
      },
    },

    // Visual Regression: Tablet viewport
    {
      name: "visual-tablet",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["iPad Mini"],
        deviceScaleFactor: 2,
        colorScheme: "light",
        contextOptions: {
          reducedMotion: "reduce",
        },
      },
    },

    // Visual Regression: Desktop viewport (light mode)
    {
      name: "visual-desktop-light",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        colorScheme: "light",
        contextOptions: {
          reducedMotion: "reduce",
        },
      },
    },

    // Visual Regression: Desktop viewport (dark mode)
    {
      name: "visual-desktop-dark",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        colorScheme: "dark",
        contextOptions: {
          reducedMotion: "reduce",
        },
      },
    },

    // UI Consistency Audit - Full sweep
    {
      name: "ui-audit",
      testMatch: /.*\.audit\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    // DOM Reality Enforcement Tests
    {
      name: "dom-reality",
      testMatch: /.*dom-reality.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Local dev server configuration
  webServer: {
    command: "npm run dev --workspace=packages/web",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "development",
      // Ensure deterministic behavior for tests
      NEXT_PUBLIC_TEST_MODE: "1",
    },
  },

  // Expect configuration for visual regression
  expect: {
    // Timeout for expect assertions
    timeout: 10000,

    // Visual comparison options
    toHaveScreenshot: {
      // Maximum pixel difference ratio (0.2 = 20%)
      threshold: 0.2,
      // Maximum number of different pixels
      maxDiffPixels: 100,
      // Animations disabled in screenshots
      animations: "disabled",
      // Scale factor for retina displays ("css" maintains CSS pixel size)
      scale: "css",
    },

    // Snapshot comparison options
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.02,
    },
  },

  // Output directory for test results
  outputDir: "test-results/",

  // Snapshot directory configuration
  snapshotDir: "tests/e2e/__snapshots__",
});
