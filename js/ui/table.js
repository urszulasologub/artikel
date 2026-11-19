// Declension table: cases as rows, genders as columns.

import { ARTICLE_TYPES, CASE_NAMES, CASE_QUESTIONS, GENDERS, getArticle } from '../grammar/articles.js';
import { t } from '../i18n/index.js';
import { el } from './dom.js';
import { genderMark } from './marks.js';

/**
 * @param {string} articleType
 * @param {string[]} cases rows to show
 * @param {{ case: string, gender: string } | null} [highlight] cell to mark
 */
export function declensionTable(articleType, cases, highlight = null) {
  const header = el('tr', {}, el('th', {}, ''), GENDERS.map((g) => el('th', { class: `g-${g}` }, genderMark(g), t(`genderColumns.${g}`))));

  const rows = cases.map((grammarCase) =>
    el(
      'tr',
      { class: `c-${grammarCase}` },
      el('th', { scope: 'row' }, CASE_NAMES[grammarCase], el('span', { class: 'case-q' }, CASE_QUESTIONS[grammarCase])),
      GENDERS.map((gender) => {
        const isHighlighted = highlight?.case === grammarCase && highlight?.gender === gender;
        return el(
          'td',
          { class: `g-${gender}${isHighlighted ? ' highlight' : ''}` },
          getArticle(articleType, grammarCase, gender) ?? '–',
        );
      }),
    ),
  );

  return el(
    'figure',
    { class: 'table-wrap' },
    el('figcaption', {}, ARTICLE_TYPES[articleType].label),
    el('table', { class: 'declension' }, el('thead', {}, header), el('tbody', {}, rows)),
  );
}
