// Artikel Rush game logic. Pure: no DOM and no real timers. The view calls answer() after each answer
// and tick() with the time that passed, and reacts to the returned events (sounds, animations).
//
// Events: { type: 'points', points }, 'comboUp' (multiplier), 'timeBonus' (seconds), 'heartLost',
// 'heartGained', 'timeOut', 'roundUp' (round), 'gameOver'.

import { RULES } from './rules.js';

export function createGame(rules = RULES) {
  return withRound({
    over: false,
    round: 0, // index into rules.rounds; past the end means an endless round
    answeredInRound: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    rightAnswers: 0,
    hearts: rules.hearts.start,
    timeLeft: null, // milliseconds, or null when the round has no timer
  }, 0, rules);
}

/** The settings of a round. Rounds past the list repeat the last one, with less time each round. */
export function roundConfig(index, rules = RULES) {
  if (index < rules.rounds.length) return rules.rounds[index];
  const last = rules.rounds.at(-1);
  const extraRounds = index - rules.rounds.length + 1;
  const { secondsLessPerRound, minSeconds, bonus } = rules.endless;
  const seconds = Math.max(minSeconds, (last.timer?.seconds ?? minSeconds) - extraRounds * secondsLessPerRound);
  return { ...last, timer: { seconds, bonus } };
}

/** Points multiplier for a number of right answers in a row, e.g. 1.2 for 10. */
export function multiplier(combo, rules = RULES) {
  const steps = Math.floor(combo / rules.combo.every);
  return Math.min(rules.combo.max, Math.round((1 + steps * rules.combo.bonus) * 10) / 10);
}

/**
 * @param {'right' | 'partial' | 'wrong'} result
 * @returns {{ game: object, events: object[] }}
 */
export function answer(game, result, rules = RULES) {
  if (game.over) return { game, events: [] };
  const round = roundConfig(game.round, rules);
  const events = [];
  let next = { ...game, answeredInRound: game.answeredInRound + 1 };

  if (result === 'right') {
    const before = multiplier(next.combo, rules);
    next.combo += 1;
    next.bestCombo = Math.max(next.bestCombo, next.combo);
    const factor = multiplier(next.combo, rules);
    if (factor > before) events.push({ type: 'comboUp', multiplier: factor });
    next = addPoints(next, round.points * factor, events);

    if (round.timer) {
      next.timeLeft += round.timer.bonus * 1000;
      events.push({ type: 'timeBonus', seconds: round.timer.bonus });
    }
    next.rightAnswers += 1;
    if (next.rightAnswers % rules.hearts.regainEvery === 0 && next.hearts < rules.hearts.max) {
      next.hearts += 1;
      events.push({ type: 'heartGained' });
    }
  } else if (result === 'partial') {
    next.combo = 0;
    next = addPoints(next, round.points * rules.partial.pointsShare, events);
  } else {
    next.combo = 0;
    next = loseHeart(next, events);
  }

  if (!next.over && next.answeredInRound >= rules.questionsPerRound) {
    next = withRound(next, next.round + 1, rules);
    events.push({ type: 'roundUp', round: next.round });
  }
  return { game: next, events };
}

/** Counts down the round's timer. Running out costs a heart and restarts the timer. */
export function tick(game, elapsedMs, rules = RULES) {
  if (game.over || game.timeLeft === null) return { game, events: [] };
  const timeLeft = game.timeLeft - elapsedMs;
  if (timeLeft > 0) return { game: { ...game, timeLeft }, events: [] };

  const events = [{ type: 'timeOut' }];
  let next = loseHeart({ ...game, combo: 0 }, events);
  next.timeLeft = next.over ? 0 : roundConfig(next.round, rules).timer.seconds * 1000;
  return { game: next, events };
}

function withRound(game, index, rules) {
  const { timer } = roundConfig(index, rules);
  return { ...game, round: index, answeredInRound: 0, timeLeft: timer ? timer.seconds * 1000 : null };
}

function addPoints(game, rawPoints, events) {
  const points = Math.round(rawPoints);
  events.push({ type: 'points', points });
  return { ...game, score: game.score + points };
}

function loseHeart(game, events) {
  const hearts = game.hearts - 1;
  events.push({ type: 'heartLost' });
  if (hearts > 0) return { ...game, hearts };
  events.push({ type: 'gameOver' });
  return { ...game, hearts: 0, over: true };
}
