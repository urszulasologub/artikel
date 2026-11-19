// One question, shared by the Practice tab and Artikel Rush: the sentence with its gap, hints,
// the optional "which case?" step, the answer buttons or typing box, and the feedback.
//
// The answer state is a plain object (see newAnswer) owned by the view. pickCase() and submitAnswer()
// update it; the view then plays sounds, keeps score and re-renders.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { language, t } from '../i18n/index.js';
import { checkAnswer, explain, translateQuestion } from '../quiz/generator.js';
import { nounMeaning } from '../quiz/translate.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';

export function newAnswer(question) {
  return {
    question,
    answered: false,
    userAnswer: '',
    caseAnswer: null,
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
  } else if (settings.inputMode === 'choice') {
    const choice = answer.question.choices[index];
    if (choice) handlers.submit(choice);
  }
}

/**
 * The question and answer area, without the view's own header and Continue button.
 * @param {{ pickCase: (grammarCase: string) => void, submit: (input: string) => void }} handlers
 * @returns {Node[]}
 */
export function renderQuestion(answer, settings, handlers) {
  const { question, answered, articleCorrect, justAnswered } = answer;
  const asking = askingCase(settings);
  const waiting = awaitingCase(answer, settings);
  // With "choose the case first", the case stays hidden until it has been picked.
  const caseKnown = asking ? answer.caseAnswer !== null || answered : settings.showCase;
  const typing = settings.inputMode === 'type';

  const nounClass = settings.showGender || answered ? `noun g-${question.gender}` : 'noun';
  const animation = justAnswered ? (articleCorrect ? ' pop' : ' shake') : '';
  const gap = answered
    ? el('span', { class: `gap filled ${articleCorrect ? 'ok' : 'bad'}${animation}` }, question.answer)
    : el('span', { class: caseKnown ? `gap case-gap c-${question.case}` : 'gap' }, ' ');
  // When typing, say which word to put in the gap ("Ich helfe ___ (ein) Bruder"), like a textbook.
  const hint = typing && !answered && el('span', { class: 'gap-hint' }, `(${ARTICLE_TYPES[question.articleType].hint})`);

  const hints = [
    caseKnown && el('span', { class: `tag case-tag c-${question.case}` },
      CASE_NAMES[question.case], el('span', { class: 'case-q' }, CASE_QUESTIONS[question.case])),
    settings.showGender && el('span', { class: `tag g-${question.gender}` },
      genderMark(question.gender), t(`genders.${question.gender}`)),
    renderMeaning(question),
  ];

  return [
    el('p', { class: 'sentence' },
      question.before, gap, hint && ' ', hint, ' ', el('span', { class: nounClass }, question.nounText), question.after),
    answered && renderTranslation(question, 'p'),
    el('div', { class: 'hints' }, hints),
    asking && renderCaseStep(answer, settings, handlers.pickCase),
    !waiting && asking && el('p', { class: 'step-label' }, t('quiz.pickArticle')),
    !waiting && (typing ? renderTyping(answer, handlers.submit) : renderChoices(answer, handlers.submit)),
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

function renderMeaning(question) {
  const meaning = nounMeaning(question.noun, language);
  return meaning && el('span', { class: 'meaning' }, `${meaning}${question.plural ? ` (${t('quiz.plural')})` : ''}`);
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

function renderTyping({ question, answered, userAnswer, articleCorrect }, submit) {
  const input = el('input', {
    type: 'text',
    class: `answer-input${answered ? (articleCorrect ? ' ok' : ' bad') : ''}`,
    value: userAnswer,
    disabled: answered,
    placeholder: t('quiz.typePlaceholder', { hint: ARTICLE_TYPES[question.articleType].hint }),
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    'aria-label': t('quiz.yourAnswer'),
  });
  return el('form', {
    class: 'type-form',
    onSubmit: (event) => {
      event.preventDefault();
      submit(input.value);
    },
  }, input, !answered && el('button', { type: 'submit', class: 'btn primary' }, t('quiz.check')));
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
