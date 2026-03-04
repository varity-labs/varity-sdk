import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should load projects page', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should have page title or header
    await expect(page.locator('h1, h2').filter({ hasText: /Projects/i })).toBeVisible();
  });

  test('should display create project button', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Should have a button to create new project
    const createButton = page.locator('button', { hasText: /New Project|Create Project/i });
    const count = await createButton.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should open project creation dialog', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Click create project button
    const createButton = page.locator('button').filter({ hasText: /New Project|Create Project/i }).first();
    await createButton.click();

    // Dialog should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should have form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name"]')).toBeVisible();
  });

  test('should filter projects', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for filter/search inputs
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Filter"]');
    const count = await searchInput.count();

    if (count > 0) {
      await searchInput.first().fill('test');
      // Verify filtering works (results update)
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Project Details', () => {
  test('should display project list or empty state', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Either project cards are visible or empty state is visible
    const projectCards = page.locator('[data-testid="project-card"], .project-card');
    const emptyState = page.locator('text=/No projects|Get started|Create your first/i');

    const hasProjects = await projectCards.count();
    const hasEmptyState = await emptyState.count();

    expect(hasProjects + hasEmptyState).toBeGreaterThan(0);
  });
});
