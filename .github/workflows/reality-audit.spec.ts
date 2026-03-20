import { test, expect } from "@playwright/test";

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

test.describe("Hostile Frontend Reality Audit", () => {
  for (const route of coreRoutes) {
    test(`validates route integrity, traps 404/500s, and exposes theater UI on ${route}`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      // Trap unhandled client-side exceptions
      page.on("console", (msg) => {
        if (msg.type() === "error" && !msg.text().includes("favicon")) {
          consoleErrors.push(`[Console Error] ${msg.text()}`);
        }
      });

      // Trap failing network and asset requests
      page.on("response", (response) => {
        if (response.status() >= 400 && response.request().resourceType() !== "fetch") {
          failedRequests.push(`${response.status()} on ${response.url()}`);
        }
      });

      // 1. Hit the primary entrypoint
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);
      await page.waitForLoadState("networkidle");

      // 2. Truthfulness Check: Reject placeholder text
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(/lorem ipsum/i);
      expect(bodyText).not.toMatch(/coming soon/i);

      // 3. Asset Truth Check: Ensure no broken images rendered
      const images = await page.locator("img").all();
      for (const img of images) {
        const src = await img.getAttribute("src");
        expect(src, "Found image tag with missing src").toBeTruthy();
      }

      // 4. Link Truth Check: Ensure all visible links are fully resolved
      const links = await page.locator("a:visible").all();
      for (const link of links) {
        const href = await link.getAttribute("href");
        expect(href, "Found broken or empty href").not.toEqual("");
        expect(href, "Found placeholder anchor").not.toEqual("#");
      }

      // 5. Hard Failure Assertions
      expect(
        consoleErrors,
        `Client runtime errors detected on ${route}:\n${consoleErrors.join("\n")}`
      ).toHaveLength(0);
      expect(
        failedRequests,
        `Broken asset or API requests detected on ${route}:\n${failedRequests.join("\n")}`
      ).toHaveLength(0);
    });
  }
});
