/**
 * End-to-End Reliability Tests
 * Tests critical user paths for reliability
 */

import { test, expect } from "@playwright/test";

test.describe("E2E Reliability Tests", () => {
  test("User signup and activation flow", async ({ page }) => {
    // Signup
    await page.goto("/signup");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Complete activation
    await page.click("text=Connect Integration");
    await page.selectOption('select[name="integration"]', "stripe");
    await page.fill('input[name="api_key"]', "test_key");
    await page.click('button:has-text("Connect")');

    // Verify activation complete
    await expect(page.locator("text=Activation Complete")).toBeVisible();
  });

  test("Reconciliation job creation and execution", async ({ page }) => {
    // Login (assume user exists)
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Create job
    await page.goto("/playground");
    await page.click('button:has-text("New Job")');
    await page.fill('input[name="name"]', "Test Job");
    await page.selectOption('select[name="source"]', "shopify");
    await page.selectOption('select[name="target"]', "stripe");
    await page.click('button:has-text("Create")');

    // Run job
    await page.click('button:has-text("Run")');

    // Verify job completes
    await expect(page.locator("text=Job Completed")).toBeVisible({ timeout: 30000 });
  });

  test("Payment processing and subscription", async ({ page }) => {
    // Navigate to pricing
    await page.goto("/pricing");
    await page.click('button:has-text("Upgrade to Commercial")');

    // Fill payment form
    await page.fill('input[name="cardNumber"]', "4242424242424242");
    await page.fill('input[name="expiry"]', "12/25");
    await page.fill('input[name="cvc"]', "123");
    await page.click('button[type="submit"]');

    // Verify subscription active
    await expect(page.locator("text=Subscription Active")).toBeVisible();
  });

  test("Integration connection and sync", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Connect integration
    await page.goto("/dashboard/integrations");
    await page.click('button:has-text("Connect Stripe")');
    await page.fill('input[name="api_key"]', "sk_test_...");
    await page.click('button:has-text("Connect")');

    // Verify connection
    await expect(page.locator("text=Connected")).toBeVisible();

    // Trigger sync
    await page.click('button:has-text("Sync Now")');

    // Verify sync completes
    await expect(page.locator("text=Sync Complete")).toBeVisible({ timeout: 30000 });
  });
});
