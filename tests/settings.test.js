import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_SETTINGS, PRESETS, activePreset, applyPreset, sanitize } from '../js/settings.js';

test('presets are detected', () => {
  assert.equal(activePreset(applyPreset(DEFAULT_SETTINGS, 'hard')), 'hard');
  assert.equal(activePreset({ ...applyPreset(DEFAULT_SETTINGS, 'hard'), showGender: true }), 'custom');
});

test('every preset is different, so the active one can be detected', () => {
  for (const id of Object.keys(PRESETS)) assert.equal(activePreset(applyPreset(DEFAULT_SETTINGS, id)), id);
});

test('sanitize drops unknown values and keeps lists non-empty', () => {
  const result = sanitize({ cases: ['dat', 'bogus', 'akk'], articleTypes: [], inputMode: 'voice' });
  assert.deepEqual(result.cases, ['akk', 'dat']);
  assert.deepEqual(result.articleTypes, DEFAULT_SETTINGS.articleTypes);
  assert.equal(result.inputMode, DEFAULT_SETTINGS.inputMode);
  assert.equal(result.askCase, DEFAULT_SETTINGS.askCase);
});
