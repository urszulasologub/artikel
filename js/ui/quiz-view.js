// Practice tab: settings panel, question card and the optional grammar table.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { language, t } from '../i18n/index.js';
import { checkAnswer, createQuestion, explain, translateQuestion } from '../quiz/generator.js';
import { nounMeaning } from '../quiz/translate.js';
import { ROUND_LENGTH, createRound, nextRetryQuestion, recordAnswer, roundPhase, summarize } from '../quiz/round.js';
import { loadProgress, saveProgress } from '../progress.js';
import { PRESETS, activePreset, applyPreset, loadSettings, saveSettings } from '../settings.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';
import { playSound } from './sound.js';
import { declensionTable } from './table.js';
import { setName } from './set-name.js';

const STREAK_MILESTONE = 5;

export function mountQuizView(root, { wordSets }) {
  const saved = loadProgress();
  const state = {
    settings: loadSettings(),
    question: null,
    answered: false,
    userAnswer: '',
    caseAnswer: null,
    caseCorrect: true,
    articleCorrect: false,
    correct: false,
    tableOpen: true,
    settingsOpen: readSettingsOpen(),
    round: saved?.round ?? createRound(),
    showSummary: saved?.showSummary ?? false,
    streak: saved?.streak ?? 0,
    // True only for the render right after answering, so animations don't replay on later re-renders.
    justAnswered: false,
    justPickedCase: false,
  };

  const settingsSlot = el('div');
  const cardSlot = el('div');
  const tableSlot = el('div');
  root.append(settingsSlot, cardSlot, tableSlot);

  function showQuestion(question) {
    state.question = question;
    state.answered = false;
    state.userAnswer = '';
    state.caseAnswer = null;
    render();
  }

  function nextQuestion() {
    const nouns = wordSets.activeSet().nouns;
    showQuestion(createQuestion(state.settings, { previousKey: state.question?.key, nouns }));
  }

  function next() {
    const phase = roundPhase(state.round);
    if (phase === 'main') return nextQuestion();
    if (phase === 'retry') return showQuestion(nextRetryQuestion(state.round));
    state.showSummary = true;
    playSound('roundEnd');
    render();
    cardSlot.querySelector('.next')?.focus();
  }

  function newRound() {
    state.round = createRound();
    state.showSummary = false;
    nextQuestion();
  }

  function pickCase(grammarCase) {
    if (!awaitingCase(state)) return;
    state.caseAnswer = grammarCase;
    playSound(grammarCase === state.question.case ? 'step' : 'wrong');
    state.justPickedCase = true;
    render();
    state.justPickedCase = false;
    cardSlot.querySelector('.choice, .answer-input')?.focus({ preventScroll: true });
  }

  function submit(answer) {
    if (!state.question || state.answered || awaitingCase(state) || !answer.trim()) return;
    state.answered = true;
    state.userAnswer = answer.trim();
    state.articleCorrect = checkAnswer(state.question, answer);
    state.caseCorrect = !askingCase(state) || state.caseAnswer === state.question.case;
    state.correct = state.articleCorrect && state.caseCorrect;
    state.round = recordAnswer(state.round, state.question, state.correct, isPartial(state));
    state.streak = state.correct ? state.streak + 1 : 0;

    // A right article with the wrong case is half right: it gets the success sound, not the "wrong" one.
    if (state.correct) playSound(state.streak % STREAK_MILESTONE === 0 ? 'streak' : 'correct');
    else playSound(isPartial(state) ? 'correct' : 'wrong');

    state.justAnswered = true;
    render();
    state.justAnswered = false;
    cardSlot.querySelector('.next')?.focus();
  }

  function updateSettings(changes, { newQuestion = false } = {}) {
    state.settings = { ...state.settings, ...changes };
    saveSettings(state.settings);
    if (newQuestion) nextQuestion();
    else render();
  }

  function render() {
    saveProgress(state);
    settingsSlot.replaceChildren(renderSettings(state.settings, updateSettings, state.settingsOpen, (open) => {
      state.settingsOpen = open;
      writeSettingsOpen(open);
    }, wordSets));
    let card;
    if (state.showSummary) card = renderSummary(state, newRound);
    else if (!state.question) card = renderEmptySet(wordSets.activeSet());
    else card = renderCard(state, { submit, next, pickCase, newRound });
    cardSlot.replaceChildren(card);
    tableSlot.replaceChildren(renderTable(state, () => {
      state.tableOpen = !state.tableOpen;
      render();
    }));
    if (state.settings.inputMode === 'type' && !state.answered && !awaitingCase(state)) {
      cardSlot.querySelector('input')?.focus({ preventScroll: true });
    }
  }

  // Number keys pick a case or an article on desktop.
  document.addEventListener('keydown', (event) => {
    if (root.hidden || !state.question || state.answered || state.showSummary) return;
    if (event.target instanceof HTMLInputElement) return;
    const index = Number(event.key) - 1;
    if (awaitingCase(state)) {
      const grammarCase = caseOptions(state)[index];
      if (grammarCase) pickCase(grammarCase);
    } else if (state.settings.inputMode === 'choice') {
      const choice = state.question.choices[index];
      if (choice) submit(choice);
    }
  });

  // Continue the saved quiz, if there is one.
  function restore() {
    if (!saved) return nextQuestion();
    state.question = saved.question;
    if (saved.showSummary) return render();
    if (!saved.question) return nextQuestion();
    if (!saved.answered) return showQuestion(saved.question);
    // The shown answer was already counted, so move on to what comes after it.
    if (roundPhase(state.round) === 'done') {
      state.showSummary = true;
      return render();
    }
    return next();
  }

  // Follow the Words tab: a different set (or the first word in an empty set) starts a new question.
  let currentSetId = wordSets.activeSet().id;
  wordSets.onChange(() => {
    const switched = wordSets.activeSet().id !== currentSetId;
    currentSetId = wordSets.activeSet().id;
    if (!state.showSummary && (switched || !state.question)) nextQuestion();
    else render();
  });

  restore();
}

