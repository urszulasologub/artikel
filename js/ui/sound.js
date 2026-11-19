// Short sound effects made with the Web Audio API (no audio files), plus the mute button.

const STORAGE_KEY = 'german-grammar:muted';

let context = null;
let muted = readMuted();

// Each note: frequency (Hz), start offset and duration (seconds).
const SOUNDS = {
  correct: [
    { freq: 880, start: 0, duration: 0.12 },
    { freq: 1318.5, start: 0.09, duration: 0.28 },
  ],
  wrong: [
    { freq: 233, start: 0, duration: 0.16, slideTo: 196, volume: 0.22 },
    { freq: 185, start: 0.13, duration: 0.3, slideTo: 140, volume: 0.22 },
  ],
  step: [{ freq: 1046.5, start: 0, duration: 0.14, volume: 0.12 }],
  streak: [784, 988, 1175, 1568].map((freq, i) => ({ freq, start: i * 0.07, duration: 0.22 })),
  roundEnd: [
    ...[523.3, 659.3, 784].map((freq, i) => ({ freq, start: i * 0.1, duration: 0.2 })),
    ...[523.3, 659.3, 784, 1046.5].map((freq) => ({ freq, start: 0.32, duration: 0.7, volume: 0.09 })),
  ],

  // Artikel Rush
  tick: [{ freq: 1568, start: 0, duration: 0.05, volume: 0.07 }],
  tickUrgent: [{ freq: 1760, start: 0, duration: 0.06, volume: 0.12 }],
  comboUp: [659.3, 880, 1318.5].map((freq, i) => ({ freq, start: i * 0.06, duration: 0.18, volume: 0.14 })),
  heartLost: [
    { freq: 392, start: 0, duration: 0.18, slideTo: 330, volume: 0.2 },
    { freq: 262, start: 0.16, duration: 0.4, slideTo: 196, volume: 0.2 },
  ],
  heartGained: [523.3, 784, 1046.5].map((freq, i) => ({ freq, start: i * 0.08, duration: 0.25, volume: 0.14 })),
  roundUp: [
    ...[392, 523.3, 659.3, 784].map((freq, i) => ({ freq, start: i * 0.08, duration: 0.18 })),
    { freq: 1046.5, start: 0.34, duration: 0.5, volume: 0.12 },
  ],
  timeOut: [
    { freq: 880, start: 0, duration: 0.12, volume: 0.18 },
    { freq: 880, start: 0.15, duration: 0.12, volume: 0.18 },
    { freq: 220, start: 0.32, duration: 0.6, slideTo: 110, volume: 0.22 },
  ],
  gameOver: [392, 349.2, 311.1, 261.6].map((freq, i) => ({ freq, start: i * 0.22, duration: 0.35, slideTo: freq * 0.97, volume: 0.18 })),
  highScore: [
    ...[523.3, 659.3, 784, 1046.5, 1318.5].map((freq, i) => ({ freq, start: i * 0.09, duration: 0.2 })),
    ...[523.3, 659.3, 784, 1046.5].map((freq) => ({ freq, start: 0.5, duration: 0.9, volume: 0.08 })),
  ],
};

export function playSound(name) {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  for (const note of SOUNDS[name]) playNote(ctx, note);
}

/**
 * Wires a button with aria-pressed="true" meaning sound is on.
 * @param {{ on: string, off: string }} labels tooltips for both states
 */
export function mountSoundToggle(button, labels) {
  const sync = () => {
    button.setAttribute('aria-pressed', String(!muted));
    button.title = muted ? labels.off : labels.on;
  };
  button.addEventListener('click', () => {
    muted = !muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // Not saved; the choice still lasts for this visit.
    }
    sync();
    playSound('correct');
  });
  sync();
}

function getContext() {
  if (!context) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

// A soft bell: triangle wave plus a quiet sine an octave up, with a quick fade in and a slow fade out.
function playNote(ctx, { freq, start, duration, slideTo, volume = 0.18 }) {
  const at = ctx.currentTime + start;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  gain.connect(ctx.destination);

  for (const [type, multiplier, level] of [['triangle', 1, 1], ['sine', 2, 0.25]]) {
    const osc = ctx.createOscillator();
    const partGain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * multiplier, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo * multiplier, at + duration);
    partGain.gain.value = level;
    osc.connect(partGain).connect(gain);
    osc.start(at);
    osc.stop(at + duration + 0.05);
  }
}

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
