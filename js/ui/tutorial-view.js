// Learn tab: a short guide to the four cases plus the full article tables.

import { ARTICLE_TYPES, CASES, CASE_NAMES, CASE_QUESTIONS } from '../grammar/articles.js';
import { CASE_EXAMPLES } from '../grammar/cases.js';
import { t } from '../i18n/index.js';
import { el } from './dom.js';
import { declensionTable } from './table.js';

export function mountTutorialView(root) {
  const intro = el('section', { class: 'panel' },
    el('h2', {}, t('learn.title')),
    el('p', {}, t('learn.intro')),
    el('ol', { class: 'steps' }, t('learn.steps').map((step) => el('li', {}, step))),
  );

  const caseCards = CASES.map((grammarCase) => {
    const guide = t(`learn.cases.${grammarCase}`);
    return el('section', { class: `panel case-card c-${grammarCase}` },
      el('h3', {}, CASE_NAMES[grammarCase], ' ',
        el('span', { class: 'question' }, `${CASE_QUESTIONS[grammarCase]} (${guide.meaning})`)),
      el('p', {}, guide.use),
      el('ul', {}, guide.triggers.map((trigger) => el('li', {}, trigger))),
      el('p', { class: 'examples' }, CASE_EXAMPLES[grammarCase].map((example) => el('span', {}, example))),
      el('p', { class: 'tip' }, guide.tip),
    );
  });

  const tables = el('section', { class: 'panel' },
    el('h2', {}, t('learn.tablesTitle')),
    el('div', { class: 'tables' }, Object.keys(ARTICLE_TYPES).map((type) => declensionTable(type, CASES))),
  );

  root.append(intro, tables, el('div', { class: 'case-grid' }, caseCards));
}
