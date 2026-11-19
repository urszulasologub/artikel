// Guards the word and sentence lists, so new entries can't silently break the quiz.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NOUNS } from '../js/data/nouns.js';
import { SENTENCES } from '../js/data/sentences.js';
import { CASES } from '../js/grammar/articles.js';
import { GAP, fillTemplate, matchingNouns } from '../js/quiz/generator.js';

const TAGS = ['person', 'animal', 'object', 'place'];

test('nouns are well formed and unique', () => {
  const seen = new Set();
  for (const noun of NOUNS) {
    assert.ok(['m', 'f', 'n'].includes(noun.gender), `${noun.word}: gender`);
    for (const field of ['word', 'plural', 'genitive', 'en']) {
      assert.equal(typeof noun[field], 'string', `${noun.word}: ${field}`);
    }
    assert.ok(noun.tags.length && noun.tags.every((t) => TAGS.includes(t)), `${noun.word}: tags`);
    assert.ok(!seen.has(noun.word), `${noun.word}: duplicate`);
    seen.add(noun.word);
  }
});

test('every sentence has one gap and matching nouns', () => {
  for (const sentence of SENTENCES) {
    assert.ok(CASES.includes(sentence.case), `${sentence.text}: case`);
    assert.equal(sentence.text.split(GAP).length, 2, `${sentence.text}: needs exactly one "${GAP}"`);
    assert.ok(sentence.tags.every((t) => TAGS.includes(t)), `${sentence.text}: tags`);
    assert.ok(matchingNouns(sentence).length > 0, `${sentence.text}: no nouns fit`);
    assert.ok(sentence.reason, `${sentence.text}: reason`);

    for (const plural of [false, true]) {
      const { before, after } = fillTemplate(sentence.text, plural);
      assert.ok(!/[{}]/.test(before + after), `${sentence.text}: unresolved placeholder`);
    }
  }
});

test('every case has sentences', () => {
  for (const grammarCase of CASES) {
    assert.ok(SENTENCES.some((s) => s.case === grammarCase), `no sentences for ${grammarCase}`);
  }
});

test('every sentence has an English translation with one noun slot', () => {
  for (const sentence of SENTENCES) {
    const slots = (sentence.en ?? '').match(/\{noun('s)?\}/g) ?? [];
    assert.equal(slots.length, 1, `${sentence.text}: en needs exactly one {noun} or {noun's}`);
  }
});

test('every noun has an English plural', () => {
  for (const noun of NOUNS) assert.equal(typeof noun.enPlural, 'string', `${noun.word}: enPlural`);
});
