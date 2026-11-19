// Rush tab: Artikel Rush, a game mode. Rounds get harder (see js/game/rules.js), with hearts,
// combos, a timer in later rounds and high scores. The only choice is which cases to practise.

import { CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { answer as answerGame, createGame, multiplier, roundConfig, tick } from '../game/engine.js';
import { MAX_NAME_LENGTH, createHighScores } from '../game/high-scores.js';
import { RULES } from '../game/rules.js';
import { t } from '../i18n/index.js';
import { createQuestion } from '../quiz/generator.js';
import { PRESETS } from '../settings.js';
import { el } from './dom.js';
import {
  awaitingCase,
  handleNumberKey,
  isPartial,
  newAnswer,
  pickCase,
  renderQuestion,
  resultClass,
  submitAnswer,
  toggleLookup,
} from './question-card.js';
import { setName } from './set-name.js';
import { playSound } from './sound.js';
import { tablePanel } from './table.js';

const CASES_KEY = 'german-grammar:rush-cases';
const NAME_KEY = 'german-grammar:rush-name';
// After a pause (another browser tab, a slow device), don't count more than this per frame.
const MAX_FRAME_MS = 250;
// Gap between sounds that follow each other, e.g. "heart lost" then "game over".
const SOUND_GAP_MS = 450;

export function mountRushView(root, { wordSets, storage }) {
  const highScores = createHighScores(storage);
  const state = {
    screen: 'start', // 'start' | 'playing' | 'over'
    cases: loadCases(storage),
    game: null,
    settings: null,
    answer: newAnswer(null),
    tableOpen: true,
    rank: null, // position of the saved score in the high scores
    roundBanner: null, // round number announced above the current question
    // Effects for the next render only: floating labels and one-off animations.
    effects: emptyEffects(),
  };

  // The slot (not the panel inside it) is sticky, so the HUD stays under the header while scrolling.
  const hudSlot = el('div', { class: 'rush-hud-slot' });
  const cardSlot = el('div');
  const tableSlot = el('div');
  root.append(hudSlot, cardSlot, tableSlot);

  // ---------- Game flow ----------

  function start() {
    if (startProblem()) return;
    state.game = createGame();
    state.rank = null;
    state.roundBanner = 0;
    state.screen = 'playing';
    nextQuestion();
    playSound('roundUp');
    startClock();
  }

  /** Difficulty of the current round, from its preset, with the player's cases. */
  function roundSettings() {
    const round = roundConfig(state.game.round);
    return { ...PRESETS[round.level], cases: state.cases, articleTypes: round.articleTypes };
  }

  function nextQuestion() {
    state.settings = roundSettings();
    const nouns = wordSets.activeSet().nouns;
    state.answer = newAnswer(createQuestion(state.settings, { previousKey: state.answer.question?.key, nouns }));
    render();
    if (state.settings.inputMode === 'type' && !awaitingCase(state.answer, state.settings)) {
      cardSlot.querySelector('.answer-input')?.focus({ preventScroll: true });
    }
  }

  function next() {
    if (state.game.over) return showResults();
    if (state.roundBanner !== null) playSound('roundUp');
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
    const result = answer.correct ? 'right' : isPartial(answer) ? 'partial' : 'wrong';
    state.roundBanner = null;
    const step = answerGame(state.game, result);
    state.game = step.game;
    react(step.events, result === 'wrong' ? 'wrong' : 'correct');

    answer.justAnswered = true;
    render();
    answer.justAnswered = false;
    cardSlot.querySelector('.next')?.focus({ preventScroll: resultClass(answer) !== 'bad' });
  }

  function onLookup(which) {
    toggleLookup(state.answer, which);
    render();
  }

  function endGame() {
    state.game = { ...state.game, over: true };
    showResults();
  }

  function showResults() {
    state.screen = 'over';
    stopClock();
    if (highScores.qualifies(state.game.score)) playSound('highScore');
    render();
  }

  function saveScore(name) {
    state.rank = highScores.add({ name, score: state.game.score, round: state.game.round + 1 });
    try {
      storage?.setItem(NAME_KEY, name);
    } catch {
      // Not saved; the name field is just empty next time.
    }
    render();
  }

  /** Turns engine events into sounds, floating labels and animations. */
  function react(events, baseSound) {
    const sounds = [];
    const effects = emptyEffects();
    for (const event of events) {
      if (event.type === 'points') effects.flashes.push({ text: `+${event.points}`, kind: 'points' });
      if (event.type === 'timeBonus') effects.flashes.push({ text: `+${event.seconds} s`, kind: 'time' });
      if (event.type === 'comboUp') {
        effects.comboUp = true;
        sounds.push('comboUp');
      }
      if (event.type === 'heartLost') {
        effects.heartLost = true;
        sounds.push('heartLost');
      }
      if (event.type === 'heartGained') {
        effects.heartGained = true;
        sounds.push('heartGained');
      }
      if (event.type === 'timeOut') {
        effects.timeOut = true;
        effects.flashes.push({ text: t('rush.timeOut'), kind: 'warning' });
        sounds.unshift('timeOut');
      }
      if (event.type === 'roundUp') state.roundBanner = event.round;
      if (event.type === 'gameOver') sounds.push('gameOver');
    }
    // The answer's own sound, unless a bigger moment (combo, heart) already says it.
    if (baseSound && !sounds.length) sounds.push(baseSound);
    sounds.forEach((name, index) => setTimeout(() => playSound(name), index * SOUND_GAP_MS));
    state.effects = effects;
  }

  // ---------- Clock ----------

  let frame = null;
  let lastFrame = null;
  let lastWholeSecond = null;

  function startClock() {
    stopClock();
    lastFrame = null;
    frame = requestAnimationFrame(onFrame);
  }

  function stopClock() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    root.classList.remove('rush-shake');
  }

  // The clock only runs while a question waits for an answer and the game is on screen.
  function clockRunning() {
    const { game, answer, screen } = state;
    return screen === 'playing' && !game.over && game.timeLeft !== null && !answer.answered && !root.hidden && !document.hidden;
  }

  function onFrame(now) {
    frame = requestAnimationFrame(onFrame);
    const elapsed = lastFrame === null ? 0 : Math.min(now - lastFrame, MAX_FRAME_MS);
    lastFrame = now;
    if (!clockRunning()) {
      root.classList.remove('rush-shake');
      return;
    }
    const step = tick(state.game, elapsed);
    state.game = step.game;
    if (step.events.length) {
      react(step.events);
      if (state.game.over) return showResults();
      render();
      return;
    }
    updateTimer();
  }

  /** Updates only the timer, so the rest of the page (and a half-typed answer) stays untouched. */
  function updateTimer() {
    const { game } = state;
    const timer = hudSlot.querySelector('.timer');
    if (!timer || game.timeLeft === null) return;
    const seconds = Math.ceil(game.timeLeft / 1000);
    const full = roundConfig(game.round).timer.seconds * 1000;
    timer.querySelector('.timer-fill').style.width = `${Math.min(100, (game.timeLeft / full) * 100)}%`;
    timer.querySelector('.timer-text').textContent = t('rush.seconds', { seconds });
    timer.classList.toggle('warning', seconds <= RULES.warningSeconds);
    timer.classList.toggle('urgent', seconds <= RULES.shakeSeconds);
    root.classList.toggle('rush-shake', clockRunning() && seconds <= RULES.shakeSeconds);

    if (seconds !== lastWholeSecond && seconds <= RULES.warningSeconds && clockRunning()) {
      playSound(seconds <= RULES.shakeSeconds ? 'tickUrgent' : 'tick');
    }
    lastWholeSecond = seconds;
  }

  // ---------- Drawing ----------

  function render() {
    root.classList.remove('rush-shake');
    if (state.screen === 'start') {
      hudSlot.replaceChildren();
      cardSlot.replaceChildren(renderStart(), renderHighScores(highScores.list(), null));
      tableSlot.replaceChildren();
    } else if (state.screen === 'over') {
      hudSlot.replaceChildren();
      cardSlot.replaceChildren(renderOver(), renderHighScores(highScores.list(), state.rank));
      tableSlot.replaceChildren();
    } else {
      hudSlot.replaceChildren(renderHud());
      cardSlot.replaceChildren(renderCard());
      tableSlot.replaceChildren(tablePanel(state.settings, state.answer, state.tableOpen, () => {
        state.tableOpen = !state.tableOpen;
        render();
      }));
      updateTimer();
    }
    state.effects = emptyEffects();
  }

  function startProblem() {
    if (state.cases.length < RULES.minCases) return t('rush.needCases', { min: RULES.minCases });
    const set = wordSets.activeSet();
    if (!set.nouns.length) return t('rush.emptySet', { name: setName(set) });
    return null;
  }

  function renderStart() {
    const set = wordSets.activeSet();
    const problem = startProblem();
    const caseBoxes = CASES.map((grammarCase) =>
      el('label', { class: `check case-check c-${grammarCase}` },
        el('input', {
          type: 'checkbox',
          checked: state.cases.includes(grammarCase),
          onChange: (event) => {
            const chosen = event.target.checked
              ? [...state.cases, grammarCase]
              : state.cases.filter((c) => c !== grammarCase);
            state.cases = CASES.filter((c) => chosen.includes(c));
            saveCases(storage, state.cases);
            render();
          },
        }),
        CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase])));

    return el('section', { class: 'panel rush-start' },
      el('h2', {}, t('rush.title')),
      el('p', { class: 'hint' }, t('rush.tagline')),
      el('ul', { class: 'rush-rules' }, t('rush.rules').map((rule) => el('li', {}, rule))),
      el('fieldset', { class: 'field' },
        el('legend', {}, t('rush.casesLabel', { min: RULES.minCases })),
        el('div', { class: 'checks' }, caseBoxes)),
      el('p', { class: 'hint' },
        t('rush.words', { name: setName(set), count: t('words.count', { count: set.nouns.length }) }), ' ',
        el('a', { class: 'text-btn', href: '#words' }, t('settings.manage'))),
      problem && el('p', { class: 'form-error' }, problem),
      el('button', { type: 'button', class: 'btn primary rush-start-btn', disabled: Boolean(problem), onClick: start },
        t('rush.start')),
    );
  }

  function renderHud() {
    const { game, effects } = state;
    const round = roundConfig(game.round);
    const factor = multiplier(game.combo);

    const hearts = Array.from({ length: RULES.hearts.max }, (_, i) => {
      let className = i < game.hearts ? 'heart' : 'heart empty';
      if (effects.heartLost && i === game.hearts) className += ' breaking';
      if (effects.heartGained && i === game.hearts - 1) className += ' growing';
      return el('span', { class: className }, '♥');
    });

    return el('section', { class: 'panel rush-hud' },
      el('div', { class: 'hud-row' },
        el('div', { class: 'hearts', role: 'img', 'aria-label': t('rush.hearts', { count: game.hearts }) }, hearts),
        el('div', { class: 'rush-score', 'aria-live': 'polite' },
          el('span', { class: 'score-value' }, game.score),
          el('span', { class: 'score-label' }, t('rush.points')),
          effects.flashes.map(({ text, kind }) => el('span', { class: `flash ${kind}`, 'aria-hidden': 'true' }, text)),
        ),
        factor > 1 && el('span', { class: `combo${effects.comboUp ? ' bump' : ''}`, title: t('quiz.streakTitle', { count: game.combo }) },
          `×${factor}`),
      ),
      el('div', { class: 'hud-row' },
        el('span', { class: 'round-label' },
          t('rush.roundLevel', { n: game.round + 1, level: t(`presets.${round.level}`) }),
          el('span', { class: 'round-progress' }, ` · ${game.answeredInRound}/${RULES.questionsPerRound}`)),
        el('button', { type: 'button', class: 'text-btn', onClick: endGame }, t('rush.endGame')),
      ),
      round.timer && el('div', { class: `timer${effects.timeOut ? ' expired' : ''}` },
        el('div', { class: 'timer-bar' }, el('div', { class: 'timer-fill' })),
        el('span', { class: 'timer-text' })),
    );
  }

  function renderCard() {
    const { answer, settings, game, roundBanner, effects } = state;
    const handlers = { pickCase: onPickCase, submit: onSubmit, lookup: onLookup };
    const nextClass = { ok: '', partial: 'warning', bad: 'danger' }[resultClass(answer)];
    const round = roundBanner !== null && roundConfig(roundBanner);
    return el('section', { class: `panel card rush-card${effects.heartLost ? ' hit' : ''}`, 'aria-live': 'polite' },
      round && el('div', { class: 'round-banner' },
        el('strong', {}, t('rush.roundStart', { n: roundBanner + 1 })),
        el('span', {}, t(`presets.${round.level}`)),
        round.timer && el('span', { class: 'banner-timer' }, t('rush.seconds', { seconds: round.timer.seconds }))),
      renderQuestion(answer, settings, handlers),
      answer.answered && el('button', { type: 'button', class: `btn primary next ${nextClass}`.trim(), onClick: next },
        game.over ? t('quiz.seeResults') : t('quiz.continue')),
    );
  }

  function renderOver() {
    const { game, rank } = state;
    const canSave = rank === null && highScores.qualifies(game.score);
    const nameInput = el('input', {
      type: 'text',
      maxLength: MAX_NAME_LENGTH,
      value: loadName(storage),
      placeholder: t('rush.namePlaceholder'),
      autocomplete: 'nickname',
      'aria-label': t('rush.namePlaceholder'),
    });

    return el('section', { class: 'panel card summary rush-over' },
      el('h2', {}, t('rush.gameOver')),
      el('p', { class: 'summary-score' }, el('strong', {}, game.score), ` ${t('rush.points')}`),
      el('p', { class: 'summary-message' }, t('rush.reached', { round: game.round + 1 })),
      el('p', { class: 'hint' }, t('rush.bestCombo', { count: game.bestCombo })),
      canSave && el('form', {
        class: 'save-score',
        onSubmit: (event) => {
          event.preventDefault();
          saveScore(nameInput.value);
        },
      },
        el('p', { class: 'fixed' }, t('rush.newHighScore')),
        el('div', { class: 'type-form' }, nameInput, el('button', { type: 'submit', class: 'btn primary' }, t('rush.save')))),
      rank !== null && rank >= 0 && el('p', { class: 'fixed' }, t('rush.savedRank', { rank: rank + 1 })),
      el('div', { class: 'set-actions' },
        el('button', { type: 'button', class: 'btn primary', onClick: start }, t('rush.playAgain')),
        el('button', {
          type: 'button',
          class: 'btn',
          onClick: () => {
            state.screen = 'start';
            render();
          },
        }, t('rush.changeCases')),
      ),
    );
  }

  document.addEventListener('keydown', (event) => {
    if (!root.hidden && state.screen === 'playing') {
      handleNumberKey(event, state.answer, state.settings, { pickCase: onPickCase, submit: onSubmit, lookup: onLookup });
    }
  });
  // The start screen shows the active word set; keep it current.
  wordSets.onChange(() => state.screen === 'start' && render());

  render();
}

