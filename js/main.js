// Entry point: mounts the three tabs and the sound toggle, and switches between them using the URL hash.

import { mountNounsView } from './ui/nouns-view.js';
import { mountQuizView } from './ui/quiz-view.js';
import { mountSoundToggle } from './ui/sound.js';
import { mountTutorialView } from './ui/tutorial-view.js';

const VIEWS = {
  practice: mountQuizView,
  learn: mountTutorialView,
  nouns: mountNounsView,
};
const DEFAULT_VIEW = 'practice';

for (const [id, mount] of Object.entries(VIEWS)) {
  mount(document.getElementById(`view-${id}`));
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

mountSoundToggle(document.getElementById('sound-toggle'));

window.addEventListener('hashchange', showView);
showView();
