import { test, expect } from '@playwright/test';

test('generate story, select a path, and continue', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="title"]', 'Test Quest');
  await page.selectOption('select[name="genre"]', 'Sci-Fi');
  await page.selectOption('select[name="tone"]', 'epic');
  await page.selectOption('select[name="language"]', 'English');
  await page.fill('input[name="chapters"]', '4');
  await page.fill('textarea[name="focus"]', 'high stakes heist');

  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-chapter-panel-index]', { timeout: 20000 });
  await expect(page.locator('h2').last()).toContainText('Test Quest');
  await expect(page.locator('[data-chapter-panel-index]').first()).toContainText('Chapter 1');

  const chapterPanels = page.locator('[data-chapter-panel-index]');
  const initialChapterCount = await chapterPanels.count();

  const firstChoice = page.locator('button[data-choice-id]').first();
  await firstChoice.click();
  await expect(page.locator('textarea[name="focus"]')).not.toHaveValue('high stakes heist');

  const continueButton = page.locator('button', { hasText: 'Continue arc' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page.locator('[data-chapter-panel-index]')).toHaveCount(initialChapterCount + 1, {
    timeout: 20000,
  });
});
