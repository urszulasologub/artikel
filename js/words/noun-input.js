// Turns what a user typed (in the form or a CSV row) into a noun the quiz can use. Pure logic, no DOM.

// What kind of thing a noun is decides which sentences it fits (see sentences.js tags).
// Labels are in the i18n files under "kinds".
export const KINDS = {
  thing: { tag: 'object' },
  person: { tag: 'person' },
  animal: { tag: 'animal' },
  place: { tag: 'place' },
};

// 'pl' is for plural-only words like die Eltern.
const GENDER_INPUTS = { der: 'm', die: 'f', das: 'n', m: 'm', f: 'f', n: 'n', pl: 'pl', plural: 'pl' };

/**
 * @param {{ word: string, gender?: string, kind?: string, plural?: string, genitive?: string,
 *           en?: string, enPlural?: string }} input
 *   `word` may include the article ("der Hund"); then `gender` can be left empty.
 * @returns {{ noun: object } | { error: { code: string, params?: object } }}
 *   error codes match the "errors" keys in the i18n files
 */
export function createNoun({ word = '', gender = '', kind = '', plural = '', genitive = '', en = '', enPlural = '' }) {
  let text = clean(word);
  let genderInput = clean(gender).toLowerCase();

  const withArticle = text.match(/^(der|die|das)\s+(.+)$/i);
  if (withArticle) {
    genderInput ||= withArticle[1].toLowerCase();
    text = withArticle[2];
  }

  if (!text) return { error: { code: 'wordMissing' } };
  if (!/^\p{L}[\p{L}-]*$/u.test(text)) return { error: { code: 'notOneWord', params: { word: text } } };

  const nounGender = GENDER_INPUTS[genderInput];
  if (!nounGender) return { error: { code: 'genderMissing', params: { word: text } } };

  const kindKey = clean(kind).toLowerCase() || 'thing';
  if (!KINDS[kindKey]) return { error: { code: 'unknownKind', params: { kind, kinds: Object.keys(KINDS).join(', ') } } };

  const nounWord = capitalize(text);
  const english = clean(en) || null;
  const tags = [KINDS[kindKey].tag];

  // A plural-only word is its own plural; it has no singular forms.
  if (nounGender === 'pl') {
    return { noun: { word: nounWord, gender: 'pl', plural: nounWord, genitive: nounWord, en: english, enPlural: english, tags } };
  }

  const isMasculineOrNeuter = nounGender === 'm' || nounGender === 'n';
  return {
    noun: {
      word: nounWord,
      gender: nounGender,
      plural: capitalize(clean(plural).replace(/^die\s+/i, '')) || null,
      genitive: isMasculineOrNeuter ? capitalize(clean(genitive)) || guessGenitive(nounWord) : nounWord,
      en: english,
      enPlural: clean(enPlural) || null,
      tags,
    },
  };
}

/** Genitiv singular for der/das nouns: -es after s, ß, x, z or sch, otherwise -s (des Hauses, des Autos). */
export function guessGenitive(word) {
  return /(s|ß|x|z|sch)$/i.test(word) ? `${word}es` : `${word}s`;
}

/** The kind key (thing, person…) for a noun's tag. */
export function kindOf(noun) {
  return Object.keys(KINDS).find((key) => noun.tags.includes(KINDS[key].tag)) ?? 'thing';
}

function clean(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
