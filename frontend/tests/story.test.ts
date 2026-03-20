import { test, expect } from '@playwright/test';

test('generate story, select a path, and continue', async ({ page }) => {
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

  const chapterPanels = page.locator('[data-chapter-panel-index]');
  const initialChapterCount = await chapterPanels.count();

  const firstChoice = page.locator('button[data-choice-id]').first();
  await firstChoice.click();
  await expect(page.locator('textarea[name="focus"]')).toHaveValue(/chapter 1/i);

  const continueButton = page.locator('button', { hasText: 'Continue arc' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page.locator('[data-chapter-panel-index]')).toHaveCount(initialChapterCount + 1, {
    timeout: 20000,
  });
});
