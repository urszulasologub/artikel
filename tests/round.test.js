import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ROUND_LENGTH,
  createRound,
  nextRetryQuestion,
  recordAnswer,
  roundPhase,
  summarize,
} from '../js/quiz/round.js';

const q = (grammarCase, gender) => ({ case: grammarCase, gender });

function playMain(answers) {
  let round = createRound();
  for (let i = 0; i < ROUND_LENGTH; i++) {
    const [question, correct] = answers[i] ?? [q('nom', 'm'), true];
    round = recordAnswer(round, question, correct);
  }
  return round;
}

test('perfect round goes straight to done', () => {
  let round = createRound();
  for (let i = 0; i < ROUND_LENGTH; i++) {
    assert.equal(roundPhase(round), 'main');
    round = recordAnswer(round, q('nom', 'm'), true);
  }
  assert.equal(roundPhase(round), 'done');
  assert.equal(nextRetryQuestion(round), null);
});

test('missed questions are asked once more, in order', () => {
  const first = q('dat', 'f');
  const second = q('akk', 'm');
  let round = playMain([[first, false], [second, false]]);

  assert.equal(roundPhase(round), 'retry');
  assert.equal(nextRetryQuestion(round), first);
  round = recordAnswer(round, first, true);
  assert.equal(nextRetryQuestion(round), second);
  round = recordAnswer(round, second, false);
  assert.equal(roundPhase(round), 'done');

  const summary = summarize(round);
  assert.equal(summary.correct, ROUND_LENGTH - 2, 'score counts first tries only');
  assert.equal(summary.fixed, 1);
  assert.deepEqual(summary.stillWrong, [second]);
});

test('summary finds the weak spot', () => {
  const round = playMain([[q('dat', 'f'), false], [q('akk', 'm'), false], [q('dat', 'f'), false]]);
  assert.deepEqual(summarize(round).weakSpot, { case: 'dat', gender: 'f' });
});

test('no weak spot when no mistake repeats', () => {
  const round = playMain([[q('dat', 'f'), false], [q('akk', 'm'), false]]);
  assert.equal(summarize(round).weakSpot, null);
});

test('a half-right answer is still a mistake that comes back in the retry', () => {
  const half = q('dat', 'm');
  const round = recordAnswer(createRound(), half, false, true);
  assert.deepEqual(round.results[0], { question: half, correct: false, partial: true });
  assert.deepEqual(summarize(playMain([[half, false]])).mistakes, [half]);
});
