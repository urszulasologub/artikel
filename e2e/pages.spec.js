// Browser tests for navigation, the Learn tab, the Words list and the sound button.

import { expect, test } from '@playwright/test';

import { openApp } from './helpers.js';

test('tabs switch between sections', async ({ page }) => {
  const app = await openApp(page);
  const nav = page.getByRole('navigation', { name: 'Sections' });

  await nav.getByRole('link', { name: 'Learn' }).click();
  await expect(page.getByRole('heading', { name: 'How cases work' })).toBeVisible();
  await expect(page.locator('#view-practice')).toBeHidden();

  await nav.getByRole('link', { name: 'Words' }).click();
  await expect(page.locator('.noun-item').first()).toBeVisible();

  await nav.getByRole('link', { name: 'Practice' }).click();
  await expect(page.locator('.card')).toBeVisible();
  app.expectNoErrors();
});

test('learn tab shows all four cases with their question words', async ({ page }) => {
  const app = await openApp(page, 'learn');
  const cards = page.locator('.case-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(2)).toContainText('wem?');
  app.expectNoErrors();
});

test('words tab: filter by gender and reveal hidden articles', async ({ page }) => {
  const app = await openApp(page, 'words');

  await page.getByRole('button', { name: 'die', exact: true }).click();
  const articles = page.locator('.noun-item .article');
  for (const text of await articles.allTextContents()) expect(text).toBe('die');

  await page.getByLabel('Hide articles (tap a word to check)').check();
  const first = page.locator('.noun-item').first();
  await expect(first.locator('.article')).toHaveClass(/concealed/);
  await first.click();
  await expect(first.locator('.article')).not.toHaveClass(/concealed/);
  app.expectNoErrors();
});

test('sound button toggles and is remembered', async ({ page }) => {
  const app = await openApp(page);
  const button = page.locator('#sound-toggle');

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  app.expectNoErrors();
});
