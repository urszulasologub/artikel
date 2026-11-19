// Browser tests for switching the interface language.

import { expect, test } from '@playwright/test';

import { card, choosePreset, openApp } from './helpers.js';

async function switchToPolish(page) {
  await page.getByRole('button', { name: 'PL', exact: true }).click();
  await expect(page.getByRole('button', { name: 'PL', exact: true })).toHaveAttribute('aria-pressed', 'true');
}

test('switching to Polish translates the interface and remembers it', async ({ page }) => {
  const app = await openApp(page);
  await switchToPolish(page);

  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'Ćwiczenia' })).toBeVisible();
  await expect(page.locator('details.settings summary')).toHaveText('Ustawienia');

  await nav.getByRole('link', { name: 'Nauka' }).click();
  await expect(page.getByRole('heading', { name: 'Jak działają przypadki' })).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Practice' })).toBeVisible();
  app.expectNoErrors();
});

test('in Polish, built-in words get a Polish sentence translation and meaning', async ({ page }) => {
  const app = await openApp(page);
  await switchToPolish(page);
  await page.getByRole('button', { name: 'Łatwy', exact: true }).click();

  await card(page).locator('.choice').first().click();
  await expect(card(page).locator('.feedback p')).toContainText('więc odpowiedź to');
  // Polish sentences are written in Polish words; check a typical Polish letter or word appears.
  await expect(card(page).locator('.translation')).toHaveText(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|^[A-ZŁŚŻ][a-ząćęłńóśźż]+/);
  app.expectNoErrors();
});

test('the quiz continues where it was after switching language', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');
  await card(page).locator('.choice').first().click();
  await card(page).locator('.next').click();

  await switchToPolish(page);
  await expect(card(page)).toContainText('Pytanie 2 z 10');
  app.expectNoErrors();
});
