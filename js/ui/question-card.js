// One question, shared by the Practice tab and Artikel Rush: the sentence with its gap, hints,
// the optional "which case?" step, the answer buttons, and the feedback.
//
// The answer state is a plain object (see newAnswer) owned by the view. pickCase() and submitAnswer()
// update it; the view then plays sounds, keeps score and re-renders.

import { SENTENCES_BY_ID } from '../data/sentences.js';
import { CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { language, t } from '../i18n/index.js';
import { checkAnswer, explain, translateQuestion } from '../quiz/generator.js';
import { nounMeaning, withoutGenderNote } from '../quiz/translate.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';

export function newAnswer(question) {
  return {
    question,
    answered: false,
    userAnswer: '',
    caseAnswer: null,
    // Which word's meaning is shown: 'noun', 'clue' or null.
    lookup: null,
    caseCorrect: true,
    articleCorrect: false,
    correct: false,
    // True only for the render right after an action, so animations don't replay on later re-renders.
    justAnswered: false,
    justPickedCase: false,
  };
}

/** True when the user must name the case before the article (needs more than one case to choose from). */
export function askingCase(settings) {
  return settings.askCase && settings.cases.length > 1;
}

export function awaitingCase(answer, settings) {
  return Boolean(answer.question) && askingCase(settings) && answer.caseAnswer === null && !answer.answered;
}

/** Records the picked case. Returns false when no case is expected right now. */
export function pickCase(answer, settings, grammarCase) {
  if (!awaitingCase(answer, settings)) return false;
  answer.caseAnswer = grammarCase;
  return true;
}

/** Checks the article (and the case, if it was asked). Returns false when the answer can't be taken yet. */
export function submitAnswer(answer, settings, input) {
  if (!answer.question || answer.answered || awaitingCase(answer, settings) || !input.trim()) return false;
  answer.answered = true;
  answer.userAnswer = input.trim();
  answer.articleCorrect = checkAnswer(answer.question, input);
  answer.caseCorrect = !askingCase(settings) || answer.caseAnswer === answer.question.case;
  answer.correct = answer.articleCorrect && answer.caseCorrect;
  return true;
}

/** Shows or hides the meaning of the noun or the clue word (the verb or preposition that decides the case). */
export function toggleLookup(answer, which) {
  answer.lookup = answer.lookup === which ? null : which;
}

/** Right article, wrong case. */
export function isPartial(answer) {
  return !answer.correct && answer.articleCorrect;
}

/** Colour of the answer: green (ok), yellow (partial: right article, wrong case) or red (bad). */
export function resultClass(answer) {
  if (answer.correct) return 'ok';
  return isPartial(answer) ? 'partial' : 'bad';
}

/** Number keys pick a case or an article on desktop. */
export function handleNumberKey(event, answer, settings, handlers) {
  if (!answer.question || answer.answered || event.target instanceof HTMLInputElement) return;
  const index = Number(event.key) - 1;
  if (awaitingCase(answer, settings)) {
    const grammarCase = caseOptions(answer.question, settings)[index];
    if (grammarCase) handlers.pickCase(grammarCase);
  } else {
    const choice = answer.question.choices[index];
    if (choice) handlers.submit(choice);
  }
}

/**
 * The question and answer area, without the view's own header and Continue button.
 * @param {{ pickCase: (grammarCase: string) => void, submit: (input: string) => void,
 *           lookup: (which: 'noun' | 'clue') => void }} handlers
 * @returns {Node[]}
 */
export function renderQuestion(answer, settings, handlers) {
  const { question, answered, articleCorrect, justAnswered } = answer;
  const asking = askingCase(settings);
  const waiting = awaitingCase(answer, settings);
  // With "choose the case first", the case stays hidden until it has been picked.
  const caseKnown = asking ? answer.caseAnswer !== null || answered : settings.showCase;

  const nounClass = settings.showGender || answered ? `noun g-${question.gender}` : 'noun';
  const animation = justAnswered ? (articleCorrect ? ' pop' : ' shake') : '';
  const gap = answered
    ? el('span', { class: `gap filled ${articleCorrect ? 'ok' : 'bad'}${animation}` }, question.answer)
    : el('span', { class: caseKnown ? `gap case-gap c-${question.case}` : 'gap' }, ' ');

  const hints = [
    caseKnown && el('span', { class: `tag case-tag c-${question.case}` },
      CASE_NAMES[question.case], el('span', { class: 'case-q' }, CASE_QUESTIONS[question.case])),
    settings.showGender && el('span', { class: `tag g-${question.gender}` },
      genderMark(question.gender), t(`genders.${question.gender}`)),
  ];

  // The clue word (e.g. "helfe", "mit") and the noun can be tapped to see what they mean.
  const clue = SENTENCES_BY_ID[question.sentenceId].clue;
  const clueText = pickNumber(clue.text, question.plural);
  const clueButton = el('button', {
    type: 'button',
    class: `word-tap clue${answer.lookup === 'clue' ? ' active' : ''}`,
    title: t('quiz.tapHint'),
    'aria-expanded': String(answer.lookup === 'clue'),
    onClick: () => handlers.lookup('clue'),
  }, clueText);
  const [beforeParts, clueUsed] = withClue(question.before, clueText, clueButton);
  const [afterParts] = clueUsed ? [[question.after]] : withClue(question.after, clueText, clueButton);

  const meaning = nounMeaning(question.noun, language);
  const noun = meaning
    ? el('button', {
      type: 'button',
      class: `${nounClass} word-tap${answer.lookup === 'noun' ? ' active' : ''}`,
      title: t('quiz.tapHint'),
      'aria-expanded': String(answer.lookup === 'noun'),
      onClick: () => handlers.lookup('noun'),
    }, question.nounText)
    : el('span', { class: nounClass }, question.nounText);

  return [
    el('p', { class: 'sentence' }, beforeParts, gap, ' ', noun, afterParts),
    answer.lookup && renderWordInfo(answer, settings, clue, meaning),
    answered && renderTranslation(question, 'p'),
    el('div', { class: 'hints' }, hints),
    asking && renderCaseStep(answer, settings, handlers.pickCase),
    !waiting && asking && el('p', { class: 'step-label' }, t('quiz.pickArticle')),
    !waiting && renderChoices(answer, handlers.submit),
    answered && renderFeedback(answer),
  ].filter(Boolean);
}

/** The sentence in the interface language. Words without a translation (user-added) show none. */
export function renderTranslation(question, tag) {
  const translation = translateQuestion(question, language);
  return translation && el(tag, { class: 'translation' }, translation);
}

/** The cases offered as answers. Includes the question's own case, which a retried question may need
 * after the case list was changed in the middle of a round. */
function caseOptions(question, settings) {
  return CASES.filter((grammarCase) => settings.cases.includes(grammarCase) || grammarCase === question.case);
}

/** "ist|sind" → "ist" or "sind", following the noun's number. */
function pickNumber(text, plural) {
  const [singular, pluralForm = singular] = text.split('|');
  return plural ? pluralForm : singular;
}

/** Splits text around the clue word (a whole word) and puts the button in its place. */
function withClue(text, clueText, button) {
  const escaped = clueText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'u').exec(text);
  if (!match) return [[text], false];
  return [[text.slice(0, match.index), button, text.slice(match.index + clueText.length)], true];
}

