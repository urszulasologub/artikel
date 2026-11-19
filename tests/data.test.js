// Guards the word and sentence lists, so new entries can't silently break the quiz.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EVERYDAY_NOUNS } from '../js/data/nouns-everyday.js';
import { NOUNS } from '../js/data/nouns.js';
import { POLISH_NOUNS } from '../js/data/nouns-pl.js';
import { SENTENCES } from '../js/data/sentences.js';
import { CASES } from '../js/grammar/articles.js';
import { GAP, fillTemplate, matchingNouns } from '../js/quiz/generator.js';

const TAGS = ['person', 'animal', 'object', 'place', 'building'];
// Every built-in word: Basics plus the extra words of the Everyday German set.
const ALL_NOUNS = [...NOUNS, ...EVERYDAY_NOUNS];

test('nouns are well formed and unique', () => {
  const seen = new Set();
  for (const noun of ALL_NOUNS) {
    assert.ok(['m', 'f', 'n', 'pl'].includes(noun.gender), `${noun.word}: gender`);
    if (noun.gender === 'pl') assert.equal(noun.plural, noun.word, `${noun.word}: plural-only words are their own plural`);
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
    assert.ok(matchingNouns(sentence, ALL_NOUNS).length > 0, `${sentence.text}: no nouns fit`);
    assert.ok(sentence.id && sentence.why?.rule, `${sentence.text}: id and why`);

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
  for (const noun of ALL_NOUNS) assert.equal(typeof noun.enPlural, 'string', `${noun.word}: enPlural`);
});

test('every kind of noun has a sentence in every case, so any word set works', () => {
  for (const tag of TAGS) {
    for (const grammarCase of CASES) {
      assert.ok(
        SENTENCES.some((s) => s.case === grammarCase && s.tags.includes(tag)),
        `no ${grammarCase} sentence for "${tag}" nouns`,
      );
    }
  }
});

test('every sentence has a Polish translation with one noun slot', () => {
  for (const sentence of SENTENCES) {
    const slots = (sentence.pl ?? '').match(/\{(nom|gen|dat|acc|inst)\}/g) ?? [];
    assert.equal(slots.length, 1, `${sentence.id}: pl needs exactly one Polish case slot`);
  }
});

test('every built-in noun has the Polish forms it needs', () => {
  for (const noun of ALL_NOUNS) {
    const polish = POLISH_NOUNS[noun.word];
    assert.ok(polish, `${noun.word}: no Polish forms`);
    if (noun.gender !== 'pl') assert.equal(polish.sg?.length, 5, `${noun.word}: Polish singular forms`);
    if (noun.plural) assert.equal(polish.pl?.length, 5, `${noun.word}: Polish plural forms`);
  }
});

test('every sentence has a clue word that appears in it, with meanings', () => {
  for (const sentence of SENTENCES) {
    const { clue } = sentence;
    assert.ok(clue?.lemma && clue.en && clue.pl, `${sentence.id}: clue meanings`);
    for (const plural of [false, true]) {
      const { before, after } = fillTemplate(sentence.text, plural);
      const [singular, pluralForm = singular] = clue.text.split('|');
      const word = plural ? pluralForm : singular;
      const found = new RegExp(`(?<!\\p{L})${word}(?!\\p{L})`, 'u').test(before + ' ' + after);
      assert.ok(found, `${sentence.id}: clue "${word}" is not in the sentence`);
    }
  }
});

test('the Basics words still have sentences in every case', () => {
  for (const grammarCase of CASES) {
    const usable = SENTENCES.filter((s) => s.case === grammarCase && matchingNouns(s, NOUNS).length);
    assert.ok(usable.length >= 3, `only ${usable.length} ${grammarCase} sentences fit the Basics words`);
  }
});
