import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { BUILT_IN_SETS, createWordSetStore } from '../js/words/store.js';

let storage;
beforeEach(() => {
  const data = new Map();
  storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
});

const hund = { word: 'Hund', gender: 'm', plural: 'Hunde', genitive: 'Hundes', en: 'dog', enPlural: null, tags: ['animal'] };

test('starts with the built-in set active', () => {
  const store = createWordSetStore(storage);
  assert.equal(store.activeSet().id, BUILT_IN_SETS[0].id);
  assert.equal(store.listSets().length, 1);
});

test('create, add, remove, rename and keep after reload', () => {
  const store = createWordSetStore(storage);
  const set = store.createSet('Lesson 1');
  assert.equal(store.activeSet().id, set.id);
  assert.equal(store.addNoun(set.id, hund), null);
  assert.deepEqual(store.addNoun(set.id, hund), { code: 'duplicate', params: { word: 'Hund' } });
  store.renameSet(set.id, 'Animals');

  const reloaded = createWordSetStore(storage);
  assert.equal(reloaded.activeSet().name, 'Animals');
  assert.deepEqual(reloaded.activeSet().nouns, [hund]);

  reloaded.removeNoun(set.id, 'Hund');
  assert.deepEqual(reloaded.activeSet().nouns, []);
});

test('copying makes an independent set with a unique name', () => {
  const store = createWordSetStore(storage);
  const copy = store.copySet('basics');
  const second = store.copySet('basics');
  assert.equal(copy.name, 'Basics (copy)');
  assert.equal(second.name, 'Basics (copy) 2');
  store.removeNoun(copy.id, 'Mann');
  assert.equal(store.getSet('basics').nouns.length, BUILT_IN_SETS[0].nouns.length);
  assert.equal(store.getSet(copy.id).nouns.length, BUILT_IN_SETS[0].nouns.length - 1);
});

test('built-in sets cannot be changed or deleted; deleting the active set falls back', () => {
  const store = createWordSetStore(storage);
  assert.deepEqual(store.addNoun('basics', hund), { code: 'builtIn' });
  store.deleteSet('basics');
  assert.ok(store.getSet('basics'));

  const set = store.createSet('Temp');
  store.deleteSet(set.id);
  assert.equal(store.getSet(set.id), null);
  assert.equal(store.activeSet().id, 'basics');
});

test('broken storage starts fresh', () => {
  storage.setItem('german-grammar:word-sets', '{oops');
  assert.equal(createWordSetStore(storage).activeSet().id, 'basics');
  assert.equal(createWordSetStore(null).activeSet().id, 'basics');
});

test('reports changes', () => {
  const store = createWordSetStore(storage);
  let calls = 0;
  store.onChange(() => calls++);
  store.createSet('A');
  assert.equal(calls, 1);
});
