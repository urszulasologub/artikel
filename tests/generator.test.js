import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkAnswer, createQuestion, explain, fillTemplate } from '../js/quiz/generator.js';

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
  const text = explain(q);
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
