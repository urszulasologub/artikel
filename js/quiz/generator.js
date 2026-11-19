// Builds quiz questions. Pure logic, no DOM, so it can be tested with Node.

import { NOUNS } from '../data/nouns.js';
import { SENTENCES, SENTENCES_BY_ID } from '../data/sentences.js';
import { CASE_NAMES, articleChoices, getArticle, nounForm } from '../grammar/articles.js';
import { translateSentence } from './translate.js';

export const GAP = '{article} {noun}';
const PLURAL_CHANCE = 0.25;
const MAX_ATTEMPTS = 10;

/**
 * @param {{ cases: string[], articleTypes: string[] }} settings
 * @param {{ rng?: () => number, previousKey?: string | null, nouns?: object[] }} [options]
 * @returns {object | null} null when the word list is empty
 */
export function createQuestion(settings, { rng = Math.random, previousKey = null, nouns = NOUNS } = {}) {
  if (!nouns.length) return null;
  let question;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    question = buildQuestion(settings, rng, nouns);
    if (question.key !== previousKey) break;
  }
  return question;
}

export function checkAnswer(question, input) {
  return normalize(input) === normalize(question.answer);
}

/**
 * Why the answer is right, e.g. "Dativ: "helfen" always takes Dativ. "Kind" is neuter (das Kind), so…".
 * @param {(key: string, params?: object) => string} t translate function from i18n
 */
export function explain(question, t) {
  const { noun, plural } = question;
  const { why } = SENTENCES_BY_ID[question.sentenceId];
  let nounPart = t('explain.gender', {
    word: noun.word,
    gender: t(`genders.${noun.gender}`),
    article: getArticle('definite', 'nom', noun.gender),
  });
  if (noun.gender === 'pl') nounPart = t('explain.pluralOnly', { word: noun.word });
  else if (plural) nounPart = t('explain.plural', { plural: noun.plural });
  return t('explain.sentence', {
    case: CASE_NAMES[question.case],
    reason: t(`why.${why.rule}`, { word: why.word }),
    noun: nounPart,
    answer: question.answer.toLowerCase(),
  });
}

/** The question's sentence in English or Polish, or null when the word has no translation. */
export function translateQuestion(question, language) {
  return translateSentence(SENTENCES_BY_ID[question.sentenceId], question, language);
}

/** Splits a template into the text before and after the gap, with verb forms resolved. */
export function fillTemplate(text, plural) {
  const resolved = text.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_, singular, pluralForm) =>
    plural ? pluralForm : singular,
  );
  const [before, after] = resolved.split(GAP);
  return { before, after };
}

export function matchingNouns(sentence, nouns = NOUNS) {
  return nouns.filter((noun) => noun.tags.some((tag) => sentence.tags.includes(tag)));
}

function buildQuestion(settings, rng, nouns) {
  const grammarCase = pick(settings.cases, rng);
  let articleType = pick(settings.articleTypes, rng);
  // Plural-only words (die Eltern) have no indefinite article. If only such words are left, use der/die/das.
  let usable = nouns.filter((noun) => noun.gender !== 'pl' || hasPluralForm(articleType));
  if (!usable.length) {
    articleType = 'definite';
    usable = nouns;
  }
  // Every kind of noun has sentences in every case (see data tests), so this list is never empty.
  const sentence = pick(SENTENCES.filter((s) => s.case === grammarCase && matchingNouns(s, usable).length), rng);
  const noun = pick(matchingNouns(sentence, usable), rng);

  // Plural-only words are always plural. User-added words may have no plural; they stay singular.
  const plural =
    noun.gender === 'pl' || (hasPluralForm(articleType) && Boolean(noun.plural) && rng() < PLURAL_CHANCE);
  const gender = plural ? 'pl' : noun.gender;

  const { before, after } = fillTemplate(sentence.text, plural);
  const startsSentence = before === '';
  const style = (word) => (startsSentence ? capitalize(word) : word);

  return {
    key: [sentence.id, noun.word, articleType, plural].join('|'),
    sentenceId: sentence.id,
    case: grammarCase,
    articleType,
    noun,
    plural,
    gender,
    before,
    nounText: nounForm(noun, grammarCase, plural),
    after,
    answer: style(getArticle(articleType, grammarCase, gender)),
    choices: articleChoices(articleType).map(style),
  };
}

function hasPluralForm(articleType) {
  return getArticle(articleType, 'nom', 'pl') !== null;
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function normalize(text) {
  return text.trim().toLowerCase();
}
