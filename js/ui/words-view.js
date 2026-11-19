// Words tab: pick, create, copy, delete, import and export word sets, and add or remove words.

import { getArticle } from '../grammar/articles.js';
import { language, t } from '../i18n/index.js';
import { nounMeaning } from '../quiz/translate.js';
import { parseCsv, toCsv } from '../words/csv.js';
import { KINDS, createNoun } from '../words/noun-input.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';
import { setName } from './set-name.js';

const FILTERS = [
  ['all', () => t('words.all')],
  ['m', () => 'der'],
  ['f', () => 'die'],
  ['n', () => 'das'],
  ['pl', () => t('words.pluralOnly')],
];
const MAX_ERRORS_SHOWN = 5;

export function mountWordsView(root, { wordSets }) {
  const state = { filter: 'all', hideArticles: false, message: null };

  const setSlot = el('div');
  const formSlot = el('div');
  const listSlot = el('div');
  const fileInput = el('input', { type: 'file', accept: '.csv,text/csv', hidden: true, onChange: importFile });
  root.append(setSlot, formSlot, listSlot, fileInput);

  function render() {
    const set = wordSets.activeSet();
    setSlot.replaceChildren(renderSetPanel(set));
    formSlot.replaceChildren(set.builtIn ? '' : renderAddForm(set));
    listSlot.replaceChildren(renderList(set));
  }

  function act(action, message = null) {
    state.message = message;
    action();
    render();
  }

  function renderSetPanel(set) {
    const select = el('select', {
      id: 'word-set-select',
      onChange: (event) => act(() => wordSets.selectSet(event.target.value)),
    }, wordSets.listSets().map((s) =>
      el('option', { value: s.id, selected: s.id === set.id }, s.builtIn ? t('words.builtIn', { name: setName(s) }) : s.name),
    ));

    const nameField = set.builtIn
      ? el('p', { class: 'hint' }, t('words.builtInHint'))
      : el('label', { class: 'field-label' }, t('words.name'),
        el('input', {
          type: 'text',
          value: set.name,
          maxLength: 60,
          onChange: (event) => act(() => wordSets.renameSet(set.id, event.target.value)),
        }));

    return el('section', { class: 'panel set-panel' },
      el('h2', {}, t('words.title')),
      el('label', { class: 'field-label' }, t('words.practiseWith'), select),
      el('p', { class: 'hint' }, t('words.count', { count: set.nouns.length })),
      nameField,
      el('div', { class: 'set-actions' },
        el('button', { type: 'button', class: 'btn', onClick: () => act(() => wordSets.createSet(t('words.defaultSetName'))) },
          t('words.newSet')),
        el('button', { type: 'button', class: 'btn', onClick: () => act(() => wordSets.copySet(set.id, `${setName(set)} ${t('words.copySuffix')}`)) },
          t('words.copySet')),
        el('button', { type: 'button', class: 'btn', onClick: () => exportSet(set), disabled: !set.nouns.length },
          t('words.exportCsv')),
        el('button', { type: 'button', class: 'btn', onClick: () => fileInput.click() }, t('words.importCsv')),
        !set.builtIn && el('button', { type: 'button', class: 'btn danger-outline', onClick: () => deleteSet(set) },
          t('words.deleteSet')),
      ),
      renderMessage(state.message),
      el('details', { class: 'csv-help' },
        el('summary', {}, t('words.csvFormat')),
        el('p', {}, t('words.csvHelp')),
        el('pre', {}, 'word,gender,kind,plural,english\nHund,der,animal,Hunde,dog\nLampe,die,thing,Lampen,lamp'),
      ),
    );
  }

  function renderAddForm(set) {
    const error = el('p', { class: 'form-error', role: 'alert' });
    const genderPills = el('div', { class: 'pills', role: 'radiogroup', 'aria-label': t('words.gender') },
      ['m', 'f', 'n', 'pl'].map((gender) =>
        el('label', { class: `pill g-${gender}` },
          el('input', { type: 'radio', name: 'gender', value: gender }),
          genderMark(gender), gender === 'pl' ? t('words.pluralOnly') : getArticle('definite', 'nom', gender)),
      ));
    const kindSelect = el('select', { name: 'kind' },
      Object.keys(KINDS).map((key) => el('option', { value: key }, t(`kinds.${key}`))));

    const form = el('form', {
      class: 'add-word',
      onSubmit: (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const result = createNoun(data);
        const problem = result.error ?? wordSets.addNoun(set.id, result.noun);
        if (problem) {
          error.textContent = errorText(problem);
          return;
        }
        // The store change re-renders the view with an empty form.
        state.message = null;
        render();
        formSlot.querySelector('input[name="word"]')?.focus();
      },
    },
      el('label', { class: 'field-label' }, t('words.germanWord'),
        el('input', { type: 'text', name: 'word', placeholder: t('words.wordPlaceholder'), autocomplete: 'off', autocapitalize: 'words' })),
      el('div', { class: 'field-label' }, t('words.gender'), genderPills),
      el('label', { class: 'field-label' }, t('words.kind'), kindSelect),
      el('div', { class: 'form-row' },
        el('label', { class: 'field-label singular-only' }, t('words.pluralField'),
          el('input', { type: 'text', name: 'plural', placeholder: t('words.pluralPlaceholder'), autocomplete: 'off' })),
        el('label', { class: 'field-label' }, t('words.meaningField'),
          el('input', { type: 'text', name: 'en', placeholder: t('words.meaningPlaceholder'), autocomplete: 'off' })),
      ),
      el('details', { class: 'more-forms singular-only' },
        el('summary', {}, t('words.moreForms')),
        el('div', { class: 'form-row' },
          el('label', { class: 'field-label' }, t('words.genitiveField'),
            el('input', { type: 'text', name: 'genitive', placeholder: t('words.genitivePlaceholder'), autocomplete: 'off' })),
          el('label', { class: 'field-label' }, t('words.meaningPluralField'),
            el('input', { type: 'text', name: 'enPlural', placeholder: t('words.meaningPluralPlaceholder'), autocomplete: 'off' })),
        ),
      ),
      error,
      el('button', { type: 'submit', class: 'btn primary' }, t('words.addWord')),
    );

    return el('section', { class: 'panel' }, el('h2', {}, t('words.addTitle')), form);
  }

  function renderList(set) {
    const filters = el('div', { class: 'segments' }, FILTERS.map(([id, label]) =>
      el('button', {
        type: 'button',
        class: `segment${state.filter === id ? ' active' : ''}`,
        'aria-pressed': String(state.filter === id),
        onClick: () => act(() => (state.filter = id), state.message),
      }, label()),
    ));
    const hide = el('label', { class: 'check' },
      el('input', {
        type: 'checkbox',
        checked: state.hideArticles,
        onChange: (event) => act(() => (state.hideArticles = event.target.checked), state.message),
      }),
      t('words.hideArticles'),
    );

    const nouns = set.nouns.filter((noun) => state.filter === 'all' || noun.gender === state.filter);
    const list = nouns.length
      ? el('ul', { class: 'noun-list' }, nouns.map((noun) => renderNoun(noun, set)))
      : el('p', { class: 'hint empty-list' },
        set.nouns.length ? t('words.noMatches') : t('words.empty'));

    return el('section', { class: 'panel' }, filters, hide, list);
  }

  function renderNoun(noun, set) {
    const hidden = state.hideArticles;
    const article = el('span', { class: `article g-${noun.gender}${hidden ? ' concealed' : ''}` },
      genderMark(noun.gender), getArticle('definite', 'nom', noun.gender));
    const item = el('li', { class: `noun-item${set.builtIn ? '' : ' removable'}` },
      el('span', { class: 'noun-main' }, article, ' ', noun.word),
      el('span', { class: 'noun-plural' }, pluralLabel(noun)),
      !set.builtIn && el('button', {
        type: 'button',
        class: 'remove-btn',
        'aria-label': t('words.remove', { word: noun.word }),
        title: t('words.remove', { word: noun.word }),
        onClick: (event) => {
          event.stopPropagation();
          act(() => wordSets.removeNoun(set.id, noun.word));
        },
      }, '×'),
      renderMeaning(noun),
    );
    if (hidden) {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      const reveal = () => article.classList.remove('concealed');
      item.addEventListener('click', reveal);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') reveal();
      });
    }
    return item;
  }

  function deleteSet(set) {
    if (!window.confirm(t('words.confirmDelete', { name: set.name, count: set.nouns.length }))) return;
    act(() => wordSets.deleteSet(set.id), { kind: 'ok', text: t('words.deleted', { name: set.name }) });
  }

  function exportSet(set) {
    downloadText(`${fileName(setName(set))}.csv`, toCsv(set.nouns));
  }

  async function importFile() {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;

    const { nouns, errors } = parseCsv(await file.text());
    const shownErrors = errors.slice(0, MAX_ERRORS_SHOWN).map(errorText);
    if (errors.length > MAX_ERRORS_SHOWN) shownErrors.push(t('words.moreErrors', { count: errors.length - MAX_ERRORS_SHOWN }));

    if (!nouns.length) {
      act(() => {}, { kind: 'error', text: t('words.importFailed', { file: file.name }), details: shownErrors });
      return;
    }
    const name = file.name.replace(/\.[^.]+$/, '') || t('words.importedSetName');
    const skipped = errors.length ? ` ${t('words.skipped', { count: errors.length })}` : '';
    act(() => wordSets.createSet(name, nouns), {
      kind: errors.length ? 'warning' : 'ok',
      text: t('words.imported', { count: nouns.length }) + skipped,
      details: shownErrors,
    });
  }

  wordSets.onChange(render);
  render();
}

function pluralLabel(noun) {
  if (noun.gender === 'pl') return t('words.pluralOnly');
  return noun.plural ? `die ${noun.plural}` : '';
}

function renderMeaning(noun) {
  const meaning = nounMeaning(noun, language);
  return meaning && el('span', { class: 'meaning' }, meaning);
}

/** Turns an error code from noun input, the store or CSV import into a sentence. */
function errorText({ code, params = {}, row = null }) {
  const message = t(`errors.${code}`, params);
  return row === null ? message : t('errors.row', { row, message });
}

function renderMessage(message) {
  if (!message) return el('div', { 'aria-live': 'polite' });
  return el('div', { class: `message ${message.kind}`, 'aria-live': 'polite' },
    el('p', {}, message.text),
    message.details?.length > 0 && el('ul', {}, message.details.map((line) => el('li', {}, line))),
  );
}

function downloadText(name, text) {
  // The byte order mark makes Excel read umlauts correctly.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }));
  const link = el('a', { href: url, download: name, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileName(setName) {
  return setName.replace(/[^\p{L}\p{N} _-]+/gu, '').trim() || 'words';
}
