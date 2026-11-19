// Browser tests for word sets: create, copy, add/remove words, delete, export, import, and practice with them.

import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import { card, openApp, settingsPanel } from './helpers.js';

const words = (page) => page.locator('#view-words');
const setSelect = (page) => words(page).getByLabel('Practise with');

async function addWord(page, { word, gender, kind, plural, english }) {
  const form = words(page).locator('form.add-word');
  await form.getByLabel('German word').fill(word);
  if (gender) await form.locator('.pill', { hasText: gender }).click();
  if (kind) await form.getByLabel('Kind').selectOption(kind);
  if (plural) await form.getByLabel('Plural (optional)').fill(plural);
  if (english) await form.getByLabel('English (optional)').fill(english);
  await form.getByRole('button', { name: 'Add word' }).click();
}

test('the built-in set is read-only and cannot be deleted', async ({ page }) => {
  const app = await openApp(page, 'words');
  await expect(setSelect(page)).toHaveValue('basics');
  await expect(words(page).locator('form.add-word')).toHaveCount(0);
  await expect(words(page).getByRole('button', { name: 'Delete set' })).toHaveCount(0);
  await expect(words(page).locator('.remove-btn')).toHaveCount(0);
  app.expectNoErrors();
});

test('create an empty set, add and remove words, and practise with them', async ({ page }) => {
  const app = await openApp(page, 'words');
  await words(page).getByRole('button', { name: 'New empty set' }).click();
  await expect(words(page)).toContainText('No words yet');

  await words(page).getByLabel('Name').fill('Lesson 5');
  await words(page).getByLabel('Name').press('Enter');
  await expect(setSelect(page).locator('option:checked')).toHaveText('Lesson 5');

  await addWord(page, { word: 'Löffel', gender: 'der', plural: 'Löffel', english: 'spoon' });
  await addWord(page, { word: 'die Gabel' }); // article typed with the word
  await expect(words(page).locator('.noun-item')).toHaveCount(2);
  await expect(words(page).locator('form.add-word').getByLabel('German word')).toHaveValue('');

  // Mistakes are explained and the typed text is kept.
  await addWord(page, { word: 'Messer' });
  await expect(words(page).locator('.form-error')).toContainText('der, die, das or plural');
  await expect(words(page).locator('form.add-word').getByLabel('German word')).toHaveValue('Messer');
  await addWord(page, { word: 'löffel', gender: 'der' });
  await expect(words(page).locator('.form-error')).toContainText('already in this set');

  await words(page).getByRole('button', { name: 'Remove Gabel' }).click();
  await expect(words(page).locator('.noun-item')).toHaveCount(1);

  // Practice now only uses this set.
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Practice' }).click();
  for (let i = 0; i < 5; i++) {
    await expect(card(page).locator('.noun')).toHaveText(/^Löffel/);
    await card(page).locator('.choice').first().click();
    await card(page).locator('.next').click();
  }
  app.expectNoErrors();
});

test('copy the built-in set and change the copy only', async ({ page }) => {
  const app = await openApp(page, 'words');
  const total = await words(page).locator('.noun-item').count();

  await words(page).getByRole('button', { name: 'Copy this set' }).click();
  await expect(setSelect(page).locator('option:checked')).toHaveText('Basics (copy)');
  await words(page).getByRole('button', { name: 'Remove Mann' }).click();
  await expect(words(page).locator('.noun-item')).toHaveCount(total - 1);

  await setSelect(page).selectOption('basics');
  await expect(words(page).locator('.noun-item')).toHaveCount(total);
  app.expectNoErrors();
});

test('delete a set after confirming', async ({ page }) => {
  const app = await openApp(page, 'words');
  await words(page).getByRole('button', { name: 'New empty set' }).click();

  page.once('dialog', (dialog) => dialog.dismiss());
  await words(page).getByRole('button', { name: 'Delete set' }).click();
  await expect(setSelect(page).locator('option')).toHaveCount(2);

  page.once('dialog', (dialog) => dialog.accept());
  await words(page).getByRole('button', { name: 'Delete set' }).click();
  await expect(setSelect(page).locator('option')).toHaveCount(1);
  await expect(setSelect(page)).toHaveValue('basics');
  app.expectNoErrors();
});

test('export a set as CSV', async ({ page }) => {
  const app = await openApp(page, 'words');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    words(page).getByRole('button', { name: 'Export CSV' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Basics.csv');
  const text = await readFile(await download.path(), 'utf8');
  expect(text.startsWith('﻿word,gender,kind')).toBe(true);
  expect(text).toContain('Mädchen,das,person,Mädchen');
  app.expectNoErrors();
});

test('import a CSV file into a new set, skipping bad rows', async ({ page }) => {
  const app = await openApp(page, 'words');
  await page.locator('#view-words input[type="file"]').setInputFiles({
    name: 'Kitchen.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('word;gender;kind;plural;english\nLöffel;der;thing;Löffel;spoon\nTopf;dir;thing;;pot\nTasse;die;thing;Tassen;cup\n'),
  });
  await expect(words(page).locator('.message')).toContainText('Imported 2 words');
  await expect(words(page).locator('.message')).toContainText('Row 3');
  await expect(setSelect(page).locator('option:checked')).toHaveText('Kitchen');
  await expect(words(page).locator('.noun-item')).toHaveCount(2);

  await page.reload();
  await expect(setSelect(page).locator('option:checked')).toHaveText('Kitchen');
  app.expectNoErrors();
});

test('an empty set shows a helpful message in Practice, and the set can be switched in Settings', async ({ page }) => {
  const app = await openApp(page, 'words');
  await words(page).getByRole('button', { name: 'New empty set' }).click();

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Practice' }).click();
  await expect(page.locator('.empty-set')).toContainText('has no words yet');

  await settingsPanel(page).getByLabel('Word set').selectOption('basics');
  await expect(card(page).locator('.choice').first()).toBeVisible();
  app.expectNoErrors();
});

test('add a plural-only word and practise it', async ({ page }) => {
  const app = await openApp(page, 'words');
  await words(page).getByRole('button', { name: 'New empty set' }).click();

  const form = words(page).locator('form.add-word');
  await form.locator('.pill', { hasText: 'plural only' }).click();
  await expect(form.getByLabel('Plural (optional)')).toBeHidden(); // not needed for plural-only words
  await addWord(page, { word: 'Ferien', gender: 'plural only', english: 'holidays' });
  await expect(words(page).locator('.noun-item')).toContainText('plural only');

  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Practice' }).click();
  await expect(card(page).locator('.hints')).toContainText('plural');
  await card(page).locator('.choice', { hasText: /^die$/i }).click();
  await expect(card(page).locator('.translation')).toContainText('holidays');
  app.expectNoErrors();
});