function renderSettings(settings, update, open, onToggle, wordSets) {
  const preset = activePreset(settings);

  const presetButtons = Object.keys(PRESETS).map((id) =>
    el('button', {
      type: 'button',
      class: `segment${preset === id ? ' active' : ''}`,
      'aria-pressed': String(preset === id),
      onClick: () => update(applyPreset(settings, id), { newQuestion: true }),
    }, t(`presets.${id}`)),
  );
  if (preset === 'custom') presetButtons.push(el('span', { class: 'segment active static' }, t('presets.custom')));

  const caseBoxes = CASES.map((grammarCase) =>
    checkbox([CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase])], settings.cases.includes(grammarCase), (checked) =>
      update({ cases: toggleInList(CASES, settings.cases, grammarCase, checked) }, { newQuestion: true }),
    { className: `case-check c-${grammarCase}` }),
  );

  const articleBoxes = Object.entries(ARTICLE_TYPES).map(([id, { label }]) =>
    checkbox(label, settings.articleTypes.includes(id), (checked) =>
      update(
        { articleTypes: toggleInList(Object.keys(ARTICLE_TYPES), settings.articleTypes, id, checked) },
        { newQuestion: true },
      ),
    ),
  );

  return el(
    'details',
    { class: 'panel settings', open, onToggle: (event) => onToggle(event.target.open) },
    el('summary', {}, t('settings.title')),
    field(t('settings.difficulty'), el('div', { class: 'segments' }, presetButtons)),
    field(t('settings.words'), el('div', { class: 'set-picker' },
      el('select', {
        'aria-label': t('settings.wordSet'),
        onChange: (event) => wordSets.selectSet(event.target.value),
      }, wordSets.listSets().map((set) =>
        el('option', { value: set.id, selected: set.id === wordSets.activeSet().id },
          `${setName(set)} (${set.nouns.length})`))),
      el('a', { class: 'text-btn', href: '#words' }, t('settings.manage')),
    )),
    field(t('settings.cases'), el('div', { class: 'checks' }, caseBoxes)),
    field(t('settings.articles'), el('div', { class: 'checks' }, articleBoxes)),
    field(t('settings.details'), el('div', { class: 'checks' },
      checkbox(t('settings.showGender'), settings.showGender, (checked) => update({ showGender: checked })),
      // Showing the case would give away the answer to "Choose the case first".
      checkbox(t('settings.showCase'), settings.showCase && !settings.askCase, (checked) => update({ showCase: checked }), {
        disabled: settings.askCase,
        title: settings.askCase ? t('settings.showCaseDisabled') : null,
      }),
      checkbox(t('settings.askCase'), settings.askCase, (checked) => update({ askCase: checked })),
    )),
    field(t('settings.answerBy'), radios('inputMode', settings.inputMode, [
      ['choice', t('settings.choosing')],
      ['type', t('settings.typing')],
    ], (value) => update({ inputMode: value }))),
    field(t('settings.table'), radios('tableMode', settings.tableMode, [
      ['open', t('settings.tableOpen')],
      ['toggle', t('settings.tableToggle')],
      ['hidden', t('settings.tableHidden')],
    ], (value) => update({ tableMode: value }))),
  );
}

