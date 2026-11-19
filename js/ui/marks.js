// Gender shapes: der = square, die = circle, das = triangle, plural = bars. Drawn with CSS.

import { el } from './dom.js';

export function genderMark(gender) {
  return el('span', { class: `mark mark-${gender}`, 'aria-hidden': 'true' });
}
