// Learn tab: a short guide to the four cases plus the full article tables.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { CASE_GUIDE } from '../grammar/cases.js';
import { el } from './dom.js';
import { declensionTable } from './table.js';

export function mountTutorialView(root) {
  const intro = el('section', { class: 'panel' },
    el('h2', {}, 'How cases work'),
    el('p', {}, 'In German, the article changes depending on the noun\'s role in the sentence. ' +
      'This role is called the case. Ask the question word to find it, then look up the article in the table.'),
    el('ol', { class: 'steps' },
      el('li', {}, 'Find the gender of the noun: der, die, das or plural.'),
      el('li', {}, 'Find the case: is there a verb or preposition that decides it? If not, is the noun the subject or the object?'),
      el('li', {}, 'Look up the article where the case row meets the gender column.'),
    ),
  );

  const caseCards = CASES.map((grammarCase) => {
    const guide = CASE_GUIDE[grammarCase];
    return el('section', { class: `panel case-card c-${grammarCase}` },
      el('h3', {}, CASE_NAMES[grammarCase], ' ', el('span', { class: 'question' }, `${CASE_QUESTIONS[grammarCase]} (${guide.questionEn})`)),
      el('p', {}, guide.use),
      el('ul', {}, guide.triggers.map((trigger) => el('li', {}, trigger))),
      el('p', { class: 'examples' }, guide.examples.map((example) => el('span', {}, example))),
      el('p', { class: 'tip' }, guide.tip),
    );
  });

  const tables = el('section', { class: 'panel' },
    el('h2', {}, 'Article tables'),
    el('div', { class: 'tables' }, Object.keys(ARTICLE_TYPES).map((type) => declensionTable(type, CASES))),
  );

  root.append(intro, tables, el('div', { class: 'case-grid' }, caseCards));
}
