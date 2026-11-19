// Browser tests for the Practice tab.

import { expect, test } from '@playwright/test';

import {
  answerByClicking,
  card,
  choosePreset,
  openApp,
  option,
  pressContinue,
  seedBruderQuestion,
  setCases,
  settingsPanel,
} from './helpers.js';

const ALL_CASES = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'];

test('easy: answer, see feedback and translation, continue', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');

  await expect(card(page).locator('.case-choice')).toHaveCount(0);
  await answerByClicking(page);
  await expect(card(page).locator('.translation')).toBeVisible();

  const before = await card(page).locator('.sentence').textContent();
  await pressContinue(page);
  await expect(card(page).locator('.feedback')).toHaveCount(0);
  await expect(card(page).locator('.sentence')).not.toHaveText(before);
  app.expectNoErrors();
});

test('medium: the case can be picked on every question, through a full round and the retry', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Medium');
  await setCases(page, ALL_CASES);

  let summaries = 0;
  // 40 steps is more than a full round of 10 plus up to 10 retries, so it also starts a second round.
  for (let step = 0; step < 40; step++) {
    if (await page.locator('.summary').count()) {
      summaries++;
      await page.getByRole('button', { name: 'New round' }).click();
      continue;
    }
    const caseButtons = card(page).locator('.case-choice');
    await expect(caseButtons).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(caseButtons.nth(i)).toBeEnabled();
    // Article buttons stay hidden until the case is chosen.
    await expect(card(page).locator('.choice')).toHaveCount(0);

    // Vary the picks so we hit right and wrong cases, and right and wrong articles.
    await answerByClicking(page, { caseIndex: step % 4, articleIndex: (step * 5) % 6 });
    await pressContinue(page);
  }
  expect(summaries).toBeGreaterThan(0);
  app.expectNoErrors();
});

test('a wrong case marks the right one and still allows choosing an article', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Medium');
  await setCases(page, ALL_CASES);

  // Pick case buttons until one is wrong (at most 4 questions needed, since each has one right case).
  for (let attempt = 0; attempt < 8; attempt++) {
    await card(page).locator('.case-choice').first().click();
    if (await card(page).locator('.case-choice.bad').count()) break;
    await card(page).locator('.choice').first().click();
    await pressContinue(page);
  }
  await expect(card(page).locator('.case-choice.bad')).toHaveCount(1);
  await expect(card(page).locator('.case-choice.ok')).toHaveCount(1);

  await card(page).locator('.choice').first().click();
  // Red, or yellow if that article happens to be right: either way the case was wrong.
  await expect(card(page).locator('.feedback')).toHaveClass(/bad|partial/);
  await expect(card(page).locator('.next')).toBeVisible();
  app.expectNoErrors();
});

test('switching "Choose the case first" on and off', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');
  await setCases(page, ['Nominativ', 'Akkusativ']);

  await option(page, 'Choose the case first').check();
  await expect(card(page).locator('.case-choice')).toHaveCount(2);
  await expect(card(page).locator('.case-choice').first()).toBeEnabled();

  await option(page, 'Choose the case first').uncheck();
  await expect(card(page).locator('.case-choice')).toHaveCount(0);
  await expect(card(page).locator('.choice').first()).toBeEnabled();
  app.expectNoErrors();
});

test('changing settings after picking a case gives a fresh question', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Medium');
  await setCases(page, ['Nominativ', 'Akkusativ', 'Dativ']);

  await card(page).locator('.case-choice').first().click();
  await setCases(page, ALL_CASES);
  const caseButtons = card(page).locator('.case-choice');
  await expect(caseButtons).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(caseButtons.nth(i)).toBeEnabled();
  app.expectNoErrors();
});

test('medium shows the gender and asks for the case; hard hides the gender and the table', async ({ page }) => {
  const app = await openApp(page);
  await setCases(page, ['Nominativ', 'Dativ']);

  await choosePreset(page, 'Medium');
  await expect(card(page).locator('.hints .tag')).toHaveCount(1); // gender tag only, no case tag
  await expect(card(page).locator('.case-choice')).toHaveCount(2);

  await choosePreset(page, 'Hard');
  await expect(card(page).locator('.hints .tag')).toHaveCount(0);
  await expect(card(page).locator('.case-choice')).toHaveCount(2);
  await expect(page.locator('#view-practice table.declension')).toHaveCount(0);
  app.expectNoErrors();
});

