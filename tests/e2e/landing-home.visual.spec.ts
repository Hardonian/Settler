import { expect, test } from "@playwright/test";

function allowProject(projectName: string): boolean {
  return projectName === "visual-desktop-light" || projectName === "visual-mobile-light";
}

test.describe("Landing page visual baselines", () => {
  test("/ baseline", async ({ page }, testInfo) => {
    test.skip(!allowProject(testInfo.project.name), "Only desktop/mobile light visual projects.");

    const response = await page.goto("/", {
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

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Deterministic reconciliation. Verifiable audit evidence.",
      })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("main#main-content")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () =>
        Array.from(document.images)
          .filter((image) => image.getClientRects().length > 0)
          .every((image) => image.complete && image.naturalWidth > 0),
      undefined,
      { timeout: 15_000 }
    );
    await page.waitForTimeout(300);

    const viewportTag = testInfo.project.name.includes("mobile") ? "mobile" : "desktop";
    await expect(page).toHaveScreenshot(`landing-home-${viewportTag}.png`, {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 10000,
    });
  });
});
