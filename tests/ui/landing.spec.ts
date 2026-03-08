import { test, expect } from "@playwright/test";

test.describe("Landing page reality pass", () => {
  test("hero renders once, CTA works, theme toggles, and no duplicate FAQs or console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Reconcile Financial Data. Find Every Mismatch. Prove the Results.",
      })
    ).toHaveCount(1);

    await expect(page.getByRole("button", { name: "Toggle dark mode" })).toBeVisible();

    const heroGithub = page.locator('section[aria-labelledby="hero-heading"]').getByRole("link", {
      name: "View on GitHub",
    });
    await expect(heroGithub).toHaveAttribute("href", /github\.com/);
    await heroGithub.click();

    await page.goBack();

    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await expect(page.getByRole("heading", { name: "Common Questions" })).toHaveCount(1);

    expect(consoleErrors).toEqual([]);
  });
});