test('"Show the case" is disabled while "Choose the case first" is on', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');
  await expect(option(page, 'Show the case')).toBeEnabled();
  await expect(option(page, 'Show the case')).toBeChecked();

  await option(page, 'Choose the case first').check();
  await expect(option(page, 'Show the case')).toBeDisabled();
  await expect(option(page, 'Show the case')).not.toBeChecked();

  await option(page, 'Choose the case first').uncheck();
  await expect(option(page, 'Show the case')).toBeEnabled();
  await expect(option(page, 'Show the case')).toBeChecked();
  app.expectNoErrors();
});

test('with only one case there is no case step', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Medium');
  await setCases(page, ['Dativ']);

  await expect(card(page).locator('.case-choice')).toHaveCount(0);
  await answerByClicking(page);
  app.expectNoErrors();
});

test('number keys pick the case and the article', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcuts are for desktop');
  const app = await openApp(page);
  await choosePreset(page, 'Medium');
  await setCases(page, ['Nominativ', 'Akkusativ']);
  await page.locator('body').click({ position: { x: 1, y: 1 } });

  await page.keyboard.press('2');
  await expect(card(page).locator('.case-choice.ok')).toHaveCount(1);
  await page.keyboard.press('1');
  await expect(card(page).locator('.feedback')).toBeVisible();
  app.expectNoErrors();
});

test('settings are remembered after reload', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Hard');
  await setCases(page, ['Dativ', 'Genitiv']);

  await page.reload();
  await expect(card(page).locator('.case-choice')).toHaveText([/Dativ/, /Genitiv/]);
  app.expectNoErrors();
});

test('the grammar table can be hidden and shown in easy mode', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');

  const tables = page.locator('#view-practice table.declension');
  await expect(tables.first()).toBeVisible();
  await page.getByRole('button', { name: 'Hide table' }).click();
  await expect(tables).toHaveCount(0);
  await page.getByRole('button', { name: 'Show table' }).click();
  await expect(tables.first()).toBeVisible();
  app.expectNoErrors();
});

test('a retried question still offers its case after the case list changed', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');
  await setCases(page, ['Nominativ', 'Akkusativ', 'Dativ']);
  await option(page, 'Choose the case first').check();

  // Answer the round with varied picks (some will be wrong), then switch the cases before the retries.
  for (let i = 0; i < 9; i++) {
    await answerByClicking(page, { caseIndex: i % 3, articleIndex: i % 6 });
    await pressContinue(page);
  }
  await answerByClicking(page, { caseIndex: 0, articleIndex: 0 });
  // Change the cases while the last answer is shown; this starts a new question in the same round.
  await setCases(page, ['Dativ', 'Genitiv']);

  for (let step = 0; step < 15 && !(await page.locator('.summary').count()); step++) {
    const correctCase = card(page).locator('.case-choice');
    await expect(correctCase.first()).toBeEnabled();
    await correctCase.first().click();
    // The right case is always among the buttons, so exactly one turns green.
    await expect(card(page).locator('.case-choice.ok')).toHaveCount(1);
    await card(page).locator('.choice').first().click();
    await pressContinue(page);
  }
  app.expectNoErrors();
});

test('the quiz continues after a page refresh', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');

  for (let i = 0; i < 3; i++) {
    await answerByClicking(page, { articleIndex: i });
    await pressContinue(page);
  }
  const sentence = await card(page).locator('.sentence').textContent();
  await page.reload();

  await expect(card(page)).toContainText('Question 4 of 10');
  await expect(card(page).locator('.segment-bar.ok, .segment-bar.bad')).toHaveCount(3);
  await expect(card(page).locator('.sentence')).toHaveText(sentence);
  app.expectNoErrors();
});

test('refreshing while an answer is shown moves on without counting it twice', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');

  await answerByClicking(page);
  await page.reload();
  await expect(card(page)).toContainText('Question 2 of 10');
  await expect(card(page).locator('.segment-bar.ok, .segment-bar.bad')).toHaveCount(1);
  await expect(card(page).locator('.feedback')).toHaveCount(0);
  app.expectNoErrors();
});

