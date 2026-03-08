import { test, expect } from "@playwright/test";

test.describe("Landing page reality pass", () => {
  test("hero renders exactly once, CTA works, theme toggles, no duplicate sections, no console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/");

    // Hero heading appears exactly once
    await expect(
      page.getByRole("heading", {
        name: "Reconcile Financial Data. Find Every Mismatch. Prove the Results.",
      })
    ).toHaveCount(1);

    // Theme toggle button is present
    await expect(page.getByRole("button", { name: "Toggle dark mode" })).toBeVisible();

    // GitHub CTA in hero points to github.com
    const heroGithub = page.locator('section[aria-labelledby="hero-heading"]').getByRole("link", {
      name: "View on GitHub",
    });
    await expect(heroGithub).toHaveAttribute("href", /github\.com/);

    // Theme toggle: light → dark → light
    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // FAQ section appears exactly once
    await expect(page.getByRole("heading", { name: "Common Questions" })).toHaveCount(1);

    // No console errors
    expect(consoleErrors).toEqual([]);
  });

  test("no duplicate hero, FAQ, or footer structures", async ({ page }) => {
    await page.goto("/");

    // Hero exists exactly once
    const heroSections = page.locator('[aria-labelledby="hero-heading"]');
    await expect(heroSections).toHaveCount(1);

    // FAQ section exists exactly once
    const faqSections = page.locator('[aria-label="Common questions"]');
    await expect(faqSections).toHaveCount(1);

    // Footer exists exactly once
    const footers = page.locator("footer");
    await expect(footers).toHaveCount(1);

    // Navigation exists exactly once
    const navs = page.locator('nav[aria-label="Main navigation"]');
    await expect(navs).toHaveCount(1);
  });

  test("nav links exist and point to real routes", async ({ page }) => {
    await page.goto("/");

    // Primary nav links
    await expect(page.getByRole("link", { name: "Platform" }).first()).toHaveAttribute(
      "href",
      "/platform"
    );
    await expect(page.getByRole("link", { name: "Pricing" }).first()).toHaveAttribute(
      "href",
      "/pricing"
    );
    await expect(page.getByRole("link", { name: "Security" }).first()).toHaveAttribute(
      "href",
      "/security"
    );
    await expect(page.getByRole("link", { name: "Docs" }).first()).toHaveAttribute("href", "/docs");
  });

  test("Quickstart CTA leads to /docs/quickstart", async ({ page }) => {
    await page.goto("/");
    const quickstartLinks = page.getByRole("link", { name: /Read Quickstart/i });
    await expect(quickstartLinks.first()).toHaveAttribute("href", "/docs/quickstart");
  });

  test("footer GitHub link points to correct repo", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const githubLink = footer.getByRole("link", { name: /GitHub/i });
    await expect(githubLink.first()).toHaveAttribute("href", /github\.com\/Hardonian\/Settler/);
  });

  test("FAQ accordions are accessible and expand", async ({ page }) => {
    await page.goto("/");

    // First FAQ item
    const firstQuestion = page.getByRole("button", { name: /What is Settler\?/i });
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.click();

    // Content should be visible after clicking
    await expect(page.getByText(/open-source reconciliation engine/i).first()).toBeVisible();
  });

  test("page loads with 200 status and no hard 500s", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("platform page loads", async ({ page }) => {
    const response = await page.goto("/platform");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("pricing page loads", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("security page loads (via redirect)", async ({ page }) => {
    const response = await page.goto("/security");
    expect(response?.status()).toBeLessThan(400);
  });

  test("security-and-audit page loads as full marketing page", async ({ page }) => {
    const response = await page.goto("/security-and-audit");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1[id="security-heading"]')).toBeVisible();
    // Should have navigation and footer (not a mobile app stub)
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("theme persists via cookie across navigation", async ({ page }) => {
    await page.goto("/");

    // Toggle to dark
    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate away and back
    await page.goto("/platform");
    await page.goto("/");

    // Should still be dark (cookie persists)
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reset to light
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
  });

  test("docs quickstart page loads", async ({ page }) => {
    const response = await page.goto("/docs/quickstart");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
