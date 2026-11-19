// Saves the current quiz in the browser, so a page refresh continues where you left off.

const STORAGE_KEY = 'german-grammar:progress';
// Bump when the saved shape changes; older saves are then ignored instead of breaking the quiz.
const VERSION = 2;

/** @returns {{ round, streak, question, answered, showSummary } | null} */
export function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}

export function saveProgress({ round, streak, question, answered, showSummary }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, round, streak, question, answered, showSummary }));
  } catch {
    // Storage can be blocked (private mode). The quiz then simply starts fresh after a refresh.
  }
}

function isValid(data) {
  return (
    data?.version === VERSION &&
    Array.isArray(data.round?.results) &&
    Array.isArray(data.round?.retryResults) &&
    Number.isInteger(data.streak) &&
    // The question is null while the chosen word set is empty.
    (data.question === null || typeof data.question?.sentenceId === 'string') &&
    typeof data.answered === 'boolean' &&
    typeof data.showSummary === 'boolean'
  );
}
