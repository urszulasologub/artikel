// Quiz settings: difficulty presets, defaults, and saving in the browser.

import { ARTICLE_TYPES, CASES } from './grammar/articles.js';

const STORAGE_KEY = 'german-grammar:settings';

export const TABLE_MODES = ['open', 'toggle', 'hidden'];

// Preset names are in the i18n files under "presets".
export const PRESETS = {
  easy: { showGender: true, showCase: true, askCase: false, tableMode: 'toggle' },
  medium: { showGender: true, showCase: false, askCase: true, tableMode: 'toggle' },
  hard: { showGender: false, showCase: false, askCase: true, tableMode: 'hidden' },
};

const PRESET_FIELDS = ['showGender', 'showCase', 'askCase', 'tableMode'];

export const DEFAULT_SETTINGS = {
  ...PRESETS.easy,
  cases: ['nom', 'akk'],
  articleTypes: ['definite'],
};

/** Returns the preset id that matches the settings, or 'custom'. */
export function activePreset(settings) {
  const match = Object.entries(PRESETS).find(([, preset]) =>
    PRESET_FIELDS.every((field) => preset[field] === settings[field]),
  );
  return match ? match[0] : 'custom';
}

export function applyPreset(settings, presetId) {
  return { ...settings, ...PRESETS[presetId] };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitize(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be blocked (private mode). Settings then last for this visit only.
  }
}

/** Keeps only known values, so old or broken saved data can't break the app. */
export function sanitize(input) {
  const cases = listOf(input.cases, CASES);
  const articleTypes = listOf(input.articleTypes, Object.keys(ARTICLE_TYPES));
  return {
    showGender: typeof input.showGender === 'boolean' ? input.showGender : DEFAULT_SETTINGS.showGender,
    showCase: typeof input.showCase === 'boolean' ? input.showCase : DEFAULT_SETTINGS.showCase,
    askCase: typeof input.askCase === 'boolean' ? input.askCase : DEFAULT_SETTINGS.askCase,
    tableMode: TABLE_MODES.includes(input.tableMode) ? input.tableMode : DEFAULT_SETTINGS.tableMode,
    cases: cases.length ? cases : DEFAULT_SETTINGS.cases,
    articleTypes: articleTypes.length ? articleTypes : DEFAULT_SETTINGS.articleTypes,
  };
}

function listOf(value, allowed) {
  return Array.isArray(value) ? allowed.filter((item) => value.includes(item)) : [];
}
