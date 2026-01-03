/**
 * Admin Dashboard Smoke Tests
 * 
 * Tests key admin dashboard routes and SSE endpoint behavior.
 * Ensures basic functionality works without errors.
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests assume admin authentication is set up
    // In real implementation, you'd need to authenticate first
    // For now, we'll test that routes exist and don't crash
  });

  test('admin overview page loads without errors', async ({ page }) => {
    // Navigate to admin overview
    await page.goto('/admin');
    
    // Check for key elements
    await expect(page.locator('h1')).toContainText(/Admin Dashboard|Overview/i);
    
    // Check for connection status indicator
    const connectionStatus = page.locator('[class*="connection"], [class*="status"]').first();
    await expect(connectionStatus).toBeVisible({ timeout: 5000 });
    
    // Check for KPI tiles
    const kpiTiles = page.locator('[class*="card"], [class*="tile"]');
    await expect(kpiTiles.first()).toBeVisible({ timeout: 5000 });
  });

  test('admin ops console loads without errors', async ({ page }) => {
    await page.goto('/admin/ops');
    
    // Check for split-pane layout
    await expect(page.locator('h2, [class*="exception"], [class*="queue"]').first()).toBeVisible({ timeout: 5000 });
    
    // Check for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('admin exceptions page loads without errors', async ({ page }) => {
    await page.goto('/admin/exceptions');
    
    await expect(page.locator('h1')).toContainText(/Exceptions/i);
    
    // Check for filters
    const filters = page.locator('select, [class*="filter"]');
    await expect(filters.first()).toBeVisible();
  });

  test('admin runs page loads without errors', async ({ page }) => {
    await page.goto('/admin/runs');
    
    await expect(page.locator('h1')).toContainText(/Runs/i);
    
    // Check for run list or empty state
    const content = page.locator('[class*="card"], [class*="empty"], [class*="loading"]');
    await expect(content.first()).toBeVisible({ timeout: 5000 });
  });

  test('admin audit page loads without errors', async ({ page }) => {
    await page.goto('/admin/audit');
    
    await expect(page.locator('h1')).toContainText(/Audit/i);
  });

  test('admin settings page loads without errors', async ({ page }) => {
    await page.goto('/admin/settings');
    
    await expect(page.locator('h1')).toContainText(/Settings/i);
    
    // Check for feature flags
    const featureFlags = page.locator('[class*="flag"], [class*="feature"]');
    await expect(featureFlags.first()).toBeVisible({ timeout: 5000 });
  });

  test('SSE stream endpoint responds correctly', async ({ request }) => {
    // Test SSE endpoint (will fail auth but should return proper error)
    const response = await request.get('/api/admin/stream', {
      headers: {
        'Accept': 'text/event-stream',
      },
    });
    
    // Should either be 403 (forbidden) or 200 (if authenticated)
    expect([200, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      // If authenticated, check for SSE headers
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('admin metrics API endpoint structure', async ({ request }) => {
    const response = await request.get('/api/admin/metrics?range=24h');
    
    // Should be 403 (forbidden) without auth, or 200 with auth
    expect([200, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      // Check response structure
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('range');
      expect(data).toHaveProperty('kpis');
    }
  });

  test('admin exceptions API endpoint structure', async ({ request }) => {
    const response = await request.get('/api/admin/exceptions?limit=10');
    
    expect([200, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
    }
  });

  test('admin runs API endpoint structure', async ({ request }) => {
    const response = await request.get('/api/admin/runs?limit=10');
    
    expect([200, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
    }
  });

  test('admin audit API endpoint structure', async ({ request }) => {
    const response = await request.get('/api/admin/audit?limit=10');
    
    expect([200, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total');
    }
  });
});
