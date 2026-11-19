// Entry point: applies the interface language, mounts the three tabs, the sound and language buttons,
// and switches between tabs using the URL hash.

import { LANGUAGES, language, setLanguage, t } from './i18n/index.js';
import { mountQuizView } from './ui/quiz-view.js';
import { mountRushView } from './ui/rush-view.js';
import { mountSoundToggle } from './ui/sound.js';
import { mountTutorialView } from './ui/tutorial-view.js';
import { mountWordsView } from './ui/words-view.js';
import { createWordSetStore } from './words/store.js';

const VIEWS = {
  practice: mountQuizView,
  rush: mountRushView,
  learn: mountTutorialView,
  words: mountWordsView,
};
const DEFAULT_VIEW = 'practice';

translateStaticText();
trackHeaderHeight();

// One shared store, so the Practice tab follows changes made in the Words tab.
const storage = browserStorage();
const wordSets = createWordSetStore(storage);

for (const [id, mount] of Object.entries(VIEWS)) {
  mount(document.getElementById(`view-${id}`), { wordSets, storage });
}

function showView() {
  const requested = location.hash.slice(1);
  const current = Object.hasOwn(VIEWS, requested) ? requested : DEFAULT_VIEW;
  for (const id of Object.keys(VIEWS)) {
    document.getElementById(`view-${id}`).hidden = id !== current;
    const tab = document.querySelector(`[data-tab="${id}"]`);
    tab.classList.toggle('active', id === current);
    tab.toggleAttribute('aria-current', id === current);
  }
}

mountSoundToggle(document.getElementById('sound-toggle'), { on: t('app.soundOn'), off: t('app.soundOff') });
mountLanguageSwitch(document.querySelector('.lang-switch'));

window.addEventListener('hashchange', showView);
showView();

// Texts written in index.html: marked with data-i18n (text) or data-i18n-aria-label.
function translateStaticText() {
  document.documentElement.lang = language;
  document.title = t('app.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'));
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-aria-label]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  }
}

// Switching reloads the page, so every view is drawn again in the new language. The quiz continues
// where it was, because progress is saved.
function mountLanguageSwitch(group) {
  for (const button of group.querySelectorAll('[data-lang]')) {
    const code = button.dataset.lang;
    button.setAttribute('aria-pressed', String(code === language));
    button.addEventListener('click', () => {
      if (code === language || !Object.hasOwn(LANGUAGES, code)) return;
      setLanguage(code);
      location.reload();
    });
  }
}

// Sticky bars below the sticky header (like the Rush score bar) need its height, which differs per screen.
function trackHeaderHeight() {
  const header = document.querySelector('.top');
  const update = () => document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  new ResizeObserver(update).observe(header);
  update();
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null; // Blocked storage: word sets then last for this visit only.
  }
}