test('"New quiz" abandons the current quiz', async ({ page }) => {
  const app = await openApp(page);
  await choosePreset(page, 'Easy');

  for (let i = 0; i < 2; i++) {
    await answerByClicking(page);
    await pressContinue(page);
  }
  await expect(card(page)).toContainText('Question 3 of 10');
  await card(page).getByRole('button', { name: /New quiz/ }).click();
  await expect(card(page)).toContainText('Question 1 of 10');
  await expect(card(page).locator('.segment-bar.ok, .segment-bar.bad')).toHaveCount(0);

  await page.reload();
  await expect(card(page)).toContainText('Question 1 of 10');
  app.expectNoErrors();
});

test('the settings panel stays closed after a refresh', async ({ page }) => {
  const app = await openApp(page);
  await page.locator('details.settings summary').click();
  await expect(page.locator('details.settings')).not.toHaveAttribute('open', '');
  // The browser reports the toggle a moment after the click; wait until it is saved.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('german-grammar:settings-open'))).toBe('0');
  await page.reload();
  await expect(page.locator('details.settings')).not.toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Easy', exact: true })).toBeHidden();
  app.expectNoErrors();
});

test('right article but wrong case shows yellow, not red', async ({ page }) => {
  await seedBruderQuestion(page);
  const app = await openApp(page);

  await card(page).locator('.case-choice', { hasText: 'Akkusativ' }).click();
  await card(page).locator('.choice', { hasText: /^einem$/ }).click();

  await expect(card(page).locator('.feedback')).toHaveClass(/partial/);
  await expect(card(page).locator('.feedback')).toContainText('the case is Dativ');
  await expect(card(page).locator('.next')).toHaveClass(/warning/);
  await expect(card(page).locator('.segment-bar.partial')).toHaveCount(1);
  await expect(card(page).locator('.segment-bar.bad')).toHaveCount(0);
  app.expectNoErrors();
});

test('a right answer keeps the page still; a wrong one scrolls to Continue', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await seedBruderQuestion(page);
  const app = await openApp(page);
  const scrollY = () => page.evaluate(() => window.scrollY);

  async function answer(article) {
    await card(page).locator('.case-choice', { hasText: 'Dativ' }).click();
    const button = card(page).locator('.choice', { hasText: new RegExp(`^${article}$`) });
    await button.scrollIntoViewIfNeeded(); // Playwright would scroll here anyway; measure after it
    const before = await scrollY();
    await button.click();
    return before;
  }

  // Right answer: the page does not move.
  let before = await answer('einem');
  await expect(card(page).locator('.feedback.ok')).toBeVisible();
  expect(await scrollY()).toBe(before);

  // Same question again, wrong answer: the page scrolls down to Continue.
  await page.evaluate(() => localStorage.removeItem('german-grammar:progress'));
  await page.reload();
  before = await answer('ein');
  await expect(card(page).locator('.feedback.bad')).toBeVisible();
  await expect(card(page).locator('.next')).toBeInViewport();
  expect(await scrollY()).toBeGreaterThan(before);
  app.expectNoErrors();
});

test('tapping the noun or the clue word shows its meaning', async ({ page }) => {
  await seedBruderQuestion(page); // "Ich helfe ___ Bruder."
  const app = await openApp(page);

  await card(page).getByRole('button', { name: 'helfe' }).click();
  await expect(card(page).locator('.word-info')).toHaveText('helfen — to help');
  await card(page).getByRole('button', { name: 'Bruder' }).click();
  await expect(card(page).locator('.word-info')).toHaveText('Bruder — brother');
  await card(page).getByRole('button', { name: 'Bruder' }).click();
  await expect(card(page).locator('.word-info')).toHaveCount(0);
  app.expectNoErrors();
});


test('there is no typing option: answers are always chosen', async ({ page }) => {
  const app = await openApp(page);
  await expect(settingsPanel(page).getByLabel('Typing')).toHaveCount(0);
  await expect(settingsPanel(page).getByRole('button', { name: 'Medium+' })).toHaveCount(0);
  await expect(settingsPanel(page).locator('.segments .segment')).toHaveText(['Easy', 'Medium', 'Hard']);
  await expect(card(page).getByRole('textbox')).toHaveCount(0);
  app.expectNoErrors();
});
