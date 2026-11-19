// Article declension tables and noun ending rules.

export const CASES = ['nom', 'akk', 'dat', 'gen'];

export const CASE_NAMES = {
  nom: 'Nominativ',
  akk: 'Akkusativ',
  dat: 'Dativ',
  gen: 'Genitiv',
};

// The question word that finds each case.
export const CASE_QUESTIONS = {
  nom: 'wer? was?',
  akk: 'wen? was?',
  dat: 'wem?',
  gen: 'wessen?',
};

export const GENDERS = ['m', 'f', 'n', 'pl'];

// Endings shared by ein, kein and the possessives (mein, dein, sein, ihr, unser, euer).
const EIN_ENDINGS = {
  nom: { m: '', f: 'e', n: '', pl: 'e' },
  akk: { m: 'en', f: 'e', n: '', pl: 'e' },
  dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
  gen: { m: 'es', f: 'er', n: 'es', pl: 'er' },
};

/**
 * Builds the declension table of an ein-word.
 * @param {string} base the plain form, e.g. "mein"
 * @param {{ stem?: string, plural?: boolean }} [options]
 *   stem: used before an ending, e.g. "eur" for euer (eurem); plural: false for "ein", which has none
 */
export function einWord(base, { stem = base, plural = true } = {}) {
  const forms = {};
  for (const [grammarCase, endings] of Object.entries(EIN_ENDINGS)) {
    forms[grammarCase] = {};
    for (const [gender, ending] of Object.entries(endings)) {
      const exists = gender !== 'pl' || plural;
      forms[grammarCase][gender] = exists ? (ending ? stem + ending : base) : null;
    }
  }
  return forms;
}

// Each article type: a label for settings and its forms. `null` means the form does not exist.
// To add e.g. possessives: { label: 'mein / meine', forms: einWord('mein') }.
// (Sentence translations would then also need to say "my" instead of "a".)
export const ARTICLE_TYPES = {
  definite: {
    label: 'der / die / das',
    forms: {
      nom: { m: 'der', f: 'die', n: 'das', pl: 'die' },
      akk: { m: 'den', f: 'die', n: 'das', pl: 'die' },
      dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
      gen: { m: 'des', f: 'der', n: 'des', pl: 'der' },
    },
  },
  indefinite: {
    label: 'ein / eine',
    forms: einWord('ein', { plural: false }),
  },
};

export function getArticle(articleType, grammarCase, gender) {
  return ARTICLE_TYPES[articleType].forms[grammarCase][gender];
}

/** All distinct forms of one article type, used as answer choices. */
export function articleChoices(articleType) {
  const forms = Object.values(ARTICLE_TYPES[articleType].forms)
    .flatMap((row) => Object.values(row))
    .filter(Boolean);
  return [...new Set(forms)].sort();
}

/** The noun as it appears in a given case: Dativ plural adds -n, Genitiv m/n singular adds -(e)s. */
export function nounForm(noun, grammarCase, plural) {
  if (plural) {
    const form = noun.plural;
    if (grammarCase === 'dat' && !/[ns]$/.test(form)) return `${form}n`;
    return form;
  }
  if (grammarCase === 'gen' && (noun.gender === 'm' || noun.gender === 'n')) return noun.genitive;
  return noun.word;
}
