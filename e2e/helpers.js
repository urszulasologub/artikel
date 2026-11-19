// Shared steps for the browser tests.

import { expect } from '@playwright/test';

/** Opens a tab and fails the test on any JavaScript error or console error. */
export async function openApp(page, tab = 'practice') {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // Failed requests are reported below with their URL, which is more useful.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      errors.push(message.text());
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`/#${tab}`);
  return {
    expectNoErrors: () => expect(errors, 'JavaScript errors on the page').toEqual([]),
  };
}

export const settingsPanel = (page) => page.locator('details.settings');
export const card = (page) => page.locator('.card');

export async function openSettings(page) {
  const panel = settingsPanel(page);
  if (!(await panel.evaluate((node) => node.open))) await panel.locator('summary').click();
}

export async function choosePreset(page, name) {
  await openSettings(page);
  await settingsPanel(page).getByRole('button', { name, exact: true }).click();
}

export async function setCases(page, names) {
  await openSettings(page);
  // Check the wanted ones first, so the list is never empty while unchecking.
  for (const name of names) await caseCheckbox(page, name).check();
  for (const name of ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv']) {
    if (!names.includes(name)) await caseCheckbox(page, name).uncheck();
  }
}

export function caseCheckbox(page, name) {
  return settingsPanel(page).locator('.case-check', { hasText: name }).getByRole('checkbox');
}

export function option(page, label) {
  return settingsPanel(page).getByLabel(label, { exact: true });
}

/** Answers the current question by clicking: case (if asked) and then an article. */
export async function answerByClicking(page, { caseIndex = 0, articleIndex = 0 } = {}) {
  const caseButtons = card(page).locator('.case-choice');
  if (await caseButtons.count()) {
    await expect(caseButtons.nth(caseIndex)).toBeEnabled();
    await caseButtons.nth(caseIndex).click();
    await expect(card(page).locator('.case-choice.ok')).toHaveCount(1);
  }
  const choice = card(page).locator('.choice').nth(articleIndex);
  await expect(choice).toBeEnabled();
  await choice.click();
  await expect(card(page).locator('.feedback')).toBeVisible();
}

export async function pressContinue(page) {
  await card(page).locator('.next').click();
}

/**
 * Starts the page on a known question: "Ich helfe ___ Bruder." (Dativ, answer "einem"),
 * with "Choose the case first" on and Akkusativ + Dativ practised.
 * @param {{ settings?: object, noun?: object }} [overrides] e.g. { settings: { showGender: false } }
 */
export async function seedBruderQuestion(page, overrides = {}) {
  await page.addInitScript(({ settings = {}, noun = {} }) => {
    if (localStorage.getItem('german-grammar:progress')) return;
    localStorage.setItem('german-grammar:settings', JSON.stringify({
      showGender: true, showCase: false, askCase: true, tableMode: 'toggle',
      cases: ['akk', 'dat'], articleTypes: ['indefinite'],
      ...settings,
    }));
    const question = {
      key: 'dat-help|Bruder|indefinite|false', sentenceId: 'dat-help', case: 'dat', articleType: 'indefinite',
      noun: { word: 'Bruder', gender: 'm', plural: 'Brüder', genitive: 'Bruders', en: 'brother', enPlural: 'brothers', tags: ['person'], ...noun },
      plural: false, gender: 'm', before: 'Ich helfe ', nounText: 'Bruder', after: '.',
      answer: 'einem', choices: ['ein', 'eine', 'einem', 'einen', 'einer', 'eines'],
    };
    localStorage.setItem('german-grammar:progress', JSON.stringify({
      version: 2, round: { results: [], retryResults: [] }, streak: 0, question, answered: false, showSummary: false,
    }));
  }, overrides);
}