function renderHighScores(scores, highlight) {
  return el('section', { class: 'panel high-scores' },
    el('h2', {}, t('rush.highScores')),
    scores.length
      ? el('table', { class: 'score-table' },
        el('thead', {}, el('tr', {},
          el('th', {}, '#'), el('th', {}, t('rush.name')), el('th', {}, t('rush.score')), el('th', {}, t('rush.round')))),
        el('tbody', {}, scores.map((entry, index) =>
          el('tr', { class: index === highlight ? 'mine' : '' },
            el('td', {}, index + 1), el('td', {}, entry.name), el('td', {}, entry.score), el('td', {}, entry.round)))))
      : el('p', { class: 'hint' }, t('rush.noScores')),
  );
}

function emptyEffects() {
  return { flashes: [], comboUp: false, heartLost: false, heartGained: false, timeOut: false };
}

function loadCases(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(CASES_KEY) ?? 'null');
    if (Array.isArray(saved)) return CASES.filter((c) => saved.includes(c));
  } catch {
    // Use the default below.
  }
  return ['nom', 'akk', 'dat'];
}

function saveCases(storage, cases) {
  try {
    storage?.setItem(CASES_KEY, JSON.stringify(cases));
  } catch {
    // Not saved; the default cases are used next time.
  }
}

function loadName(storage) {
  try {
    return storage?.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}