/** True when the user must name the case before the article (needs more than one case to choose from). */
function askingCase({ settings }) {
  return settings.askCase && settings.cases.length > 1;
}

/** The cases offered as answers. Includes the question's own case, which a retried question may need
 * after the case list was changed in the middle of a round. */
function caseOptions({ settings, question }) {
  return CASES.filter((grammarCase) => settings.cases.includes(grammarCase) || grammarCase === question.case);
}

/** Right article, wrong case. */
function isPartial({ correct, articleCorrect }) {
  return !correct && articleCorrect;
}

/** Colour of the answer: green (ok), yellow (partial: right article, wrong case) or red (bad). */
function resultClass(state) {
  if (state.correct) return 'ok';
  return isPartial(state) ? 'partial' : 'bad';
}

function awaitingCase(state) {
  return askingCase(state) && state.caseAnswer === null && !state.answered;
}

function renderCard(state, { submit, next, pickCase, newRound }) {
  const { question, settings, answered, articleCorrect, justAnswered } = state;
  const asking = askingCase(state);
  const waiting = awaitingCase(state);
  // With "choose the case first", the case stays hidden until it has been picked.
  const caseKnown = asking ? state.caseAnswer !== null || answered : settings.showCase;

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
    renderMeaning(question),
  ];

  return el(
    'section',
    { class: 'panel card', 'aria-live': 'polite' },
    renderProgress(state, newRound),
    el('p', { class: 'sentence' }, question.before, gap, ' ', el('span', { class: nounClass }, question.nounText), question.after),
    answered && renderTranslation(question, 'p'),
    el('div', { class: 'hints' }, hints),
    asking && renderCaseStep(state, pickCase),
    !waiting && asking && el('p', { class: 'step-label' }, t('quiz.pickArticle')),
    !waiting && (settings.inputMode === 'choice' ? renderChoices(state, submit) : renderTyping(state, submit)),
    answered && renderFeedback(state),
    answered && el('button', { type: 'button', class: `btn primary next ${{ ok: '', partial: 'warning', bad: 'danger' }[resultClass(state)]}`.trim(), onClick: next },
      nextButtonLabel(state.round)),
  );
}

function nextButtonLabel(round) {
  const phase = roundPhase(round);
  if (phase === 'done') return t('quiz.seeResults');
  if (phase === 'retry' && round.retryResults.length === 0) return t('quiz.retryMistakes');
  return t('quiz.continue');
}

function renderEmptySet(set) {
  return el('section', { class: 'panel card empty-set' },
    el('h3', {}, t('quiz.emptyTitle', { name: setName(set) })),
    el('p', {}, t('quiz.emptyText')),
    el('a', { class: 'btn primary', href: '#words' }, t('quiz.addWords')),
  );
}

