// Checks the translation files: same keys in every language, and nothing used by the app is missing.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { SENTENCES } from '../js/data/sentences.js';
import { LANGUAGES, createTranslator } from '../js/i18n/index.js';

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/** Lists every key path, treating plural forms ({ one, other }) as one key. */
function keyPaths(node, prefix = '') {
  if (typeof node !== 'object' || Array.isArray(node)) return [prefix];
  const keys = Object.keys(node);
  if (keys.every((key) => PLURAL_CATEGORIES.has(key))) return [prefix];
  return keys.flatMap((key) => keyPaths(node[key], prefix ? `${prefix}.${key}` : key));
}

test('every language has the same keys as English', () => {
  const english = keyPaths(LANGUAGES.en.dictionary).sort();
  for (const [code, { dictionary }] of Object.entries(LANGUAGES)) {
    assert.deepEqual(keyPaths(dictionary).sort(), english, `${code} keys differ from English`);
  }
});

test('lists have the same length in every language', () => {
  const pl = createTranslator('pl');
  const en = createTranslator('en');
  assert.equal(pl('learn.steps').length, en('learn.steps').length);
  for (const grammarCase of ['nom', 'akk', 'dat', 'gen']) {
    assert.equal(pl(`learn.cases.${grammarCase}.triggers`).length, en(`learn.cases.${grammarCase}.triggers`).length);
  }
});

test('every key used in the code exists in English', async () => {
  const files = ['quiz-view', 'question-card', 'rush-view', 'words-view', 'tutorial-view', 'table', 'set-name']
    .map((name) => `js/ui/${name}.js`);
  files.push('js/main.js', 'js/quiz/generator.js', 'index.html');
  const english = new Set(keyPaths(LANGUAGES.en.dictionary));
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const [, key] of source.matchAll(/\bt\('([a-zA-Z.]+)'/g)) {
      assert.ok(english.has(key), `${file}: missing key "${key}"`);
    }
    for (const [, key] of source.matchAll(/data-i18n(?:-aria-label)?="([a-zA-Z.]+)"/g)) {
      assert.ok(english.has(key), `${file}: missing key "${key}"`);
    }
  }
});

test('every sentence rule has a wording', () => {
  for (const code of Object.keys(LANGUAGES)) {
    const t = createTranslator(code);
    for (const { why } of SENTENCES) assert.notEqual(t(`why.${why.rule}`), `why.${why.rule}`);
  }
});

test('plural forms follow each language', () => {
  const pl = createTranslator('pl');
  assert.equal(pl('words.count', { count: 1 }), '1 słówko');
  assert.equal(pl('words.count', { count: 3 }), '3 słówka');
  assert.equal(pl('words.count', { count: 5 }), '5 słówek');
  assert.equal(createTranslator('en')('words.count', { count: 1 }), '1 word');
});
