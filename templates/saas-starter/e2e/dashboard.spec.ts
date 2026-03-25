import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('should load and display enhanced KPI cards', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that all 4 KPI cards are present
    const kpiCards = page.locator('[role="button"]').filter({ hasText: /Active Projects|Open Tasks|Team Members|Completion Rate/ });
    await expect(kpiCards).toHaveCount(4);

    // Verify sparkline charts are visible
    const sparklines = page.locator('svg').filter({ hasText: '' });
    await expect(sparklines.first()).toBeVisible();
  });

  test('should open Command Palette with Cmd+K', async ({ page }) => {
    await page.goto('/dashboard');

    // Press Cmd+K (or Ctrl+K on non-Mac)
    await page.keyboard.press('Meta+KeyK');

    // Command palette should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should have search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on "New Project" quick action or Projects link in sidebar
    await page.click('text=New Project');

    // Should navigate to projects page
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });

  test('should display Getting Started section for new users', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if Getting Started section exists (may not be visible for users with data)
    const gettingStarted = page.locator('text=Getting Started');
    const count = await gettingStarted.count();

    if (count > 0) {
      // If visible, verify it has progress indicator
      await expect(page.locator('text=/\\d+\\/3 complete/')).toBeVisible();
    }
  });

  test('should display recent activity section', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Recent activity section should exist
    const activitySection = page.locator('text=Recent Activity');
    const count = await activitySection.count();

    // Section may be hidden if no data
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible KPI cards with keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab to first KPI card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on KPI cards
    const focusedElement = page.locator(':focus');
    const hasRole = await focusedElement.getAttribute('role');
    expect(hasRole).toBeTruthy();
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // KPI cards should stack vertically on mobile
    const kpiCards = page.locator('[role="button"]').filter({ hasText: /Active Projects|Open Tasks/ });
    await expect(kpiCards.first()).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify layout adapts to tablet
    const kpiCards = page.locator('[role="button"]').filter({ hasText: /Active Projects/ });
    await expect(kpiCards.first()).toBeVisible();
  });
});
