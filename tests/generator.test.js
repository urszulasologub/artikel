import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createTranslator } from '../js/i18n/index.js';
import { checkAnswer, createQuestion, explain, fillTemplate, translateQuestion } from '../js/quiz/generator.js';
import { createNoun } from '../js/words/noun-input.js';

test('fillTemplate picks verb form and splits at the gap', () => {
  assert.deepEqual(fillTemplate('Wo {ist|sind} {article} {noun}?', false), { before: 'Wo ist ', after: '?' });
  assert.deepEqual(fillTemplate('Wo {ist|sind} {article} {noun}?', true), { before: 'Wo sind ', after: '?' });
});

test('questions only use the chosen cases and article types', () => {
  const settings = { cases: ['akk', 'dat'], articleTypes: ['indefinite'] };
  for (let i = 0; i < 300; i++) {
    const q = createQuestion(settings);
    assert.ok(settings.cases.includes(q.case));
    assert.equal(q.articleType, 'indefinite');
    assert.equal(q.plural, false, 'ein has no plural');
    assert.ok(q.choices.includes(q.answer));
  }
});

test('article is capitalised at the start of a sentence', () => {
  for (let i = 0; i < 300; i++) {
    const q = createQuestion({ cases: ['nom'], articleTypes: ['definite'] });
    if (q.before === '') {
      assert.match(q.answer, /^[A-Z]/);
      assert.ok(q.choices.every((c) => /^[A-Z]/.test(c)));
    }
  }
});

test('checkAnswer ignores case and spaces', () => {
  const q = createQuestion({ cases: ['akk'], articleTypes: ['definite'] });
  assert.ok(checkAnswer(q, `  ${q.answer.toUpperCase()} `));
  assert.ok(!checkAnswer(q, 'xyz'));
});

test('explain mentions the case and the answer', () => {
  const q = createQuestion({ cases: ['dat'], articleTypes: ['definite'] });
  const text = explain(q, createTranslator('en'));
  assert.match(text, /^Dativ:/);
  assert.ok(text.includes(`"${q.answer.toLowerCase()}"`));
});

test('does not repeat the previous question', () => {
  const settings = { cases: ['nom', 'akk', 'dat', 'gen'], articleTypes: ['definite'] };
  let previous = createQuestion(settings);
  for (let i = 0; i < 100; i++) {
    const q = createQuestion(settings, { previousKey: previous.key });
    assert.notEqual(q.key, previous.key);
    previous = q;
  }
});

test('works with a custom word list, including words without plural or English', () => {
  const nouns = [createNoun({ word: 'die Kanne' }).noun];
  const settings = { cases: ['nom', 'akk', 'dat', 'gen'], articleTypes: ['definite', 'indefinite'] };
  for (let i = 0; i < 200; i++) {
    const q = createQuestion(settings, { nouns });
    assert.equal(q.noun.word, 'Kanne');
    assert.equal(q.plural, false);
    assert.equal(translateQuestion(q, 'en'), null);
    assert.equal(translateQuestion(q, 'pl'), null);
  }
});

test('an empty word list gives no question', () => {
  assert.equal(createQuestion({ cases: ['nom'], articleTypes: ['definite'] }, { nouns: [] }), null);
});

test('plural-only words are always asked in the plural', () => {
  const nouns = [createNoun({ word: 'Eltern', gender: 'pl', kind: 'person', en: 'parents' }).noun];
  for (let i = 0; i < 200; i++) {
    const q = createQuestion({ cases: ['nom', 'akk', 'dat', 'gen'], articleTypes: ['definite'] }, { nouns });
    assert.equal(q.plural, true);
    assert.equal(q.gender, 'pl');
    assert.match(translateQuestion(q, 'en'), /parents/);
    assert.match(translateQuestion(q, 'pl'), /rodzic/i);
  }
  const dativ = createQuestion({ cases: ['dat'], articleTypes: ['definite'] }, { nouns });
  assert.equal(dativ.answer.toLowerCase(), 'den');
  assert.match(explain(dativ, createTranslator('en')), /only exists in the plural/);
  assert.match(explain(dativ, createTranslator('pl')), /tylko w liczbie mnogiej/);
});

test('with only "ein" chosen, plural-only words fall back to der/die/das', () => {
  const eltern = createNoun({ word: 'Eltern', gender: 'pl', kind: 'person' }).noun;
  const tasse = createNoun({ word: 'Tasse', gender: 'f' }).noun;
  const settings = { cases: ['nom', 'akk', 'dat', 'gen'], articleTypes: ['indefinite'] };
  for (let i = 0; i < 200; i++) {
    // Mixed set: plural-only words are skipped, since "ein" has no plural.
    assert.equal(createQuestion(settings, { nouns: [eltern, tasse] }).noun.word, 'Tasse');
    // Only plural-only words: use der/die/das rather than showing nothing.
    assert.equal(createQuestion(settings, { nouns: [eltern] }).articleType, 'definite');
  }
});
