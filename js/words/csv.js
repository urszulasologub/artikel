// CSV export and import for word sets. Pure logic, no DOM.
//
// Columns: word, gender (der/die/das, or plural for plural-only words), kind (thing/person/animal/place), plural, genitive, english, english_plural.
// Only word and gender are required. Comma or semicolon separators both work (Excel often uses semicolons).
// The header row is optional; without one, columns are read in the order above.

import { getArticle } from '../grammar/articles.js';
import { createNoun, kindOf } from './noun-input.js';

export const COLUMNS = ['word', 'gender', 'kind', 'plural', 'genitive', 'english', 'english_plural'];

export function toCsv(nouns) {
  const rows = nouns.map((noun) => [
    noun.word,
    noun.gender === 'pl' ? 'plural' : getArticle('definite', 'nom', noun.gender),
    kindOf(noun),
    noun.plural ?? '',
    noun.gender === 'm' || noun.gender === 'n' ? noun.genitive : '',
    noun.en ?? '',
    noun.enPlural ?? '',
  ]);
  return [COLUMNS, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n';
}

/**
 * @returns {{ nouns: object[], errors: { row: number | null, code: string, params?: object }[] }}
 *   valid nouns, plus one error per skipped row (codes match the "errors" keys in the i18n files)
 */
export function parseCsv(text) {
  const content = text.replace(/^﻿/, '');
  const rows = splitRows(content, detectDelimiter(content)).filter((row) => row.some((cell) => cell.trim()));
  if (!rows.length) return { nouns: [], errors: [{ row: null, code: 'emptyFile' }] };

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = header.includes('word');
  const columns = hasHeader ? header : COLUMNS;
  const firstLine = hasHeader ? 2 : 1;

  const nouns = [];
  const errors = [];
  const seen = new Set();
  rows.slice(hasHeader ? 1 : 0).forEach((row, index) => {
    const cell = (name) => row[columns.indexOf(name)] ?? '';
    const result = createNoun({
      word: cell('word'),
      gender: cell('gender'),
      kind: cell('kind'),
      plural: cell('plural'),
      genitive: cell('genitive'),
      en: cell('english'),
      enPlural: cell('english_plural'),
    });
    const line = index + firstLine;
    if (result.error) return errors.push({ row: line, ...result.error });
    const key = result.noun.word.toLowerCase();
    if (seen.has(key)) return errors.push({ row: line, code: 'duplicateInFile', params: { word: result.noun.word } });
    seen.add(key);
    nouns.push(result.noun);
  });
  return { nouns, errors };
}

function escapeCell(value) {
  const text = String(value);
  return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  return firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
}

/** Splits CSV text into rows of cells, handling quoted cells with commas, quotes and line breaks. */
function splitRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
