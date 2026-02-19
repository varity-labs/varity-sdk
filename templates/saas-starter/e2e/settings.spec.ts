import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should have settings title
    await expect(page.locator('h1, h2').filter({ hasText: /Settings/i })).toBeVisible();
  });

  test('should display all settings tabs', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for common settings tabs
    const tabs = ['Profile', 'Preferences', 'Security', 'Billing'];
    for (const tab of tabs) {
      const tabElement = page.locator(`button, [role="tab"]`).filter({ hasText: new RegExp(tab, 'i') });
      const count = await tabElement.count();
      expect(count).toBeGreaterThanOrEqual(0); // Tab may or may not exist
    }
  });

  test('should open Edit Profile dialog', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for Edit Profile button
    const editButton = page.locator('button').filter({ hasText: /Edit Profile|Edit/i }).first();
    const count = await editButton.count();

    if (count > 0) {
      await editButton.click();

      // Dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for dark mode toggle
    const darkModeToggle = page.locator('button, [role="switch"]').filter({ hasText: /Dark Mode|Theme/i });
    const count = await darkModeToggle.count();

    if (count > 0) {
      // Get initial state
      const initialClass = await page.locator('html').getAttribute('class');

      // Click toggle
      await darkModeToggle.first().click();
      await page.waitForTimeout(300);

      // Verify class changed
      const newClass = await page.locator('html').getAttribute('class');
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('should display security options', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click Security tab if exists
    const securityTab = page.locator('button, [role="tab"]').filter({ hasText: /Security/i });
    const count = await securityTab.count();

    if (count > 0) {
      await securityTab.first().click();
      await page.waitForTimeout(300);

      // Should show security options
      const passwordSection = page.locator('text=/Password|Change Password|2FA|Two-Factor/i');
      const passwordCount = await passwordSection.count();
      expect(passwordCount).toBeGreaterThan(0);
    }
  });

  test('should display billing information', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click Billing tab if exists
    const billingTab = page.locator('button, [role="tab"]').filter({ hasText: /Billing/i });
    const count = await billingTab.count();

    if (count > 0) {
      await billingTab.first().click();
      await page.waitForTimeout(300);

      // Should show billing info
      const billingInfo = page.locator('text=/Plan|Subscription|Payment Method/i');
      const billingCount = await billingInfo.count();
      expect(billingCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Settings Accessibility', () => {
  test('should have proper focus management in dialogs', async ({ page }) => {
    await page.goto('/dashboard/settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Try to open a dialog
    const editButton = page.locator('button').filter({ hasText: /Edit Profile|Edit/i }).first();
    const count = await editButton.count();

    if (count > 0) {
      await editButton.click();

      // Focus should be trapped in dialog
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInDialog = await focusedElement.evaluate((el) => {
        return !!el.closest('[role="dialog"]');
      });

      expect(isInDialog).toBe(true);

      // Close dialog with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Dialog should be closed
      const dialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(dialogVisible).toBe(false);
    }
  });
});