function renderProgress({ round, answered, streak, justAnswered }, newRound) {
  // The retry bar shows once the first retry question is on screen.
  const retrying = round.retryResults.length > 0 || (roundPhase(round) === 'retry' && !answered);
  const results = retrying ? round.retryResults : round.results;
  const length = retrying ? summarize(round).mistakes.length : ROUND_LENGTH;

  const segments = Array.from({ length }, (_, i) => {
    const result = results[i];
    let status = '';
    if (result) status = result.correct ? ' ok' : result.partial ? ' partial' : ' bad';
    else if (i === results.length && !answered) status = ' current';
    return el('span', { class: `segment-bar${status}` });
  });
  const position = Math.min(results.length + (answered ? 0 : 1), length);

  const hot = streak >= STREAK_MILESTONE ? ' hot' : '';
  const bump = justAnswered && streak > 1 ? ' bump' : '';
  const row = el('div', { class: 'progress-row' },
    el('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': String(length),
      'aria-valuenow': String(results.length),
      'aria-label': t(retrying ? 'quiz.retry' : 'quiz.question', { position, total: length }),
    }, segments),
    streak > 1 && el('span', { class: `streak${hot}${bump}`, title: t('quiz.streakTitle', { count: streak }) },
      el('span', { class: 'streak-count' }, streak), t('quiz.inARow')),
  );
  const label = retrying
    ? el('p', { class: 'retry-banner' }, el('strong', {}, t('quiz.secondChance')),
      ` · ${t('quiz.mistake', { position, total: length })}`)
    : el('p', { class: 'retry-banner' }, t('quiz.question', { position, total: length }));
  return el('div', {},
    el('div', { class: 'card-top' },
      label,
      el('button', { type: 'button', class: 'text-btn', onClick: newRound, title: t('quiz.newQuizTitle') },
        t('quiz.newQuiz')),
    ),
    row,
  );
}

