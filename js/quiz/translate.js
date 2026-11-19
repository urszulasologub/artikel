// Builds the English translation of a question. Pure logic, no DOM.

/**
 * @param {string} template sentence.en, e.g. "I see {noun}." or "This is {noun's} room."
 * @param {{ noun: object, plural: boolean, articleType: string }} options
 */
export function translate(template, { noun, plural, articleType }) {
  const phrase = nounPhrase(noun, plural, articleType);
  const text = template
    .replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_, singular, pluralForm) => (plural ? pluralForm : singular))
    .replace("{noun's}", possessive(phrase))
    .replace('{noun}', phrase);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "the man", "a man", "an apple", "the men". */
export function nounPhrase(noun, plural, articleType) {
  const word = plural ? noun.enPlural : englishSingular(noun);
  if (articleType === 'definite') return `the ${word}`;
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}

/** "the man's", "the men's", "the teachers'". */
function possessive(phrase) {
  return phrase.endsWith('s') ? `${phrase}'` : `${phrase}'s`;
}

// "teacher (m)" → "teacher", "clock, watch" → "clock"
function englishSingular(noun) {
  return noun.en.replace(/\s*\(.*?\)/g, '').split(',')[0].trim();
}
