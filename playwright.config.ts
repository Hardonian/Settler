import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual-regression",
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // Consistent viewport for visual tests
        viewport: { width: 1280, height: 720 },
        // Disable animations for consistent screenshots
        reducedMotion: "reduce",
      },
    },
  ],
  webServer: {
    command: "npm run dev --workspace=packages/web",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  // Visual regression configuration
  expect: {
    // Threshold for pixel differences in visual comparisons
    toHaveScreenshot: {
      threshold: 0.2, // 20% pixel difference allowed
      maxDiffPixels: 100, // Max number of different pixels
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 100,
    },
  },
});
