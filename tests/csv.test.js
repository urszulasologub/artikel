import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NOUNS } from '../js/data/nouns.js';
import { parseCsv, toCsv } from '../js/words/csv.js';

test('export and import give back the same words', () => {
  const { nouns, errors } = parseCsv(toCsv(NOUNS));
  assert.deepEqual(errors, []);
  assert.equal(nouns.length, NOUNS.length);
  for (const [i, noun] of nouns.entries()) {
    const original = NOUNS[i];
    for (const field of ['word', 'gender', 'plural', 'genitive', 'en', 'enPlural']) {
      assert.equal(noun[field], original[field], `${original.word}.${field}`);
    }
    assert.deepEqual(noun.tags, original.tags);
  }
});

test('cells with commas, quotes and umlauts survive', () => {
  const nouns = [{ word: 'Uhr', gender: 'f', plural: 'Uhren', genitive: 'Uhr', en: 'clock, "watch"', enPlural: null, tags: ['object'] }];
  assert.equal(parseCsv(toCsv(nouns)).nouns[0].en, 'clock, "watch"');
  assert.equal(parseCsv('word,gender\nMädchen,das\n').nouns[0].word, 'Mädchen');
});

test('reads semicolon files, files without a header, and a byte order mark', () => {
  assert.equal(parseCsv('﻿word;gender;plural\r\nHund;der;Hunde\r\n').nouns[0].plural, 'Hunde');
  const { nouns } = parseCsv('Katze,die,animal\nder Tisch\n');
  assert.deepEqual(nouns.map((n) => [n.word, n.gender, n.tags[0]]), [['Katze', 'f', 'animal'], ['Tisch', 'm', 'object']]);
});

test('bad rows are skipped with a message', () => {
  const { nouns, errors } = parseCsv('word,gender\nHund,der\nKatze,dir\nHund,der\n\n');
  assert.equal(nouns.length, 1);
  assert.deepEqual(errors, [
    { row: 3, code: 'genderMissing', params: { word: 'Katze' } },
    { row: 4, code: 'duplicateInFile', params: { word: 'Hund' } },
  ]);
});

test('plural-only words export as "plural" and read back', () => {
  const eltern = NOUNS.find((noun) => noun.word === 'Eltern');
  const csv = toCsv([eltern]);
  assert.match(csv, /^Eltern,plural,person,/m);
  assert.equal(parseCsv(csv).nouns[0].gender, 'pl');
});

test('empty file', () => {
  assert.deepEqual(parseCsv(''), { nouns: [], errors: [{ row: null, code: 'emptyFile' }] });
});
