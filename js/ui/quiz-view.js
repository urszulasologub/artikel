// Practice tab: settings panel, question card and the optional grammar table.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS, GENDER_NAMES } from '../grammar/articles.js';
import { checkAnswer, createQuestion, explain } from '../quiz/generator.js';
import { ROUND_LENGTH, createRound, nextRetryQuestion, recordAnswer, roundPhase, summarize } from '../quiz/round.js';
import { loadProgress, saveProgress } from '../progress.js';
import { PRESETS, activePreset, applyPreset, loadSettings, saveSettings } from '../settings.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';
import { playSound } from './sound.js';
import { declensionTable } from './table.js';

const STREAK_MILESTONE = 5;

export function mountQuizView(root) {
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
    showQuestion(createQuestion(state.settings, { previousKey: state.question?.key }));
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
    if (state.answered || awaitingCase(state) || !answer.trim()) return;
    state.answered = true;
    state.userAnswer = answer.trim();
    state.articleCorrect = checkAnswer(state.question, answer);
    state.caseCorrect = !askingCase(state) || state.caseAnswer === state.question.case;
    state.correct = state.articleCorrect && state.caseCorrect;
    state.round = recordAnswer(state.round, state.question, state.correct);
    state.streak = state.correct ? state.streak + 1 : 0;

    if (!state.correct) playSound('wrong');
    else playSound(state.streak % STREAK_MILESTONE === 0 ? 'streak' : 'correct');

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
    }));
    cardSlot.replaceChildren(state.showSummary
      ? renderSummary(state, newRound)
      : renderCard(state, { submit, next, pickCase, newRound }));
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
    if (root.hidden || state.answered || state.showSummary) return;
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
    if (!saved.answered) return showQuestion(saved.question);
    // The shown answer was already counted, so move on to what comes after it.
    if (roundPhase(state.round) === 'done') {
      state.showSummary = true;
      return render();
    }
    return next();
  }

  restore();
}