function renderSummary({ round }, newRound) {
  const { correct, total, mistakes, fixed, stillWrong, weakSpot } = summarize(round);
  const ratio = correct / total;
  let message = t('summary.keepGoing');
  if (ratio === 1) message = t('summary.perfect');
  else if (ratio >= 0.8) message = t('summary.great');
  else if (ratio >= 0.5) message = t('summary.good');

  return el('section', { class: 'panel card summary', 'aria-live': 'polite' },
    el('p', { class: 'summary-score' }, el('strong', {}, correct), ` / ${total}`),
    el('p', { class: 'summary-message' }, message),
    mistakes.length > 0 && el('p', { class: 'fixed' },
      fixed === mistakes.length
        ? t('summary.fixedAll', { count: fixed })
        : t('summary.fixedSome', { fixed, total: mistakes.length })),
    weakSpot && el('p', { class: 'weak-spot' },
      `${t('summary.weakSpot')} `, genderMark(weakSpot.gender), ' ',
      el('strong', { class: `case-text c-${weakSpot.case}` },
        t('summary.weakSpotLabel', { case: CASE_NAMES[weakSpot.case], gender: t(`genders.${weakSpot.gender}`) }))),
    stillWrong.length > 0 && el('div', { class: 'review' },
      el('h3', {}, t('summary.stillToPractise')),
      el('ul', {}, stillWrong.map((q) => el('li', { class: `c-${q.case}` },
        q.before, el('strong', { class: `g-${q.gender}` }, q.answer), ' ', q.nounText, q.after,
        renderTranslation(q, 'span'),
      ))),
    ),
    el('button', { type: 'button', class: 'btn primary next', onClick: newRound }, t('summary.newRound')),
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

function renderTyping({ answered, userAnswer, correct }, submit) {
  const input = el('input', {
    type: 'text',
    class: `answer-input${answered ? (correct ? ' ok' : ' bad') : ''}`,
    value: userAnswer,
    disabled: answered,
    placeholder: t('quiz.typePlaceholder'),
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

function renderCaseStep(state, pickCase) {
  const { question, caseAnswer, justPickedCase } = state;
  const buttons = caseOptions(state).map((grammarCase, index) => {
    let status = '';
    if (caseAnswer && grammarCase === question.case) status = ' ok';
    else if (grammarCase === caseAnswer) status = ' bad';
    if (status && justPickedCase) status += ' pop';
    return el('button', {
      type: 'button',
      class: `btn case-choice c-${grammarCase}${status}`,
      disabled: caseAnswer !== null,
      title: t('quiz.key', { n: index + 1 }),
      onClick: () => pickCase(grammarCase),
    }, CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase]));
  });
  return el('div', { class: 'step' },
    el('p', { class: 'step-label' }, t('quiz.whichCase')),
    el('div', { class: 'case-choices' }, buttons),
  );
}

function feedbackTitle({ question, correct, caseCorrect, articleCorrect }) {
  const params = { answer: question.answer, case: CASE_NAMES[question.case] };
  if (correct) return t('feedback.correct');
  if (!caseCorrect && articleCorrect) return t('feedback.wrongCaseRightArticle', params);
  if (!caseCorrect) return t('feedback.wrongCase', params);
  return t('feedback.wrong', params);
}

/** The sentence in the interface language. Words without a translation (user-added) show none. */
function renderTranslation(question, tag) {
  const translation = translateQuestion(question, language);
  return translation && el(tag, { class: 'translation' }, translation);
}

function renderMeaning(question) {
  const meaning = nounMeaning(question.noun, language);
  return meaning && el('span', { class: 'meaning' }, `${meaning}${question.plural ? ` (${t('quiz.plural')})` : ''}`);
}

function renderFeedback(state) {
  const { question, correct } = state;
  return el('div', { class: `feedback ${resultClass(state)}` },
    el('strong', {}, feedbackTitle(state)),
    el('p', {}, explain(question, t)),
  );
}

function renderTable({ settings, question, answered, tableOpen }, toggle) {
  if (settings.tableMode === 'hidden') return el('div');

  const visible = settings.tableMode === 'open' || tableOpen;
  const highlight = answered ? { case: question.case, gender: question.gender } : null;
  const tables = settings.articleTypes.map((type) => declensionTable(type, settings.cases, highlight));

  return el('section', { class: 'panel' },
    settings.tableMode === 'toggle' &&
      el('button', { type: 'button', class: 'btn', 'aria-expanded': String(visible), onClick: toggle },
        visible ? t('quiz.hideTable') : t('quiz.showTable')),
    visible && el('div', { class: 'tables' }, tables),
  );
}

function field(label, control) {
  return el('fieldset', { class: 'field' }, el('legend', {}, label), control);
}

function checkbox(label, checked, onChange, { className = '', disabled = false, title = null } = {}) {
  return el('label', { class: `check ${className}`.trim(), title },
    el('input', { type: 'checkbox', checked, disabled, onChange: (event) => onChange(event.target.checked) }),
    label,
  );
}

function radios(name, current, options, onChange) {
  return el('div', { class: 'checks' }, options.map(([value, label]) =>
    el('label', { class: 'check' },
      el('input', { type: 'radio', name, value, checked: current === value, onChange: () => onChange(value) }),
      label,
    ),
  ));
}

/** Adds or removes an item, keeps the original order, and never leaves the list empty. */
function toggleInList(order, list, item, add) {
  const next = add ? [...list, item] : list.filter((x) => x !== item);
  return next.length ? order.filter((x) => next.includes(x)) : list;
}

// The settings panel remembers if it was open. It starts open on the first visit.
const SETTINGS_OPEN_KEY = 'german-grammar:settings-open';

function readSettingsOpen() {
  try {
    return localStorage.getItem(SETTINGS_OPEN_KEY) !== '0';
  } catch {
    return true;
  }
}

function writeSettingsOpen(open) {
  try {
    localStorage.setItem(SETTINGS_OPEN_KEY, open ? '1' : '0');
  } catch {
    // Not saved; the panel just opens again next time.
  }
}
