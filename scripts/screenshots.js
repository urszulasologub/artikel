// Takes the README screenshots: `npm run screenshots`. Saves PNGs to docs/screenshots/.
// Starts its own server, opens the app in Chrome and sets up a few nice moments.

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { chromium } from '@playwright/test';

import { NOUNS } from '../js/data/nouns.js';
import { SENTENCES } from '../js/data/sentences.js';
import { CASE_NAMES, getArticle, nounForm } from '../js/grammar/articles.js';
import { fillTemplate } from '../js/quiz/generator.js';
import { createNoun } from '../js/words/noun-input.js';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'docs/screenshots');
const PORT = 4175;
const BASE = `http://localhost:${PORT}`;
const PHONE = { viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1200, height: 860 }, deviceScaleFactor: 2 };

await mkdir(OUT, { recursive: true });
const server = spawn('node', ['scripts/serve.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } });
await waitForServer();
const browser = await chromium.launch({ channel: 'chrome' });

try {
  await practice();
  await rush();
  await words();
  await learn();
  console.log(`Screenshots saved to ${OUT}`);
} finally {
  await browser.close();
  server.kill();
}

/** Practice: a right answer on Medium, with the clue word's meaning and the translation. */
async function practice() {
  const page = await newPage(PHONE, {
    'german-grammar:settings-open': '0',
    'german-grammar:settings': JSON.stringify({
      showGender: true, showCase: false, askCase: true, tableMode: 'toggle',
      cases: ['nom', 'akk', 'dat'], articleTypes: ['definite'],
    }),
    'german-grammar:progress': JSON.stringify({
      version: 2,
      round: { results: [true, true, false, true].map((correct) => ({ question: { answer: 'der' }, correct })), retryResults: [] },
      streak: 1,
      answered: false,
      showSummary: false,
      question: {
        key: 'dat-help|Bruder|definite|false', sentenceId: 'dat-help', case: 'dat', articleType: 'definite',
        noun: NOUNS.find((noun) => noun.word === 'Bruder'),
        plural: false, gender: 'm', before: 'Ich helfe ', nounText: 'Bruder', after: '.',
        answer: 'dem', choices: ['das', 'dem', 'den', 'der', 'des', 'die'],
      },
    }),
  });
  const card = page.locator('#view-practice .card');
  await card.getByRole('button', { name: 'helfe' }).click();
  await card.locator('.case-choice', { hasText: 'Dativ' }).click();
  await card.locator('.choice', { hasText: /^dem$/ }).click();
  await settle(page);
  await page.screenshot({ path: `${OUT}/practice.png` });
  await page.close();
}

/** Rush: started at Hard, played right into the first timed round. */
async function rush() {
  const page = await newPage(PHONE, { 'german-grammar:rush-start': 'hard' });
  await page.goto(`${BASE}/#rush`);
  await page.locator('.rush-start-btn').click();
  for (let i = 0; i < 40 && !(await page.locator('.timer').count()); i++) await answerRushRight(page);
  // A few more right answers in the timed round, so the combo badge shows.
  for (let i = 0; i < 2; i++) await answerRushRight(page);
  await page.waitForTimeout(1500); // let the timer run a little
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page);
  await page.screenshot({ path: `${OUT}/rush.png` });
  await page.close();
}

/** Words: your own set, with the form to add a word. */
async function words() {
  const nouns = [
    createNoun({ word: 'der Löffel', kind: 'thing', plural: 'Löffel', en: 'spoon' }),
    createNoun({ word: 'die Gabel', kind: 'thing', plural: 'Gabeln', en: 'fork' }),
    createNoun({ word: 'das Messer', kind: 'thing', plural: 'Messer', en: 'knife' }),
    createNoun({ word: 'die Tasse', kind: 'thing', plural: 'Tassen', en: 'cup' }),
    createNoun({ word: 'Ferien', gender: 'plural', kind: 'thing', en: 'holidays' }),
  ].map((result) => result.noun);
  const page = await newPage(PHONE, {
    'german-grammar:word-sets': JSON.stringify({ activeId: 'demo', sets: [{ id: 'demo', name: 'Kitchen', nouns }] }),
  });
  await page.goto(`${BASE}/#words`);
  const form = page.locator('form.add-word');
  await form.getByLabel('German word').fill('Teller');
  await form.locator('.pill', { hasText: 'der' }).click();
  await settle(page);
  await page.locator('#view-words').locator('.panel').nth(1).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await page.screenshot({ path: `${OUT}/words.png` });
  await page.close();
}

/** Learn: the article tables and the case cards. */
async function learn() {
  const page = await newPage(DESKTOP, {});
  await page.goto(`${BASE}/#learn`);
  await page.locator('#view-learn h2', { hasText: 'Article tables' }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -110));
  await settle(page);
  await page.screenshot({ path: `${OUT}/learn.png` });
  await page.close();
}

// ---------- Helpers ----------

/** Opens a page with the given localStorage, in English. (Headless Chrome plays no sound.) */
async function newPage(device, storage) {
  const context = await browser.newContext({ ...device, locale: 'en-US' });
  await context.addInitScript((items) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('german-grammar:language', 'en');
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
  }, storage);
  const page = await context.newPage();
  await page.goto(`${BASE}/#practice`);
  return page;
}

/**
 * Answers a Rush question right, like a player who knows the grammar: finds the sentence and the noun
 * in the app's data, picks the case, then the article.
 */
async function answerRushRight(page) {
  const card = page.locator('.rush-card');
  const text = (await card.locator('.sentence').textContent()).replace(/ /g, '');
  const nounText = (await card.locator('.noun').textContent()).trim();
  const caseNames = await card.locator('.case-choice').allTextContents();

  let found = null;
  for (const sentence of SENTENCES) {
    for (const plural of [false, true]) {
      const { before, after } = fillTemplate(sentence.text, plural);
      if (`${before} ${nounText}${after}` !== text) continue;
      const noun = NOUNS.find((n) => nounForm(n, sentence.case, plural) === nounText && (plural ? n.plural : n.gender !== 'pl'));
      if (noun) found ??= { sentence, plural, gender: plural ? 'pl' : noun.gender };
    }
  }
  if (!found) throw new Error(`Could not solve: ${text}`);

  if (caseNames.length) {
    await card.locator('.case-choice', { hasText: CASE_NAMES[found.sentence.case] }).click();
  }
  const articleChoices = await card.locator('.choice').allTextContents();
  const type = articleChoices.some((choice) => /^einen$/i.test(choice)) ? 'indefinite' : 'definite';
  const article = getArticle(type, found.sentence.case, found.gender);
  await card.locator('.choice').filter({ hasText: new RegExp(`^${article}$`, 'i') }).click();
  await card.locator('.next').click();
}

/** Waits for animations to finish, so screenshots are not caught mid-move. */
async function settle(page) {
  await page.waitForTimeout(900);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error('The server did not start');
}
