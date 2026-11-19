import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { loadProgress, saveProgress } from '../js/progress.js';

// Minimal in-memory stand-in for the browser's localStorage.
beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
});

const progress = {
  round: { results: [{ question: { answer: 'den' }, correct: true }], retryResults: [] },
  streak: 1,
  question: { answer: 'dem', case: 'dat' },
  answered: false,
  showSummary: false,
};

test('saved progress loads back', () => {
  saveProgress(progress);
  assert.deepEqual(loadProgress(), { version: 1, ...progress });
});

test('nothing saved gives null', () => {
  assert.equal(loadProgress(), null);
});

test('broken or old saves are ignored', () => {
  localStorage.setItem('german-grammar:progress', '{not json');
  assert.equal(loadProgress(), null);
  localStorage.setItem('german-grammar:progress', JSON.stringify({ ...progress, version: 0 }));
  assert.equal(loadProgress(), null);
  localStorage.setItem('german-grammar:progress', JSON.stringify({ version: 1, streak: 2 }));
  assert.equal(loadProgress(), null);
});
