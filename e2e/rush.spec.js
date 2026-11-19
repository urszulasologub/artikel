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
  const article = await rightArticle(page);
  await card.locator('.choice').filter({ hasText: new RegExp(`^${article}$`, 'i') }).click();
}

/** The right article, worked out from the case and gender shown on the card, and the article kind on the buttons. */
async function rightArticle(page) {
  const card = rush(page).locator('.rush-card');
  const choices = await card.locator('.choice').allTextContents();
  const articleType = choices.some((choice) => /^einen$/i.test(choice)) ? 'indefinite' : 'definite';
  const caseName = await card.locator('.case-tag').evaluate((tag) => tag.firstChild.textContent);
  const genderName = await card.locator('.hints .tag:not(.case-tag)').textContent();
  const grammarCase = Object.keys(CASE_NAMES).find((key) => CASE_NAMES[key] === caseName);
  const gender = { masculine: 'm', feminine: 'f', neuter: 'n', plural: 'pl' }[genderName.trim()];
  return getArticle(articleType, grammarCase, gender);
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

test('a wrong case costs one heart at once, and a wrong article on the same question costs no more', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: 'Start' }).click();
  const card = rush(page).locator('.rush-card');

  // Round 1 has no case step: answer it right to reach round 2, which asks for the case first.
  for (let i = 0; i < 10; i++) {
    await answerRight(page);
    await card.locator('.next').click();
  }
  await expect(rush(page).locator('.round-banner')).toContainText('Round 2');

  // Pick case buttons until one is wrong (each question has only one right case).
  for (let attempt = 0; attempt < 10; attempt++) {
    await card.locator('.case-choice').first().click();
    if (await card.locator('.case-choice.bad').count()) break;
    await answerRight(page);
    await card.locator('.next').click();
  }
  await expect(card.locator('.case-choice.bad')).toHaveCount(1);
  await expect(rush(page).locator('.heart:not(.empty)')).toHaveCount(2);

  // Now a wrong article as well: still only one heart lost for this question.
  const right = await rightArticle(page);
  await card.locator('.choice').filter({ hasNotText: new RegExp(`^${right}$`, 'i') }).first().click();
  await expect(card.locator('.feedback.bad')).toBeVisible();
  await expect(rush(page).locator('.heart:not(.empty)')).toHaveCount(2);
  app.expectNoErrors();
});

test('starting at Hard skips to round 3 with a bonus that ends at the first mistake', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: /^Hard/ }).click();
  await expect(rush(page).getByRole('button', { name: /^Hard/ })).toHaveAttribute('aria-pressed', 'true');
  await rush(page).getByRole('button', { name: 'Start' }).click();

  await expect(rush(page).locator('.round-banner')).toContainText('Round 3');
  await expect(rush(page).locator('.start-bonus-badge')).toHaveText('Bonus ×1.7');

  // Answer until the first mistake; the bonus badge then goes away.
  const card = rush(page).locator('.rush-card');
  for (let i = 0; i < 20 && (await rush(page).locator('.start-bonus-badge').count()); i++) {
    await card.locator('.case-choice').first().click();
    await card.locator('.choice').first().click();
    await card.locator('.next').click();
  }
  await expect(rush(page).locator('.start-bonus-badge')).toHaveCount(0);

  // The choice is remembered for next time.
  await page.reload();
  await expect(rush(page).getByRole('button', { name: /^Hard/ })).toHaveAttribute('aria-pressed', 'true');
  app.expectNoErrors();
});

test('the score bar never makes the page wider than the screen', async ({ page }) => {
  const app = await openRush(page);
  await rush(page).getByRole('button', { name: /^Medium/ }).click();
  await rush(page).getByRole('button', { name: 'Start' }).click();
  await expect(rush(page).locator('.start-bonus-badge')).toBeVisible();
  // Long score text and both badges at once, like a long game on a phone.
  await rush(page).locator('.score-value').evaluate((node) => { node.textContent = '12345'; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  app.expectNoErrors();
});
