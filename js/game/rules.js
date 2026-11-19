// Artikel Rush rules. Change the game by editing the numbers here; the engine reads everything from this file.

export const RULES = {
  // Questions in every round, right or wrong.
  questionsPerRound: 10,

  // Players choose which cases to practise, but must pick at least this many.
  minCases: 2,

  hearts: {
    start: 3,
    max: 3,
    // One heart comes back after every this many right answers (if not full).
    regainEvery: 10,
    // Picking the wrong case costs a heart straight away. A question never costs more than one heart,
    // whatever goes wrong (case, article or time).
    lostForWrongCase: true,
  },

  // Points are multiplied while answering right in a row:
  // ×1.2 from 10 in a row, ×1.4 from 20, … up to `max`. Points are rounded to whole numbers.
  combo: { every: 10, bonus: 0.2, max: 2 },

  // Right article but wrong case: a share of the points, and the combo ends.
  // (The heart for the wrong case is set by hearts.lostForWrongCase.)
  partial: { pointsShare: 0.5 },

  // Where a game can start: `round` is an index into `rounds` below, and `level` names it on the start
  // screen (a difficulty preset). Skipping easy rounds multiplies all points by `bonus` until the first
  // mistake (wrong case, wrong article, half-right or running out of time).
  startLevels: [
    { level: 'easy', round: 0, bonus: 1 },
    { level: 'medium', round: 1, bonus: 1.2 },
    { level: 'hard', round: 2, bonus: 1.5 },
  ],

  // `level` is a difficulty preset from settings.js. `timer` (seconds, plus `bonus` seconds per right
  // answer) is optional. Running out of time costs a heart and restarts the round's timer.
  // `tableMode` overrides the level's grammar table ('open', 'toggle' or 'hidden' = not available).
  rounds: [
    { level: 'easy', articleTypes: ['definite'], points: 10 },
    { level: 'medium', articleTypes: ['definite', 'indefinite'], points: 15 },
    { level: 'hard', articleTypes: ['definite', 'indefinite'], points: 20 },
    { level: 'hard', articleTypes: ['definite', 'indefinite'], points: 25 },
    { level: 'hard', articleTypes: ['definite', 'indefinite'], points: 25, timer: { seconds: 120, bonus: 6 } },
    { level: 'hard', articleTypes: ['definite', 'indefinite'], points: 30, timer: { seconds: 90, bonus: 5 } },
  ],

  // After the last round the game goes on forever: like the last round, with less time each round.
  endless: { secondsLessPerRound: 15, minSeconds: 40, bonus: 4 },

  // Last seconds: a warning (ticking, red timer) and then a gentle screen shake.
  warningSeconds: 10,
  shakeSeconds: 5,
};
