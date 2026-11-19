// Builds the English or Polish translation of a question's sentence. Pure logic, no DOM.

import { POLISH_CASES, POLISH_NOUNS } from '../data/nouns-pl.js';

const VERB_CHOICE = /\{([^{}|]+)\|([^{}|]+)\}/g;

/**
 * @param {{ en: string, pl: string }} sentence
 * @param {{ noun: object, plural: boolean, articleType: string }} options
 * @param {'en' | 'pl'} language
 * @returns {string | null} null when the noun has no translation in that language (user-added words)
 */
export function translateSentence(sentence, options, language) {
  return language === 'pl' ? translatePolish(sentence.pl, options) : translateEnglish(sentence.en, options);
}

/** "I see {noun}." → "I see the man." */
export function translateEnglish(template, { noun, plural, articleType }) {
  if (!noun.en) return null;
  const phrase = nounPhrase(noun, plural, articleType);
  const text = template
    .replace(VERB_CHOICE, (_, singular, pluralForm) => (plural ? pluralForm : singular))
    .replace("{noun's}", possessive(phrase))
    .replace('{noun}', phrase);
  return capitalize(text);
}

/** "Widzę {acc}." → "Widzę mężczyznę." Only built-in words have Polish forms. */
export function translatePolish(template, { noun, plural }) {
  const entry = POLISH_NOUNS[noun.word];
  const forms = plural ? entry?.pl : entry?.sg;
  if (!forms) return null;
  const verbPlural = plural || Boolean(entry.pluralOnly);
  const text = template
    .replace(VERB_CHOICE, (_, singular, pluralForm) => (verbPlural ? pluralForm : singular))
    .replace(/\{(nom|gen|dat|acc|inst)\}/, (_, polishCase) => forms[POLISH_CASES.indexOf(polishCase)]);
  return capitalize(text);
}

/**
 * The meaning shown next to a word. In Polish, built-in words use their Polish form;
 * user-added words show whatever the user typed as their meaning.
 */
export function nounMeaning(noun, language) {
  const polish = POLISH_NOUNS[noun.word];
  if (language === 'pl' && polish) return (polish.sg ?? polish.pl)[0];
  return noun.en;
}

/** "teacher (m)" → "teacher": removes notes that would give away the gender. */
export function withoutGenderNote(meaning) {
  return meaning.replace(/\s*\((m|f|n)\)/g, '');
}

/** "the man", "a man", "an apple", "the men". */
export function nounPhrase(noun, plural, articleType) {
  const word = plural ? (noun.enPlural ?? `${englishSingular(noun)}s`) : englishSingular(noun);
  if (articleType === 'definite') return `the ${word}`;
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}

/** "the man's", "the men's", "the teachers'". */
function possessive(phrase) {
  return phrase.endsWith('s') ? `${phrase}'` : `${phrase}'s`;
}

// "teacher (m)" → "teacher", "clock, watch" → "clock"
function englishSingular(noun) {
  return noun.en.replace(/\s*\(.*?\)/g, '').split(',')[0].trim();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
