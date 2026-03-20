import { test, expect } from '@playwright/test';

test('generate story form on production', async ({ page }) => {
  await page.goto('/');
  const inputs = page.locator('form input');
  await inputs.first().fill('Test Quest');
  const selects = page.locator('form select');
  await selects.nth(0).selectOption('Sci-Fi');
  await selects.nth(1).selectOption('epic');
  await page.locator('form input[type="number"]').fill('4');
  await page.click('button[type="submit"]');
  await page.waitForSelector('article h2', { timeout: 20000 });
  await expect(page.locator('article h2')).toContainText('Test Quest');
  await expect(page.locator('article')).toContainText('Chapter 1');
});