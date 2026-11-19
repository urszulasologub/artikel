// Artikel Rush high scores, saved in the browser (this device only).

const STORAGE_KEY = 'german-grammar:rush-high-scores';
export const MAX_HIGH_SCORES = 10;
export const MAX_NAME_LENGTH = 12;

/**
 * @param {Storage | null} storage null keeps scores in memory only
 */
export function createHighScores(storage) {
  let scores = load(storage);

  return {
    list: () => scores,

    /** True when a score is good enough for the list. */
    qualifies: (score) => score > 0 && (scores.length < MAX_HIGH_SCORES || score > scores.at(-1).score),

    /**
     * Adds a score and keeps the best ones.
     * @returns {number} its position in the list (0 = best), or -1 when it did not make the list
     */
    add({ name, score, round }) {
      const entry = { name: cleanName(name), score, round, date: new Date().toISOString() };
      scores = [...scores, entry].sort((a, b) => b.score - a.score).slice(0, MAX_HIGH_SCORES);
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(scores));
      } catch {
        // Storage full or blocked: the score lasts for this visit only.
      }
      return scores.indexOf(entry);
    },
  };
}

function cleanName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH) || '???';
}

function load(storage) {
  try {
    const data = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data
      .filter((s) => typeof s?.name === 'string' && Number.isFinite(s.score) && Number.isInteger(s.round))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_HIGH_SCORES);
  } catch {
    return [];
  }
}
