// Display name of a word set.

import { t } from '../i18n/index.js';

/** Built-in sets are named in the interface language; user sets keep the name the user gave them. */
export function setName(set) {
  return set.builtIn ? t(`words.builtInNames.${set.id}`) : set.name;
}
