import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Baseline Verification", () => {
  const coreRoutes = [
    "/",
    "/signup",
    "/console",
    "/playground",
    "/pricing",
    "/docs",
    "/trust",
    "/cookbook",
    "/runbooks",
  ];

  for (const route of coreRoutes) {
    test(`Validates WCAG compliance on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const scanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // If violations are found, fail the test and surface exact DOM nodes
      expect(scanResults.violations).toEqual([]);
    });
  }
});
