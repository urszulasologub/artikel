// Checks the real game rules, so an edit in rules.js can't silently break the game.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ARTICLE_TYPES } from '../js/grammar/articles.js';
import { roundConfig, roundSettings } from '../js/game/engine.js';
import { RULES } from '../js/game/rules.js';
import { PRESETS } from '../js/settings.js';

test('every round uses a known level and known article types, and gives points', () => {
  for (const [index, round] of RULES.rounds.entries()) {
    assert.ok(PRESETS[round.level], `round ${index + 1}: unknown level "${round.level}"`);
    assert.ok(round.articleTypes.length && round.articleTypes.every((type) => ARTICLE_TYPES[type]), `round ${index + 1}: article types`);
    assert.ok(round.points > 0, `round ${index + 1}: points`);
    if (round.timer) assert.ok(round.timer.seconds > 0 && round.timer.bonus >= 0, `round ${index + 1}: timer`);
  }
});

test('the game ends in timed, endless rounds that never go below the minimum time', () => {
  const far = roundConfig(RULES.rounds.length + 50);
  assert.ok(far.timer);
  assert.equal(far.timer.seconds, RULES.endless.minSeconds);
});

test('hearts and combo settings make sense', () => {
  assert.ok(RULES.hearts.start > 0 && RULES.hearts.start <= RULES.hearts.max);
  assert.ok(RULES.combo.max >= 1);
  assert.ok(RULES.minCases >= 1);
});

test('start levels point at real rounds with the same level, and harder starts pay more', () => {
  let previousBonus = 0;
  for (const start of RULES.startLevels) {
    assert.ok(PRESETS[start.level], `start level "${start.level}" is not a difficulty preset`);
    assert.equal(RULES.rounds[start.round]?.level, start.level, `start at "${start.level}" points to another level`);
    assert.ok(start.bonus >= 1 && start.bonus > previousBonus, `start at "${start.level}": bonus must grow`);
    previousBonus = start.bonus;
  }
  assert.equal(RULES.startLevels[0].round, 0);
});

test('from round 3 (Hard) there is no grammar table; rounds 1 and 2 can open it', () => {
  assert.equal(roundSettings(0, ['nom', 'akk']).tableMode, 'toggle');
  assert.equal(roundSettings(1, ['nom', 'akk']).tableMode, 'toggle');
  assert.equal(roundSettings(2, ['nom', 'akk']).tableMode, 'hidden');
  for (let index = 2; index < RULES.rounds.length + 3; index++) {
    assert.equal(roundSettings(index, ['nom', 'akk']).tableMode, 'hidden', `round ${index + 1}`);
  }
});

test('round settings use the round article types and the chosen cases', () => {
  const settings = roundSettings(2, ['dat', 'gen']);
  assert.deepEqual(settings.cases, ['dat', 'gen']);
  assert.deepEqual(settings.articleTypes, ['definite', 'indefinite']);
});
