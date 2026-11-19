// Practice tab: settings panel, question card and the optional grammar table.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { t } from '../i18n/index.js';
import { createQuestion } from '../quiz/generator.js';
import { ROUND_LENGTH, createRound, nextRetryQuestion, recordAnswer, roundPhase, summarize } from '../quiz/round.js';
import { loadProgress, saveProgress } from '../progress.js';
import { PRESETS, activePreset, applyPreset, loadSettings, saveSettings } from '../settings.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';
import {
  awaitingCase,
  handleNumberKey,
  isPartial,
  newAnswer,
  pickCase,
  renderQuestion,
  renderTranslation,
  resultClass,
  submitAnswer,
  toggleLookup,
} from './question-card.js';
import { setName } from './set-name.js';
import { playSound } from './sound.js';
import { tablePanel } from './table.js';

const STREAK_MILESTONE = 5;

export function mountQuizView(root, { wordSets }) {
  const saved = loadProgress();
  const state = {
    settings: loadSettings(),
    answer: newAnswer(null),
    tableOpen: true,
    settingsOpen: readSettingsOpen(),
    round: saved?.round ?? createRound(),
    showSummary: saved?.showSummary ?? false,
    streak: saved?.streak ?? 0,
  };

  const settingsSlot = el('div');
  const cardSlot = el('div');
  const tableSlot = el('div');
  root.append(settingsSlot, cardSlot, tableSlot);

  function showQuestion(question) {
    state.answer = newAnswer(question);
    render();
  }

  function nextQuestion() {
    const nouns = wordSets.activeSet().nouns;
    showQuestion(createQuestion(state.settings, { previousKey: state.answer.question?.key, nouns }));
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

  function onPickCase(grammarCase) {
    const { answer, settings } = state;
    if (!pickCase(answer, settings, grammarCase)) return;
    playSound(grammarCase === answer.question.case ? 'step' : 'wrong');
    answer.justPickedCase = true;
    render();
    answer.justPickedCase = false;
    cardSlot.querySelector('.choice, .answer-input')?.focus({ preventScroll: true });
  }

  function onSubmit(input) {
    const { answer, settings } = state;
    if (!submitAnswer(answer, settings, input)) return;
    state.round = recordAnswer(state.round, answer.question, answer.correct, isPartial(answer));
    state.streak = answer.correct ? state.streak + 1 : 0;

    // A right article with the wrong case is half right: it gets the success sound, not the "wrong" one.
    if (answer.correct) playSound(state.streak % STREAK_MILESTONE === 0 ? 'streak' : 'correct');
    else playSound(isPartial(answer) ? 'correct' : 'wrong');

    answer.justAnswered = true;
    render();
    answer.justAnswered = false;
    // Focusing Continue makes the browser scroll down to it (and the table). Only do that after a real
    // mistake, when the explanation and table are worth seeing; otherwise keep the page still.
    cardSlot.querySelector('.next')?.focus({ preventScroll: resultClass(answer) !== 'bad' });
  }

  function onLookup(which) {
    toggleLookup(state.answer, which);
    render();
  }

  const handlers = { pickCase: onPickCase, submit: onSubmit, lookup: onLookup };

  function updateSettings(changes, { newQuestion = false } = {}) {
    state.settings = { ...state.settings, ...changes };
    saveSettings(state.settings);
    if (newQuestion) nextQuestion();
    else render();
  }

  function render() {
    const { answer, settings } = state;
    saveProgress({ ...state, question: answer.question, answered: answer.answered });
    settingsSlot.replaceChildren(renderSettings(settings, updateSettings, state.settingsOpen, (open) => {
      state.settingsOpen = open;
      writeSettingsOpen(open);
    }, wordSets));
    let card;
    if (state.showSummary) card = renderSummary(state, newRound);
    else if (!answer.question) card = renderEmptySet(wordSets.activeSet());
    else card = renderCard(state, { handlers, next, newRound });
    cardSlot.replaceChildren(card);
    tableSlot.replaceChildren(tablePanel(settings, answer, state.tableOpen, () => {
      state.tableOpen = !state.tableOpen;
      render();
    }));
    if (settings.inputMode === 'type' && !answer.answered && !awaitingCase(answer, settings)) {
      cardSlot.querySelector('input')?.focus({ preventScroll: true });
    }
  }

  document.addEventListener('keydown', (event) => {
    if (!root.hidden && !state.showSummary) handleNumberKey(event, state.answer, state.settings, handlers);
  });

  // Continue the saved quiz, if there is one.
  function restore() {
    if (!saved) return nextQuestion();
    state.answer = newAnswer(saved.question);
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
    if (!state.showSummary && (switched || !state.answer.question)) nextQuestion();
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

function renderCard(state, { handlers, next, newRound }) {
  const { answer, settings } = state;
  const nextClass = { ok: '', partial: 'warning', bad: 'danger' }[resultClass(answer)];
  return el(
    'section',
    { class: 'panel card', 'aria-live': 'polite' },
    renderProgress(state, newRound),
    renderQuestion(answer, settings, handlers),
    answer.answered && el('button', { type: 'button', class: `btn primary next ${nextClass}`.trim(), onClick: next },
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

function renderProgress({ round, answer, streak }, newRound) {
  const { answered, justAnswered } = answer;
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
