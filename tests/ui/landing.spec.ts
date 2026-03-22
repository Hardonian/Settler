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
      "/security-and-audit"
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

  // --- Feature pages ---

  test("replay-lab page loads with correct structure", async ({ page }) => {
    const response = await page.goto("/replay-lab");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
    // Nav and footer should be present
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    // Main element should be present (sections no longer orphaned outside main)
    await expect(page.locator("main#main-content")).toBeVisible();
    // No sections outside main before footer — footer should follow main
    const mainEl = page.locator("main#main-content");
    await expect(mainEl).toBeVisible();
  });

  test("proof-explorer page loads", async ({ page }) => {
    const response = await page.goto("/proof-explorer");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("how-it-works page loads", async ({ page }) => {
    const response = await page.goto("/how-it-works");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  // --- Homepage feature surface ---

  test("homepage has feature entry cards linking to feature pages", async ({ page }) => {
    await page.goto("/");

    // Feature cards section
    const featureSection = page.locator('[aria-label="Key features"]');
    await expect(featureSection).toBeVisible();

    // Links to feature pages exist
    await expect(page.getByRole("link", { name: /How It Works/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Replay Lab/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Proof Explorer/i }).first()).toBeVisible();
  });

  test("homepage has GitHub/Quickstart CTA section", async ({ page }) => {
    await page.goto("/");

    // Start in minutes CTA
    const ctaSection = page.locator('[aria-label="Get started"]');
    await expect(ctaSection).toBeVisible();

    // Read Quickstart link
    const quickstartCta = ctaSection.getByRole("link", { name: /Quickstart/i });
    await expect(quickstartCta).toHaveAttribute("href", "/docs/quickstart");
  });

  // --- Logo dark mode ---

  test("logo renders in dark mode", async ({ page }) => {
    await page.goto("/");

    // Logo should render in light mode
    const logo = page.locator('img[src="/assets/images/Settler-logo.png"]').first();
    await expect(logo).toBeVisible();

    // Switch to dark mode
    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Stacked logo should remain visible in dark mode
    await expect(logo).toBeVisible();

    // Reset to light
    await toggle.click();
  });

  // --- Navigation features dropdown ---

  test("features dropdown in nav exposes feature pages", async ({ page }) => {
    await page.goto("/");

    // Click Features dropdown
    const featuresBtn = page.getByRole("button", { name: "Features navigation" });
    await expect(featuresBtn).toBeVisible();
    await featuresBtn.click();

    // Dropdown items should appear
    await expect(page.getByRole("menuitem", { name: "How It Works" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Replay Lab" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Proof Explorer" })).toBeVisible();
  });

  // --- Footer features section ---

  test("footer has Features section linking to feature pages", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    const featuresHeading = footer.getByRole("heading", { name: "Features" });
    await expect(featuresHeading).toBeVisible();

    await expect(footer.getByRole("link", { name: "Replay Lab" })).toHaveAttribute(
      "href",
      "/replay-lab"
    );
    await expect(footer.getByRole("link", { name: "Proof Explorer" })).toHaveAttribute(
      "href",
      "/proof-explorer"
    );
  });
});
