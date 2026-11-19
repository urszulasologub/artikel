import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { MAX_HIGH_SCORES, createHighScores } from '../js/game/high-scores.js';

let storage;
beforeEach(() => {
  const data = new Map();
  storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
});

test('scores are kept best first and survive a reload', () => {
  const scores = createHighScores(storage);
  scores.add({ name: 'Ula', score: 120, round: 3 });
  assert.equal(scores.add({ name: 'Max', score: 300, round: 5 }), 0);
  const reloaded = createHighScores(storage);
  assert.deepEqual(reloaded.list().map((s) => s.name), ['Max', 'Ula']);
});

test('only the best scores are kept', () => {
  const scores = createHighScores(storage);
  for (let i = 1; i <= MAX_HIGH_SCORES; i++) scores.add({ name: `P${i}`, score: i * 10, round: 1 });
  assert.equal(scores.qualifies(5), false);
  assert.equal(scores.qualifies(15), true);
  assert.equal(scores.add({ name: 'Low', score: 5, round: 1 }), -1);
  assert.equal(scores.list().length, MAX_HIGH_SCORES);
});

test('zero never qualifies; names are cleaned', () => {
  const scores = createHighScores(storage);
  assert.equal(scores.qualifies(0), false);
  scores.add({ name: '   ', score: 10, round: 0 });
  scores.add({ name: 'A very very long name', score: 20, round: 0 });
  assert.deepEqual(scores.list().map((s) => s.name), ['A very very ', '???']);
});

test('broken storage starts empty', () => {
  storage.setItem('german-grammar:rush-high-scores', '{oops');
  assert.deepEqual(createHighScores(storage).list(), []);
  assert.deepEqual(createHighScores(null).list(), []);
});
