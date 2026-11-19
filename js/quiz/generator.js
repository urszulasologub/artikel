// Builds quiz questions. Pure logic, no DOM, so it can be tested with Node.

import { NOUNS } from '../data/nouns.js';
import { SENTENCES } from '../data/sentences.js';
import {
  CASE_NAMES,
  GENDER_NAMES,
  articleChoices,
  getArticle,
  nounForm,
} from '../grammar/articles.js';
import { translate } from './translate.js';

export const GAP = '{article} {noun}';
const PLURAL_CHANCE = 0.25;
const MAX_ATTEMPTS = 10;

/**
 * @param {{ cases: string[], articleTypes: string[] }} settings
 * @param {{ rng?: () => number, previousKey?: string | null }} [options]
 */
export function createQuestion(settings, { rng = Math.random, previousKey = null } = {}) {
  let question;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    question = buildQuestion(settings, rng);
    if (question.key !== previousKey) break;
  }
  return question;
}

export function checkAnswer(question, input) {
  return normalize(input) === normalize(question.answer);
}

export function explain(question) {
  const { noun, plural } = question;
  const nounPart = plural
    ? `"${noun.plural}" is plural`
    : `"${noun.word}" is ${GENDER_NAMES[noun.gender]} (${getArticle('definite', 'nom', noun.gender)} ${noun.word})`;
  return `${CASE_NAMES[question.case]}: ${question.reason} ${nounPart}, so the answer is "${question.answer.toLowerCase()}".`;
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

function buildQuestion(settings, rng) {
  const grammarCase = pick(settings.cases, rng);
  const articleType = pick(settings.articleTypes, rng);
  const sentence = pick(SENTENCES.filter((s) => s.case === grammarCase), rng);
  const noun = pick(matchingNouns(sentence), rng);

  const pluralExists = getArticle(articleType, grammarCase, 'pl') !== null;
  const plural = pluralExists && rng() < PLURAL_CHANCE;
  const gender = plural ? 'pl' : noun.gender;

  const { before, after } = fillTemplate(sentence.text, plural);
  const startsSentence = before === '';
  const style = (word) => (startsSentence ? capitalize(word) : word);

  return {
    key: [sentence.text, noun.word, articleType, plural].join('|'),
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
    reason: sentence.reason,
    translation: translate(sentence.en, { noun, plural, articleType }),
  };
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
