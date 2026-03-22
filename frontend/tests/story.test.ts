import { test, expect } from '@playwright/test';

test('gallery to reader multi-genre flow', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-story-card]', { timeout: 60000 });
  const card = page.locator('[data-story-card]').first();
  await expect(card).toBeVisible();
  await card.locator('text=Open Reader').click();
  await expect(page).toHaveURL(/\/reader\/story-/);
  await page.waitForSelector('main article', { timeout: 30000 });
  await expect(page.locator('button', { hasText: 'Read Story' })).toBeVisible();
});
