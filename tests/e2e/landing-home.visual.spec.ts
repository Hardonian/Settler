import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function allowProject(projectName: string): boolean {
  return projectName === "visual-desktop-light" || projectName === "visual-mobile-light";
}

test.describe("Landing page visual baselines", () => {
  test("/ baseline", async ({ page }, testInfo) => {
    test.skip(!allowProject(testInfo.project.name), "Only desktop/mobile light visual projects.");

    const response = await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    expect(response?.status()).toBeLessThan(400);

    await page.addStyleTag({
      content: `
        *,*::before,*::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        .animate-pulse,.animate-ping,.animate-shimmer { animation: none !important; }
      `,
    });

    await expect(page.getByText("Bit-Perfect Reproducibility at Institutional Scale")).toBeVisible({
      timeout: 30000,
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0)
    );
    await page.waitForTimeout(300);

    const viewportTag = testInfo.project.name.includes("mobile") ? "mobile" : "desktop";
    await expect(page).toHaveScreenshot(`landing-home-${viewportTag}.png`, {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 150,
    });
  });
});
