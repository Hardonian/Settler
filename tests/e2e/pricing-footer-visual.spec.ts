import { test, expect, type Page } from "@playwright/test";

async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        transition-duration: 0ms !important;
        caret-color: transparent !important;
      }
    `,
  });

  await page.waitForLoadState("networkidle");
}

test.describe("pricing and footer visual regression", () => {
  test("pricing hero stays visually stable", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "networkidle" });
    await stabilize(page);

    await expect(page.locator("section[aria-labelledby='pricing-heading']")).toHaveScreenshot(
      "pricing-hero.png",
      {
        maxDiffPixelRatio: 0.02,
      }
    );
  });

  test("global footer stays visually stable", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "networkidle" });
    await stabilize(page);

    await expect(page.locator("footer[role='contentinfo']")).toHaveScreenshot("marketing-footer.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
