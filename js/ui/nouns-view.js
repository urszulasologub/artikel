// Nouns tab: the word list with genders. Articles can be hidden to test yourself.

import { NOUNS } from '../data/nouns.js';
import { getArticle } from '../grammar/articles.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';

const FILTERS = [
  ['all', 'All'],
  ['m', 'der'],
  ['f', 'die'],
  ['n', 'das'],
];

export function mountNounsView(root) {
  const state = { filter: 'all', hideArticles: false };
  const controls = el('div');
  const list = el('ul', { class: 'noun-list' });
  root.append(el('section', { class: 'panel' }, controls, list));

  function render() {
    controls.replaceChildren(
      el('div', { class: 'segments' }, FILTERS.map(([id, label]) =>
        el('button', {
          type: 'button',
          class: `segment${state.filter === id ? ' active' : ''}`,
          'aria-pressed': String(state.filter === id),
          onClick: () => {
            state.filter = id;
            render();
          },
        }, label),
      )),
      el('label', { class: 'check' },
        el('input', {
          type: 'checkbox',
          checked: state.hideArticles,
          onChange: (event) => {
            state.hideArticles = event.target.checked;
            render();
          },
        }),
        'Hide articles (tap a word to check)',
      ),
    );

    const nouns = NOUNS.filter((noun) => state.filter === 'all' || noun.gender === state.filter);
    list.replaceChildren(...nouns.map((noun) => renderNoun(noun, state.hideArticles)));
  }

  render();
}

function renderNoun(noun, hidden) {
  const article = getArticle('definite', 'nom', noun.gender);
  const articleSpan = el('span', { class: `article g-${noun.gender}${hidden ? ' concealed' : ''}` }, genderMark(noun.gender), article);
  const item = el('li', { class: 'noun-item' },
    el('span', { class: 'noun-main' }, articleSpan, ' ', noun.word),
    el('span', { class: 'noun-plural' }, `die ${noun.plural}`),
    el('span', { class: 'meaning' }, noun.en),
  );
  if (hidden) {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    const reveal = () => articleSpan.classList.remove('concealed');
    item.addEventListener('click', reveal);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') reveal();
    });
  }
  return item;
}
