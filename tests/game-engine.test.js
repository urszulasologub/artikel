import assert from 'node:assert/strict';
import { test } from 'node:test';

import { answer, createGame, multiplier, roundConfig, tick } from '../js/game/engine.js';

// Small rules made for the tests, so tuning the real game in rules.js never breaks them.
const RULES = {
  questionsPerRound: 3,
  minCases: 2,
  hearts: { start: 3, max: 3, regainEvery: 4 },
  combo: { every: 2, bonus: 0.5, max: 2 },
  partial: { pointsShare: 0.5 },
  rounds: [
    { level: 'easy', articleTypes: ['definite'], points: 10 },
    { level: 'hard', articleTypes: ['definite'], points: 20, timer: { seconds: 30, bonus: 5 } },
  ],
  endless: { secondsLessPerRound: 10, minSeconds: 15, bonus: 2 },
};

function play(game, results) {
  const events = [];
  for (const result of results) {
    const step = answer(game, result, RULES);
    game = step.game;
    events.push(...step.events);
  }
  return { game, events };
}

const types = (events) => events.map((event) => event.type);

test('a new game starts in the first round with full hearts and no timer', () => {
  const game = createGame(RULES);
  assert.equal(game.round, 0);
  assert.equal(game.hearts, 3);
  assert.equal(game.timeLeft, null);
});

test('right answers score points; the combo multiplier grows and is capped', () => {
  assert.equal(multiplier(0, RULES), 1);
  assert.equal(multiplier(2, RULES), 1.5);
  assert.equal(multiplier(4, RULES), 2);
  assert.equal(multiplier(40, RULES), 2);

  const { game, events } = play(createGame(RULES), ['right', 'right']);
  assert.equal(game.score, 10 + 15); // the second answer reaches ×1.5
  assert.ok(types(events).includes('comboUp'));
});

test('a half-right answer gives half points, keeps hearts and ends the combo', () => {
  const { game } = play(createGame(RULES), ['right', 'partial']);
  assert.equal(game.score, 10 + 5);
  assert.equal(game.hearts, 3);
  assert.equal(game.combo, 0);
});

test('wrong answers cost hearts; losing the last one ends the game', () => {
  const { game, events } = play(createGame(RULES), ['wrong', 'wrong', 'wrong']);
  assert.equal(game.over, true);
  assert.equal(game.hearts, 0);
  assert.deepEqual(types(events).filter((t) => t === 'heartLost').length, 3);
  assert.ok(types(events).includes('gameOver'));
  assert.equal(answer(game, 'right', RULES).game, game, 'nothing changes after game over');
});

test('every few right answers win a heart back, up to the maximum', () => {
  let { game } = play(createGame(RULES), ['wrong']);
  assert.equal(game.hearts, 2);
  ({ game } = play(game, ['right', 'right', 'right', 'right']));
  assert.equal(game.hearts, 3);
});

test('after a round of questions the next round starts, with its timer', () => {
  const { game, events } = play(createGame(RULES), ['right', 'right', 'right']);
  assert.deepEqual(events.at(-1), { type: 'roundUp', round: 1 });
  assert.equal(game.round, 1);
  assert.equal(game.answeredInRound, 0);
  assert.equal(game.timeLeft, 30_000);
});

test('right answers add time; running out costs a heart and restarts the timer', () => {
  let { game } = play(createGame(RULES), ['right', 'right', 'right', 'right']);
  assert.equal(game.timeLeft, 35_000);

  let step = tick(game, 34_000, RULES);
  assert.equal(step.game.timeLeft, 1_000);
  step = tick(step.game, 2_000, RULES);
  assert.deepEqual(types(step.events), ['timeOut', 'heartLost']);
  assert.equal(step.game.hearts, 2);
  assert.equal(step.game.timeLeft, 30_000);
});

test('the timer does nothing in rounds without one', () => {
  const game = createGame(RULES);
  assert.equal(tick(game, 999_999, RULES).game, game);
});

test('endless rounds after the list get less time, down to a minimum', () => {
  assert.equal(roundConfig(2, RULES).timer.seconds, 20);
  assert.equal(roundConfig(3, RULES).timer.seconds, 15);
  assert.equal(roundConfig(9, RULES).timer.seconds, 15);
  assert.equal(roundConfig(9, RULES).timer.bonus, 2);
  assert.equal(roundConfig(9, RULES).points, 20);
});
