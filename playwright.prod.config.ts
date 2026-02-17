import { defineConfig, devices } from "@playwright/test";
import { loadEnvFiles } from "./scripts/load-env-for-tests";

loadEnvFiles();

const BASE_URL = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
    locale: "en-US",
    timezoneId: "America/New_York",
  },
  projects: [
    {
      name: "chromium-prod",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @settler/web start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_TEST_MODE: "1",
    },
  },
});
