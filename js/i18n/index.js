// Interface language (English or Polish). The choice is saved in the browser; changing it reloads the page.
//
// Dictionary values can be:
//   - a string with {placeholders}:            t('quiz.question', { position: 2, total: 10 })
//   - plural forms, picked by params.count:    { one: '{count} word', other: '{count} words' }
//   - a list or object (returned as is):       t('learn.steps')

// Translations live in JSON files, the usual format for web apps and translation tools.
import en from './en.json' with { type: 'json' };
import pl from './pl.json' with { type: 'json' };

export const LANGUAGES = {
  en: { label: 'EN', dictionary: en },
  pl: { label: 'PL', dictionary: pl },
};

const STORAGE_KEY = 'german-grammar:language';

export const language = detectLanguage();
export const t = createTranslator(language);

/** Saves the choice. The caller reloads the page so every view is drawn in the new language. */
export function setLanguage(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not saved; the page falls back to the browser's language next time.
  }
}

/** A translate function for one language. Missing keys fall back to English, then to the key itself. */
export function createTranslator(code) {
  const pluralRules = new Intl.PluralRules(code);
  return (key, params = {}) => {
    let value = lookup(LANGUAGES[code].dictionary, key) ?? lookup(en, key);
    if (value === undefined) return key;
    if (isPluralForms(value)) value = value[pluralRules.select(params.count)] ?? value.other;
    return typeof value === 'string' ? interpolate(value, params) : value;
  };
}

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.hasOwn(LANGUAGES, saved)) return saved;
  } catch {
    // Storage blocked: use the browser's language.
  }
  return globalThis.navigator?.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => node?.[part], dictionary);
}

function isPluralForms(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value.other === 'string';
}

function interpolate(text, params) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
