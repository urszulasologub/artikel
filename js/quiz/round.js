// A round is a fixed number of questions, then one retry of each missed question, then a summary.
// Pure logic, no DOM.

export const ROUND_LENGTH = 10;
const WEAK_SPOT_MIN_MISSES = 2;

export function createRound() {
  return { results: [], retryResults: [] };
}

/** 'main' while asking new questions, 'retry' while re-asking misses, 'done' when finished. */
export function roundPhase(round) {
  if (round.results.length < ROUND_LENGTH) return 'main';
  if (round.retryResults.length < missedQuestions(round).length) return 'retry';
  return 'done';
}

/** The next missed question to ask again, or null outside the retry phase. */
export function nextRetryQuestion(round) {
  return roundPhase(round) === 'retry' ? missedQuestions(round)[round.retryResults.length] : null;
}

export function recordAnswer(round, question, correct) {
  const entry = { question, correct };
  return roundPhase(round) === 'main'
    ? { ...round, results: [...round.results, entry] }
    : { ...round, retryResults: [...round.retryResults, entry] };
}

/**
 * The score counts first tries only. `fixed` counts misses answered right on the retry.
 * `stillWrong` is what to review. The weak spot is the case + gender missed most often
 * (at least twice), e.g. { case: 'dat', gender: 'f' }.
 */
export function summarize(round) {
  const mistakes = missedQuestions(round);

  const counts = new Map();
  for (const q of mistakes) {
    const key = `${q.case}|${q.gender}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const [topKey, topCount] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  const weakSpot = topCount >= WEAK_SPOT_MIN_MISSES ? toWeakSpot(topKey) : null;

  return {
    total: round.results.length,
    correct: round.results.length - mistakes.length,
    mistakes,
    fixed: round.retryResults.filter((r) => r.correct).length,
    stillWrong: round.retryResults.filter((r) => !r.correct).map((r) => r.question),
    weakSpot,
  };
}

function missedQuestions(round) {
  return round.results.filter((r) => !r.correct).map((r) => r.question);
}

function toWeakSpot(key) {
  const [grammarCase, gender] = key.split('|');
  return { case: grammarCase, gender };
}
