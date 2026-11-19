// Browser tests for Artikel Rush. Timer and scoring rules are covered by the engine tests;
// these check the screens and that a whole game can be played.

import { expect, test } from '@playwright/test';

import { CASE_NAMES, getArticle } from '../js/grammar/articles.js';
import { openApp } from './helpers.js';

const rush = (page) => page.locator('#view-rush');

async function openRush(page) {
  const app = await openApp(page, 'rush');
  await expect(rush(page).getByRole('heading', { name: 'Artikel Rush' })).toBeVisible();
  return app;
}

/** Answers questions (any choice) until the game is over. Wrong answers cost hearts, so it ends. */
async function playUntilGameOver(page) {
  for (let step = 0; step < 200; step++) {
    if (await rush(page).locator('.rush-over').count()) return;
    const card = rush(page).locator('.rush-card');
    const caseButton = card.locator('.case-choice:not(:disabled)');
    if (await caseButton.count()) await caseButton.first().click();
    const choice = card.locator('.choice:not(:disabled)');
    if (await choice.count()) await choice.nth(step % 6).click();
    await card.locator('.next').click();
  }
  throw new Error('the game did not end');
}

test('at least two cases are needed to start', async ({ page }) => {
  const app = await openRush(page);
  const start = rush(page).getByRole('button', { name: 'Start' });
  for (const name of ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv']) {
    await rush(page).locator('.case-check', { hasText: name }).getByRole('checkbox').uncheck();
  }
  await rush(page).locator('.case-check', { hasText: 'Dativ' }).getByRole('checkbox').check();
  await expect(start).toBeDisabled();
  await expect(rush(page).locator('.form-error')).toContainText('at least 2');

  await rush(page).locator('.case-check', { hasText: 'Akkusativ' }).getByRole('checkbox').check();
  await expect(start).toBeEnabled();
  app.expectNoErrors();
});

test('a game starts in round 1 with three hearts', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();

  await expect(rush(page).locator('.round-banner')).toContainText('Round 1');
  await expect(rush(page).locator('.heart:not(.empty)')).toHaveCount(3);
  await expect(rush(page).locator('.score-value')).toHaveText('0');
  await expect(rush(page).locator('.timer')).toHaveCount(0); // no timer in early rounds
  app.expectNoErrors();
});

test('play until game over, then save a high score', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();
  await playUntilGameOver(page);

  await expect(rush(page).locator('.rush-over h2')).toHaveText('Game over');
  const score = Number(await rush(page).locator('.summary-score strong').textContent());
  if (score > 0) {
    await rush(page).getByRole('textbox', { name: 'Your name' }).fill('Tester');
    await rush(page).getByRole('button', { name: 'Save' }).click();
    await expect(rush(page).locator('.score-table tr.mine')).toContainText('Tester');

    await page.reload();
    await expect(rush(page).locator('.score-table')).toContainText('Tester');
  }
  app.expectNoErrors();
});

test('ending a game early shows the results, and you can play again', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();
  await rush(page).getByRole('button', { name: 'End game' }).click();
  await expect(rush(page).locator('.rush-over')).toBeVisible();
  await expect(rush(page).getByRole('button', { name: 'Save' })).toHaveCount(0); // 0 points never qualify

  await rush(page).getByRole('button', { name: 'Play again' }).click();
  await expect(rush(page).locator('.round-banner')).toContainText('Round 1');
  app.expectNoErrors();
});

test('ten right answers in round 1: points, combo ×1.2, and round 2 starts', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();
  const card = rush(page).locator('.rush-card');

  for (let i = 0; i < 10; i++) {
    await expect(rush(page).locator('.round-progress')).toContainText(`${i}/10`);
    await answerRight(page);
    await expect(card.locator('.feedback.ok')).toBeVisible();
    await card.locator('.next').click();
  }
  await expect(rush(page).locator('.round-banner')).toContainText('Round 2');
  await expect(rush(page).locator('.combo')).toHaveText('×1.2');
  await expect(rush(page).locator('.heart:not(.empty)')).toHaveCount(3);
  // 9 answers × 10 points, then the 10th at ×1.2 = 12.
  await expect(rush(page).locator('.score-value')).toHaveText('102');
  app.expectNoErrors();
});

/**
 * Answers the current question correctly, the way a learner would in round 1: read the case and gender
 * shown on the card, then look the article up in the table.
 */
async function answerRight(page) {
  const card = rush(page).locator('.rush-card');
  const caseName = await card.locator('.case-tag').evaluate((tag) => tag.firstChild.textContent);
  const genderName = await card.locator('.hints .tag:not(.case-tag)').textContent();
  const grammarCase = Object.keys(CASE_NAMES).find((key) => CASE_NAMES[key] === caseName);
  const gender = { masculine: 'm', feminine: 'f', neuter: 'n', plural: 'pl' }[genderName.trim()];
  const article = getArticle('definite', grammarCase, gender);
  await card.locator('.choice').filter({ hasText: new RegExp(`^${article}$`, 'i') }).click();
}

test('the score bar stays visible under the header while scrolling', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const header = await page.locator('header.top').boundingBox();
  const hud = await rush(page).locator('.rush-hud').boundingBox();
  expect(hud.y).toBeGreaterThanOrEqual(Math.floor(header.y + header.height) - 1);
  await expect(rush(page).locator('.hearts')).toBeInViewport();
  app.expectNoErrors();
});
