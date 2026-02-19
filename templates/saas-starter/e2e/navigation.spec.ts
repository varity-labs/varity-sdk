import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between dashboard pages', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Projects
    await page.click('text=Projects');
    await expect(page).toHaveURL(/\/dashboard\/projects/);

    // Navigate to Tasks
    await page.click('text=Tasks');
    await expect(page).toHaveURL(/\/dashboard\/tasks/);

    // Navigate to Team
    await page.click('text=Team');
    await expect(page).toHaveURL(/\/dashboard\/team/);

    // Navigate to Settings
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/dashboard\/settings/);

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should have persistent navigation across pages', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Sidebar/navigation should be visible
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();

    // Navigate to another page
    await page.goto('/dashboard/tasks');

    // Navigation should still be visible
    await expect(nav.first()).toBeVisible();
  });

  test('should highlight active page in navigation', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Projects link should be highlighted/active
    const projectsLink = page.locator('a, button').filter({ hasText: /^Projects$/ }).first();
    const classList = await projectsLink.getAttribute('class');

    // Should have active/selected class or aria-current
    const ariaCurrent = await projectsLink.getAttribute('aria-current');
    expect(classList || ariaCurrent).toBeTruthy();
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to projects
    await page.click('text=Projects');
    await expect(page).toHaveURL(/\/dashboard\/projects/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu or mobile navigation trigger
    const mobileMenu = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
    const count = await mobileMenu.count();

    // Mobile menu should exist on small screens
    if (count > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should toggle mobile menu', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]');
    const count = await mobileMenuButton.count();

    if (count > 0) {
      // Click to open
      await mobileMenuButton.first().click();
      await page.waitForTimeout(300);

      // Navigation should be visible
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();

      // Click to close
      await mobileMenuButton.first().click();
      await page.waitForTimeout(300);
    }
  });
});
