import assert from 'node:assert/strict';
import { test } from 'node:test';

import { articleChoices, getArticle, nounForm } from '../js/grammar/articles.js';

const mann = { word: 'Mann', gender: 'm', plural: 'Männer', genitive: 'Mannes' };
const frau = { word: 'Frau', gender: 'f', plural: 'Frauen', genitive: 'Frau' };
const auto = { word: 'Auto', gender: 'n', plural: 'Autos', genitive: 'Autos' };

test('definite articles', () => {
  assert.equal(getArticle('definite', 'akk', 'm'), 'den');
  assert.equal(getArticle('definite', 'dat', 'f'), 'der');
  assert.equal(getArticle('definite', 'dat', 'pl'), 'den');
  assert.equal(getArticle('definite', 'gen', 'n'), 'des');
});

test('indefinite articles have no plural', () => {
  assert.equal(getArticle('indefinite', 'akk', 'm'), 'einen');
  assert.equal(getArticle('indefinite', 'dat', 'f'), 'einer');
  assert.equal(getArticle('indefinite', 'nom', 'pl'), null);
});

test('answer choices are the distinct forms', () => {
  assert.deepEqual(articleChoices('definite'), ['das', 'dem', 'den', 'der', 'des', 'die']);
  assert.deepEqual(articleChoices('indefinite'), ['ein', 'eine', 'einem', 'einen', 'einer', 'eines']);
});

test('noun forms', () => {
  assert.equal(nounForm(mann, 'nom', false), 'Mann');
  assert.equal(nounForm(mann, 'gen', false), 'Mannes');
  assert.equal(nounForm(frau, 'gen', false), 'Frau');
  assert.equal(nounForm(mann, 'dat', true), 'Männern');
  assert.equal(nounForm(frau, 'dat', true), 'Frauen');
  assert.equal(nounForm(auto, 'dat', true), 'Autos');
  assert.equal(nounForm(mann, 'akk', true), 'Männer');
});
