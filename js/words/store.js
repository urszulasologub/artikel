// Word sets: the built-in set plus the user's own sets, saved in the browser.
// Views share one store and re-render when it reports a change.

import { NOUNS } from '../data/nouns.js';

const STORAGE_KEY = 'german-grammar:word-sets';

export const BUILT_IN_SETS = [{ id: 'basics', name: 'Basics', builtIn: true, nouns: NOUNS }];

/**
 * @param {Storage | null} storage where custom sets are kept; null keeps them in memory only
 */
export function createWordSetStore(storage) {
  const events = new EventTarget();
  let state = load(storage);

  const listSets = () => [...BUILT_IN_SETS, ...state.sets];
  const getSet = (id) => listSets().find((set) => set.id === id) ?? null;

  function update(next) {
    state = next;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: changes last for this visit only.
    }
    events.dispatchEvent(new Event('change'));
  }

  function updateCustomSet(id, change) {
    update({ ...state, sets: state.sets.map((set) => (set.id === id ? change(set) : set)) });
  }

  function uniqueName(name) {
    const taken = new Set(listSets().map((set) => set.name));
    if (!taken.has(name)) return name;
    let number = 2;
    while (taken.has(`${name} ${number}`)) number++;
    return `${name} ${number}`;
  }

  return {
    listSets,
    getSet,
    activeSet: () => getSet(state.activeId) ?? BUILT_IN_SETS[0],
    onChange: (listener) => events.addEventListener('change', listener),

    selectSet(id) {
      if (getSet(id)) update({ ...state, activeId: id });
    },

    /** Creates a set and makes it active. */
    createSet(name, nouns = []) {
      const set = { id: newId(), name: uniqueName(name.trim() || 'My words'), nouns };
      update({ activeId: set.id, sets: [...state.sets, set] });
      return set;
    },

    /** @param {string} [name] name for the copy; defaults to "<name> (copy)" */
    copySet(id, name) {
      const source = getSet(id);
      return this.createSet(name ?? `${source.name} (copy)`, source.nouns.map((noun) => ({ ...noun, tags: [...noun.tags] })));
    },

    renameSet(id, name) {
      const trimmed = name.trim();
      if (trimmed) updateCustomSet(id, (set) => ({ ...set, name: trimmed }));
    },

    /** Built-in sets cannot be deleted. Deleting the active set switches back to the built-in one. */
    deleteSet(id) {
      if (getSet(id)?.builtIn) return;
      update({
        activeId: state.activeId === id ? BUILT_IN_SETS[0].id : state.activeId,
        sets: state.sets.filter((set) => set.id !== id),
      });
    },

    /** @returns {{ code: string, params?: object } | null} an error (i18n "errors" key), or null when added */
    addNoun(id, noun) {
      const set = getSet(id);
      if (!set || set.builtIn) return { code: 'builtIn' };
      if (set.nouns.some((n) => n.word.toLowerCase() === noun.word.toLowerCase())) {
        return { code: 'duplicate', params: { word: noun.word } };
      }
      updateCustomSet(id, (s) => ({ ...s, nouns: [...s.nouns, noun] }));
      return null;
    },

    removeNoun(id, word) {
      updateCustomSet(id, (set) => ({ ...set, nouns: set.nouns.filter((noun) => noun.word !== word) }));
    },
  };
}

function load(storage) {
  const empty = { activeId: BUILT_IN_SETS[0].id, sets: [] };
  try {
    const data = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
    if (!data || typeof data.activeId !== 'string' || !Array.isArray(data.sets)) return empty;
    const sets = data.sets
      .filter((set) => typeof set?.id === 'string' && typeof set.name === 'string' && Array.isArray(set.nouns))
      .map((set) => ({ id: set.id, name: set.name, nouns: set.nouns.filter(isNoun) }));
    return { activeId: data.activeId, sets };
  } catch {
    return empty;
  }
}

// Saved nouns come from createNoun; this guards against broken or hand-edited storage.
function isNoun(noun) {
  return (
    typeof noun?.word === 'string' &&
    ['m', 'f', 'n', 'pl'].includes(noun.gender) &&
    typeof noun.genitive === 'string' &&
    Array.isArray(noun.tags) &&
    noun.tags.length > 0
  );
}

function newId() {
  return `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