function renderWordInfo(answer, settings, clue, nounMeaningText) {
  const { question, lookup } = answer;
  if (lookup === 'clue') {
    return el('p', { class: 'word-info' }, el('strong', {}, clue.lemma), ` — ${language === 'pl' ? clue.pl : clue.en}`);
  }
  // When the level hides the gender, the meaning must not give it away: no "(m)", "(f)" or "(plural)".
  if (!settings.showGender) {
    return el('p', { class: 'word-info' }, el('strong', {}, question.nounText), ` — ${withoutGenderNote(nounMeaningText)}`);
  }
  const plural = question.plural ? ` (${t('quiz.wordInfoPlural')})` : '';
  return el('p', { class: 'word-info' }, el('strong', {}, question.nounText), ` — ${nounMeaningText}${plural}`);
}

function renderCaseStep(answer, settings, pickCaseHandler) {
  const { question, caseAnswer, justPickedCase } = answer;
  const buttons = caseOptions(question, settings).map((grammarCase, index) => {
    let status = '';
    if (caseAnswer && grammarCase === question.case) status = ' ok';
    else if (grammarCase === caseAnswer) status = ' bad';
    if (status && justPickedCase) status += ' pop';
    return el('button', {
      type: 'button',
      class: `btn case-choice c-${grammarCase}${status}`,
      disabled: caseAnswer !== null,
      title: t('quiz.key', { n: index + 1 }),
      onClick: () => pickCaseHandler(grammarCase),
    }, CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase]));
  });
  return el('div', { class: 'step' },
    el('p', { class: 'step-label' }, t('quiz.whichCase')),
    el('div', { class: 'case-choices' }, buttons),
  );
}

function renderChoices({ question, answered, userAnswer }, submit) {
  return el('div', { class: 'choices' }, question.choices.map((choice, index) => {
    let status = '';
    if (answered && choice === question.answer) status = ' ok';
    else if (answered && choice === userAnswer) status = ' bad';
    return el('button', {
      type: 'button',
      class: `btn choice${status}`,
      disabled: answered,
      title: t('quiz.key', { n: index + 1 }),
      onClick: () => submit(choice),
    }, choice);
  }));
}

function feedbackTitle({ question, correct, caseCorrect, articleCorrect }) {
  const params = { answer: question.answer, case: CASE_NAMES[question.case] };
  if (correct) return t('feedback.correct');
  if (!caseCorrect && articleCorrect) return t('feedback.wrongCaseRightArticle', params);
  if (!caseCorrect) return t('feedback.wrongCase', params);
  return t('feedback.wrong', params);
}

function renderFeedback(answer) {
  return el('div', { class: `feedback ${resultClass(answer)}` },
    el('strong', {}, feedbackTitle(answer)),
    el('p', {}, explain(answer.question, t)),
  );
}
