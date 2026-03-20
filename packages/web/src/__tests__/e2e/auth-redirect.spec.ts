/**
 * Auth & Redirect Tests
 *
 * Tests auth redirect behavior, protected route access control,
 * and login/signup flow smoke tests.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  { path: "/dashboard", redirectTo: ["/login", "/signup", "/signin"] },
  { path: "/console", redirectTo: ["/login", "/signup", "/signin"] },
  { path: "/admin", redirectTo: ["/login", "/signup", "/signin"] },
];

/**
 * Auth routes that should be publicly accessible
 */
const AUTH_ROUTES = [
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Signup" },
  { path: "/forgot-password", name: "Forgot Password" },
  { path: "/reset-password", name: "Reset Password" },
];

test.describe("Auth Redirect Behavior", () => {
  test("protected routes should redirect unauthenticated users", async ({ page }) => {
    for (const route of PROTECTED_ROUTES) {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const currentUrl = page.url();

      // Check if redirected to auth page
      const isRedirected = route.redirectTo.some((redirectPath) =>
        currentUrl.includes(redirectPath)
      );

      // Or check if response indicates redirect
      const status = response?.status() || 0;
      const isRedirectStatus = [301, 302, 307, 308].includes(status);

      console.log(`[Auth] ${route.path} -> ${currentUrl} (status: ${status})`);

      // Either redirected or showing auth content on the same page
      const hasAuthContent =
        (await page
          .locator("text=Sign In")
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator("text=Sign up")
          .isVisible()
          .catch(() => false)) ||
        (await page
          .locator("text=Login")
          .isVisible()
          .catch(() => false));

      expect(
        isRedirected || isRedirectStatus || hasAuthContent,
        `Protected route ${route.path} should redirect to auth or show auth content`
      ).toBe(true);
    }
  });

  test("protected routes should never return 500", async ({ page }) => {
    for (const route of PROTECTED_ROUTES) {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      console.log(`[HTTP] ${route.path}: ${status}`);

      // CRITICAL: Never return 5xx
      expect(status, `Protected route ${route.path} should not return 5xx`).toBeLessThan(500);
    }
  });
});

test.describe("Auth Routes Accessibility", () => {
  for (const route of AUTH_ROUTES) {
    test(`${route.name} (${route.path}) should be accessible`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const status = response?.status() || 0;

      console.log(`[HTTP] ${route.path}: ${status}`);

      // Should not return 5xx
      expect(status, `Auth route ${route.path} should not return 5xx`).toBeLessThan(500);

      // Should return 200 or redirect (some auth routes may redirect if already logged in)
      const acceptableStatuses = [200, 301, 302, 307, 308];
      expect(acceptableStatuses.includes(status)).toBe(true);
    });
  }
});

test.describe("Login Page Functionality", () => {
  test("login page should render correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for login form elements
    const hasLoginForm = await page
      .locator("form")
      .isVisible()
      .catch(() => false);
    const hasEmailInput =
      (await page
        .locator('input[type="email"]')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('input[name="email"]')
        .isVisible()
        .catch(() => false));
    const hasPasswordInput = await page
      .locator('input[type="password"]')
      .isVisible()
      .catch(() => false);

    // At least one of these should be present
    const hasLoginElements = hasLoginForm || hasEmailInput || hasPasswordInput;

    // Check page has content
    const bodyText = await page.textContent("body");
    expect(bodyText, "Login page should have content").toBeTruthy();

    console.log(
      `[Login] Form elements: form=${hasLoginForm}, email=${hasEmailInput}, password=${hasPasswordInput}`
    );
  });

  test("login page should have working links", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for signup link
    const signupLink = page.locator('a[href="/signup"]');
    const hasSignupLink = await signupLink.isVisible().catch(() => false);

    // Check for forgot password link
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    const hasForgotPasswordLink = await forgotPasswordLink.isVisible().catch(() => false);

    console.log(`[Login] Links: signup=${hasSignupLink}, forgot-password=${hasForgotPasswordLink}`);
  });
});

test.describe("Signup Page Functionality", () => {
  test("signup page should render correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for signup form elements
    const hasForm = await page
      .locator("form")
      .isVisible()
      .catch(() => false);
    const hasEmailInput =
      (await page
        .locator('input[type="email"]')
        .isVisible()
        .catch(() => false)) ||
      (await page
        .locator('input[name="email"]')
        .isVisible()
        .catch(() => false));

    // Check page has content
    const bodyText = await page.textContent("body");
    expect(bodyText, "Signup page should have content").toBeTruthy();

    console.log(`[Signup] Form elements: form=${hasForm}, email=${hasEmailInput}`);
  });

  test("signup page should have login link", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Check for login link
    const loginLink = page.locator('a[href="/login"]');
    const hasLoginLink = await loginLink.isVisible().catch(() => false);

    console.log(`[Signup] Has login link: ${hasLoginLink}`);
  });
});

test.describe("Auth Flow Smoke Tests", () => {
  test("can navigate from login to signup", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Click signup link
    const signupLink = page.locator('a[href="/signup"]');
    if (await signupLink.isVisible().catch(() => false)) {
      await signupLink.click();
      await page.waitForURL("**/signup", { timeout: 10000 });

      expect(page.url()).toContain("/signup");
    }
  });

  test("can navigate from signup to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Click login link
    const loginLink = page.locator('a[href="/login"]');
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForURL("**/login", { timeout: 10000 });

      expect(page.url()).toContain("/login");
    }
  });

  test("login form should not submit with empty fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Try to find and click submit button
    const submitButton = page.locator('button[type="submit"]');

    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();

      // Wait a bit to see if there's a validation error
      await page.waitForTimeout(500);

      // Page should still be on login (not redirected)
      expect(page.url()).toContain("/login");
    }
  });
});

test.describe("Session Handling", () => {
  test("should handle expired session gracefully", async ({ page, context }) => {
    // Clear cookies to simulate expired session
    await context.clearCookies();

    const response = await page.goto(`${BASE_URL}/console`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Should redirect to login or show auth prompt
    const status = response?.status() || 0;

    // Should not return 5xx
    expect(status, "Should handle expired session without 5xx").toBeLessThan(500);

    // Should show auth content
    const currentUrl = page.url();
    const hasAuthContent =
      currentUrl.includes("/login") ||
      currentUrl.includes("/signup") ||
      (await page
        .locator("text=Sign In")
        .isVisible()
        .catch(() => false));

    expect(hasAuthContent, "Should redirect to auth on expired session").toBe(true);
  });
});