function renderSettings(settings, update, open, onToggle) {
  const preset = activePreset(settings);

  const presetButtons = Object.entries(PRESETS).map(([id, { label }]) =>
    el('button', {
      type: 'button',
      class: `segment${preset === id ? ' active' : ''}`,
      'aria-pressed': String(preset === id),
      onClick: () => update(applyPreset(settings, id), { newQuestion: true }),
    }, label),
  );
  if (preset === 'custom') presetButtons.push(el('span', { class: 'segment active static' }, 'Custom'));

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
    el('summary', {}, 'Settings'),
    field('Difficulty', el('div', { class: 'segments' }, presetButtons)),
    field('Cases to practise', el('div', { class: 'checks' }, caseBoxes)),
    field('Articles', el('div', { class: 'checks' }, articleBoxes)),
    field('Details', el('div', { class: 'checks' },
      checkbox('Show noun gender', settings.showGender, (checked) => update({ showGender: checked })),
      // Showing the case would give away the answer to "Choose the case first".
      checkbox('Show the case', settings.showCase && !settings.askCase, (checked) => update({ showCase: checked }), {
        disabled: settings.askCase,
        title: settings.askCase ? 'Hidden while "Choose the case first" is on' : null,
      }),
      checkbox('Choose the case first', settings.askCase, (checked) => update({ askCase: checked })),
    )),
    field('Answer by', radios('inputMode', settings.inputMode, [
      ['choice', 'Choosing'],
      ['type', 'Typing'],
    ], (value) => update({ inputMode: value }))),
    field('Grammar table', radios('tableMode', settings.tableMode, [
      ['open', 'Always open'],
      ['toggle', 'Show / hide'],
      ['hidden', 'Hidden'],
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

function awaitingCase(state) {
  return askingCase(state) && state.caseAnswer === null && !state.answered;
}

function renderCard(state, { submit, next, pickCase, newRound }) {
  const { question, settings, answered, correct, articleCorrect, justAnswered } = state;
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
      genderMark(question.gender), GENDER_NAMES[question.gender]),
    el('span', { class: 'meaning' }, `${question.noun.en}${question.plural ? ' (plural)' : ''}`),
  ];

  return el(
    'section',
    { class: 'panel card', 'aria-live': 'polite' },
    renderProgress(state, newRound),
    el('p', { class: 'sentence' }, question.before, gap, ' ', el('span', { class: nounClass }, question.nounText), question.after),
    answered && el('p', { class: 'translation' }, question.translation),
    el('div', { class: 'hints' }, hints),
    asking && renderCaseStep(state, pickCase),
    !waiting && asking && el('p', { class: 'step-label' }, 'Now pick the article'),
    !waiting && (settings.inputMode === 'choice' ? renderChoices(state, submit) : renderTyping(state, submit)),
    answered && renderFeedback(state),
    answered && el('button', { type: 'button', class: `btn primary next${correct ? '' : ' danger'}`, onClick: next },
      nextButtonLabel(state.round)),
  );
}

function nextButtonLabel(round) {
  const phase = roundPhase(round);
  if (phase === 'done') return 'See results';
  if (phase === 'retry' && round.retryResults.length === 0) return 'Retry mistakes';
  return 'Continue';
}

function renderProgress({ round, answered, streak, justAnswered }, newRound) {
  // The retry bar shows once the first retry question is on screen.
  const retrying = round.retryResults.length > 0 || (roundPhase(round) === 'retry' && !answered);
  const results = retrying ? round.retryResults : round.results;
  const length = retrying ? summarize(round).mistakes.length : ROUND_LENGTH;

  const segments = Array.from({ length }, (_, i) => {
    const result = results[i];
    let status = '';
    if (result) status = result.correct ? ' ok' : ' bad';
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
      'aria-label': `${retrying ? 'Retry' : 'Question'} ${position} of ${length}`,
    }, segments),
    streak > 1 && el('span', { class: `streak${hot}${bump}`, title: `${streak} correct in a row` },
      el('span', { class: 'streak-count' }, streak), 'in a row'),
  );
  const label = retrying
    ? el('p', { class: 'retry-banner' }, el('strong', {}, 'Second chance'), ` · mistake ${position} of ${length}`)
    : el('p', { class: 'retry-banner' }, `Question ${position} of ${length}`);
  return el('div', {},
    el('div', { class: 'card-top' },
      label,
      el('button', { type: 'button', class: 'text-btn', onClick: newRound, title: 'Abandon this quiz and start a new one' },
        '↺ New quiz'),
    ),
    row,
  );
}

function renderSummary({ round }, newRound) {
  const { correct, total, mistakes, fixed, stillWrong, weakSpot } = summarize(round);
  const ratio = correct / total;
  let message = 'Keep going, it gets easier.';
  if (ratio === 1) message = 'Perfekt! Not a single mistake.';
  else if (ratio >= 0.8) message = 'Sehr gut! Almost there.';
  else if (ratio >= 0.5) message = 'Gut gemacht. Solid progress.';

  return el('section', { class: 'panel card summary', 'aria-live': 'polite' },
    el('p', { class: 'summary-score' }, el('strong', {}, correct), ` / ${total}`),
    el('p', { class: 'summary-message' }, message),
    mistakes.length > 0 && el('p', { class: 'fixed' },
      fixed === mistakes.length
        ? `You fixed all ${mistakes.length} on the second try.`
        : `Fixed on the second try: ${fixed} of ${mistakes.length}.`),
    weakSpot && el('p', { class: 'weak-spot' },
      'Your weak spot: ', genderMark(weakSpot.gender), ' ', el('strong', { class: `case-text c-${weakSpot.case}` }, weakSpot.label)),
    stillWrong.length > 0 && el('div', { class: 'review' },
      el('h3', {}, 'Still to practise'),
      el('ul', {}, stillWrong.map((q) => el('li', { class: `c-${q.case}` },
        q.before, el('strong', { class: `g-${q.gender}` }, q.answer), ' ', q.nounText, q.after,
        el('span', { class: 'translation' }, q.translation),
      ))),
    ),
    el('button', { type: 'button', class: 'btn primary next', onClick: newRound }, 'New round'),
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
      title: `Key ${index + 1}`,
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
    placeholder: 'Type the article',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    'aria-label': 'Your answer',
  });
  return el('form', {
    class: 'type-form',
    onSubmit: (event) => {
      event.preventDefault();
      submit(input.value);
    },
  }, input, !answered && el('button', { type: 'submit', class: 'btn primary' }, 'Check'));
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
      title: `Key ${index + 1}`,
      onClick: () => pickCase(grammarCase),
    }, CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase]));
  });
  return el('div', { class: 'step' },
    el('p', { class: 'step-label' }, 'Which case is it?'),
    el('div', { class: 'case-choices' }, buttons),
  );
}

function feedbackTitle({ question, correct, caseCorrect, articleCorrect }) {
  const article = `"${question.answer}"`;
  const grammarCase = CASE_NAMES[question.case];
  if (correct) return 'Correct!';
  if (!caseCorrect && articleCorrect) return `Right article, but the case is ${grammarCase}.`;
  if (!caseCorrect) return `Not quite. It's ${grammarCase}, so the answer is ${article}.`;
  return `Not quite. The answer is ${article}.`;
}

function renderFeedback(state) {
  const { question, correct } = state;
  return el('div', { class: `feedback ${correct ? 'ok' : 'bad'}` },
    el('strong', {}, feedbackTitle(state)),
    el('p', {}, explain(question)),
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
        visible ? 'Hide table' : 'Show table'),
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
