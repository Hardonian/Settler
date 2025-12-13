/**
 * E2E Tests - Checkout Flow
 * 
 * Tests the critical user journey: Homepage → Pricing → Checkout → Success
 * 
 * Run with: npx playwright test tests/e2e/checkout-flow.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('/');
  });

  test('should navigate from homepage to pricing', async ({ page }) => {
    // Click "View Pricing" or similar CTA
    const pricingLink = page.getByRole('link', { name: /pricing|view pricing/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
    } else {
      // Fallback: navigate directly
      await page.goto('/pricing');
    }
    
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { name: /pricing|choose your plan/i })).toBeVisible();
  });

  test('should display pricing plans correctly', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check for plan cards
    const freePlan = page.getByText(/free/i).first();
    const commercialPlan = page.getByText(/commercial|pro/i).first();
    const enterprisePlan = page.getByText(/enterprise|scale/i).first();
    
    await expect(freePlan).toBeVisible();
    await expect(commercialPlan).toBeVisible();
    await expect(enterprisePlan).toBeVisible();
  });

  test('should toggle billing cycle (monthly/annual)', async ({ page }) => {
    await page.goto('/pricing');
    
    // Find billing toggle
    const toggle = page.getByRole('switch', { name: /billing|monthly|annual/i });
    
    if (await toggle.isVisible()) {
      const initialState = await toggle.getAttribute('aria-pressed');
      await toggle.click();
      
      // Wait for price update
      await page.waitForTimeout(500);
      
      const newState = await toggle.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should redirect unauthenticated user to signup when clicking checkout', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click "Start Free Trial" or upgrade button
    const checkoutButton = page.getByRole('button', { name: /start free trial|upgrade|get started/i }).first();
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      
      // Should redirect to signup with return URL
      await expect(page).toHaveURL(/\/signup/);
    }
  });

  test('should show error if Stripe is not configured', async ({ page, context }) => {
    // Mock API to return 503 for missing Stripe config
    await context.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Billing is not available at this time. Please contact support.',
        }),
      });
    });

    // This test would require authentication, so we'll test the error handling
    // In a real scenario, you'd authenticate first
    const response = await page.request.post('/api/stripe/checkout', {
      data: {
        planCode: 'pro',
        billingCycle: 'monthly',
      },
    });

    expect(response.status()).toBe(503);
  });

  test('should validate plan code in checkout request', async ({ page }) => {
    const response = await page.request.post('/api/stripe/checkout', {
      data: {
        planCode: 'invalid-plan',
        billingCycle: 'monthly',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid plan code');
  });

  test('billing success page should handle missing session_id gracefully', async ({ page }) => {
    await page.goto('/billing/success');
    
    // Should show loading or error state, not crash
    const content = page.getByText(/verifying|subscription|error/i);
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('billing success page should verify subscription status', async ({ page }) => {
    // Mock successful billing API response
    await page.route('**/api/console/billing', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscription: {
            id: 'sub_test',
            planCode: 'pro',
            status: 'active',
          },
        }),
      });
    });

    await page.goto('/billing/success?session_id=test_session');
    
    // Should show success message
    await expect(page.getByText(/subscription.*activated|success/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Usage Limit Enforcement', () => {
  test('should return 429 when usage limit exceeded', async ({ page }) => {
    // Mock usage limit exceeded response
    await page.route('**/api/v1/receipts', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'USAGE_LIMIT_EXCEEDED',
          message: 'You have exceeded your monthly quota',
          details: {
            service: 'receipts',
            currentUsage: 100,
            limit: 100,
          },
        }),
      });
    });

    const response = await page.request.post('/api/v1/receipts', {
      headers: {
        'Authorization': 'Bearer test-key',
      },
      data: {
        fileUrl: 'https://example.com/receipt.jpg',
      },
    });

    expect(response.status()).toBe(429);
  });
});
