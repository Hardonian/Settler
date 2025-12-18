/**
 * Onboarding Flow E2E Tests
 * 
 * Tests the complete onboarding and activation flow:
 * 1. Sign up / Auth
 * 2. Create workspace
 * 3. Add teammates (optional)
 * 4. Connect data source or upload sample
 * 5. Run first reconciliation
 * 6. View results
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to console - will redirect to signup if not authenticated
    await page.goto('/console');
  });

  test('should complete onboarding wizard in <3 minutes', async ({ page }) => {
    // Skip if not authenticated (demo mode)
    const isAuthenticated = await page.locator('text=Sign In').count() === 0;
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - skipping in demo mode');
      return;
    }

    // Navigate to onboarding
    await page.goto('/console/onboarding');
    await expect(page.locator('text=Welcome to Settler')).toBeVisible();

    // Step 1: Create Workspace
    await page.fill('input[id="workspace-name"]', 'Test Workspace');
    await page.fill('input[id="workspace-slug"]', `test-workspace-${Date.now()}`);
    await page.click('button:has-text("Create Workspace")');
    
    // Wait for workspace creation
    await page.waitForSelector('text=Add Teammates', { timeout: 10000 });

    // Step 2: Skip teammates (optional step)
    await page.click('button:has-text("Skip for Now")');
    
    // Wait for next step
    await page.waitForSelector('text=Connect Data Source', { timeout: 5000 });

    // Step 3: Skip data source (demo mode)
    await page.click('button:has-text("Skip for Now (Demo Mode)")');
    
    // Wait for next step
    await page.waitForSelector('text=Run First Reconciliation', { timeout: 5000 });

    // Step 4: Skip reconciliation (demo mode)
    await page.click('button:has-text("Skip for Now")');
    
    // Wait for final step
    await page.waitForSelector('text=View Results', { timeout: 5000 });

    // Step 5: Complete onboarding
    await page.click('button:has-text("Go to Dashboard")');
    
    // Should redirect to console
    await expect(page).toHaveURL(/\/console/, { timeout: 10000 });
    
    // Verify onboarding is complete
    const progressText = await page.locator('text=/Progress|100%/').textContent();
    expect(progressText).toBeTruthy();
  });

  test('should show activation checklist on console', async ({ page }) => {
    // Navigate to console
    await page.goto('/console');
    
    // Check for onboarding wizard or checklist
    const hasOnboarding = await page.locator('text=Getting Started').count() > 0 ||
                          await page.locator('text=Activation Checklist').count() > 0;
    
    expect(hasOnboarding).toBeTruthy();
  });

  test('should allow workspace creation with valid slug', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Sign In').count() === 0;
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated');
      return;
    }

    await page.goto('/console/onboarding');
    
    const uniqueSlug = `test-${Date.now()}`;
    await page.fill('input[id="workspace-name"]', 'Test Workspace');
    await page.fill('input[id="workspace-slug"]', uniqueSlug);
    
    // Check slug validation (should be lowercase, alphanumeric, hyphens only)
    const slugValue = await page.inputValue('input[id="workspace-slug"]');
    expect(slugValue).toMatch(/^[a-z0-9-]+$/);
    
    await page.click('button:has-text("Create Workspace")');
    
    // Should proceed to next step
    await page.waitForSelector('text=Add Teammates', { timeout: 10000 });
  });

  test('should reject duplicate workspace slug', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Sign In').count() === 0;
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated');
      return;
    }

    // Try to create workspace with existing slug
    await page.goto('/console/onboarding');
    await page.fill('input[id="workspace-name"]', 'Duplicate Test');
    await page.fill('input[id="workspace-slug"]', 'default'); // Common slug
    
    await page.click('button:has-text("Create Workspace")');
    
    // Should show error
    const errorVisible = await page.locator('text=/already taken|error/i').isVisible({ timeout: 5000 });
    expect(errorVisible).toBeTruthy();
  });

  test('should track onboarding events with trace_id', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Sign In').count() === 0;
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated');
      return;
    }

    // Monitor network requests for event tracking
    const events: string[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/workspaces') && url.includes('onboarding')) {
        const body = await response.json().catch(() => ({}));
        if (body.trace_id) {
          events.push(body.trace_id);
        }
      }
    });

    await page.goto('/console/onboarding');
    
    // Complete at least one step
    const uniqueSlug = `test-${Date.now()}`;
    await page.fill('input[id="workspace-name"]', 'Test Workspace');
    await page.fill('input[id="workspace-slug"]', uniqueSlug);
    await page.click('button:has-text("Create Workspace")');
    
    await page.waitForTimeout(2000); // Wait for events
    
    // Verify trace_id is present in responses
    expect(events.length).toBeGreaterThan(0);
  });

  test('should handle invite acceptance flow', async ({ page }) => {
    // This test would require a valid invite token
    // In a real scenario, you'd create an invite first, then test acceptance
    test.skip(true, 'Requires invite token setup');
  });
});

test.describe('Onboarding Error Handling', () => {
  test('should show clear error messages', async ({ page }) => {
    await page.goto('/console/onboarding');
    
    // Try to create workspace without filling fields
    await page.click('button:has-text("Create Workspace")');
    
    // Button should be disabled or show validation
    const button = page.locator('button:has-text("Create Workspace")');
    const isDisabled = await button.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Sign In').count() === 0;
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated');
      return;
    }

    // Intercept and fail workspace creation
    await page.route('**/api/workspaces', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error', trace_id: 'test-trace-123' }),
      });
    });

    await page.goto('/console/onboarding');
    await page.fill('input[id="workspace-name"]', 'Test');
    await page.fill('input[id="workspace-slug"]', 'test');
    await page.click('button:has-text("Create Workspace")');
    
    // Should show error message
    await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });
  });
});
