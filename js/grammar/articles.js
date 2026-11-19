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

// `null` means the form does not exist (there is no plural of "ein").
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
    forms: {
      nom: { m: 'ein', f: 'eine', n: 'ein', pl: null },
      akk: { m: 'einen', f: 'eine', n: 'ein', pl: null },
      dat: { m: 'einem', f: 'einer', n: 'einem', pl: null },
      gen: { m: 'eines', f: 'einer', n: 'eines', pl: null },
    },
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
