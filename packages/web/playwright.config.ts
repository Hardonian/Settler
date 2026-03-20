import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Settler E2E Tests - CI Deployment Gates
 *
 * This configuration provides comprehensive CI deployment gates:
 * - Fast execution with focused test projects
 * - Mobile and desktop viewport testing
 * - Detailed failure reporting
 * - CI-optimized timeouts and retries
 */
export default defineConfig({
  testDir: "./src/__tests__/e2e",
  fullyParallel: !process.env.CI, // Parallel locally, sequential in CI for stability
  forbidOnly: !!process.env.CI, // Fail CI if test.only is left
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined, // Single worker in CI for stability

  // Reporter configuration
  reporter: process.env.CI
    ? [["list"], ["json", { outputFile: "test-results/web-e2e-results.json" }]]
    : "html",

  // Test timeout configuration
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Locale
    locale: "en-US",
    timezoneId: "America/New_York",
  },

  // Test projects - optimized for CI deployment gates
  projects: [
    // Primary CI gate - Chromium (fastest, most compatible)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /.*\.spec\.ts/,
    },

    // Mobile sanity check
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
      },
      testMatch: /.*viewport\.spec\.ts/,
    },

    // Desktop viewport tests
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /.*viewport\.spec\.ts/,
    },
  ],

  // Web server configuration
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: process.env.CI ? "pipe" : "ignore",
    stderr: process.env.CI ? "pipe" : "ignore",
  },

  // Output configuration
  outputDir: "test-results/",
});
