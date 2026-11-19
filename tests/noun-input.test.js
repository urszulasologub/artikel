import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createNoun, guessGenitive, kindOf } from '../js/words/noun-input.js';

test('creates a noun from the form fields', () => {
  const { noun } = createNoun({ word: 'hund', gender: 'der', kind: 'animal', plural: 'die hunde', en: 'dog' });
  assert.deepEqual(noun, {
    word: 'Hund',
    gender: 'm',
    plural: 'Hunde',
    genitive: 'Hunds',
    en: 'dog',
    enPlural: null,
    tags: ['animal'],
  });
});

test('the article can be typed with the word', () => {
  assert.equal(createNoun({ word: 'die Lampe' }).noun.gender, 'f');
  assert.equal(createNoun({ word: 'das  Haus' }).noun.word, 'Haus');
});

test('optional fields have safe defaults', () => {
  const { noun } = createNoun({ word: 'Tasse', gender: 'f' });
  assert.equal(noun.plural, null);
  assert.equal(noun.en, null);
  assert.equal(noun.genitive, 'Tasse', 'feminine nouns do not change in Genitiv');
  assert.deepEqual(noun.tags, ['object'], 'kind defaults to thing');
});

test('explains what is wrong', () => {
  const code = (input) => createNoun(input).error.code;
  assert.equal(code({ word: '' }), 'wordMissing');
  assert.equal(code({ word: 'Hund' }), 'genderMissing');
  assert.equal(code({ word: 'Hund', gender: 'dir' }), 'genderMissing');
  assert.equal(code({ word: 'zwei Wörter', gender: 'der' }), 'notOneWord');
  assert.equal(code({ word: 'Hund', gender: 'der', kind: 'robot' }), 'unknownKind');
});

test('plural-only words', () => {
  const { noun } = createNoun({ word: 'eltern', gender: 'plural', kind: 'person', plural: 'ignored', en: 'parents' });
  assert.deepEqual(noun, {
    word: 'Eltern',
    gender: 'pl',
    plural: 'Eltern',
    genitive: 'Eltern',
    en: 'parents',
    enPlural: 'parents',
    tags: ['person'],
  });
});

test('genitive guesses', () => {
  assert.equal(guessGenitive('Haus'), 'Hauses');
  assert.equal(guessGenitive('Tisch'), 'Tisches');
  assert.equal(guessGenitive('Auto'), 'Autos');
});

test('kindOf maps tags back to kinds', () => {
  assert.equal(kindOf({ tags: ['object'] }), 'thing');
  assert.equal(kindOf({ tags: ['person'] }), 'person');
});
