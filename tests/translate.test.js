import assert from 'node:assert/strict';
import { test } from 'node:test';

import { nounPhrase, translate } from '../js/quiz/translate.js';

const man = { en: 'man', enPlural: 'men' };
const apple = { en: 'apple', enPlural: 'apples' };
const teacher = { en: 'teacher (m)', enPlural: 'teachers' };

test('noun phrases', () => {
  assert.equal(nounPhrase(man, false, 'definite'), 'the man');
  assert.equal(nounPhrase(man, true, 'definite'), 'the men');
  assert.equal(nounPhrase(apple, false, 'indefinite'), 'an apple');
  assert.equal(nounPhrase(teacher, false, 'indefinite'), 'a teacher');
});

test('translate fills verbs, nouns and possessives', () => {
  assert.equal(translate('{noun} {is|are} here.', { noun: man, plural: true, articleType: 'definite' }), 'The men are here.');
  assert.equal(translate("This is {noun's} room.", { noun: man, plural: false, articleType: 'indefinite' }), "This is a man's room.");
  assert.equal(translate("This is {noun's} room.", { noun: teacher, plural: true, articleType: 'definite' }), "This is the teachers' room.");
});
