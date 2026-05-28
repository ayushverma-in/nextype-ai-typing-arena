/* ============================================================
   NEXTYPE v5.0 — audio.js
   Synthesized Web Audio API sound effects — no external files
============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════
   AUDIO CONTEXT
   Created lazily on first user interaction
════════════════════════════════════════════════════════ */
let audioCtx = null;

function getACtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/* Wake/resume the audio context after user gesture */
function wake() {
  try {
    const a = getACtx();
    if (a.state === 'suspended') a.resume();
  } catch(e) {}
}

/* ════════════════════════════════════════════════════════
   CORE TONE GENERATOR
   freq     — Hz frequency
   type     — oscillator type: sine | square | sawtooth | triangle
   dur      — duration in seconds
   gain     — peak volume (0–1, keep low e.g. 0.02–0.09)
   t0       — delay offset in seconds (default 0)
════════════════════════════════════════════════════════ */
function tone(freq, type, dur, gain, t0 = 0) {
  try {
    const ac = getACtx();
    const o  = ac.createOscillator();
    const g  = ac.createGain();
    const f  = ac.createBiquadFilter();

    f.type = 'lowpass';
    f.frequency.value = freq * 3;

    o.type = type;
    o.frequency.value = freq;

    o.connect(f);
    f.connect(g);
    g.connect(ac.destination);

    const t = ac.currentTime + t0;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.start(t);
    o.stop(t + dur + 0.02);
  } catch(e) {}
}

/* ════════════════════════════════════════════════════════
   SOUND EFFECTS
════════════════════════════════════════════════════════ */
const SFX = {

  /* Single key press — light tick */
  key() {
    tone(1100, 'sine', 0.04, 0.025);
  },

  /* Word destroyed — pitch depends on word length */
  destroy(len) {
    const b = 440 - len * 16;
    tone(b,       'sawtooth', 0.15, 0.065);
    tone(b * 1.5, 'square',   0.10, 0.04, 0.06);
    tone(b * 2,   'sine',     0.08, 0.025, 0.13);
  },

  /* Combo hit — ascending pitch with combo count */
  combo(n) {
    const f = 280 + n * 28;
    tone(f,        'triangle', 0.20, 0.055);
    tone(f * 1.33, 'sine',     0.17, 0.04,  0.09);
  },

  /* Miss — low thud */
  miss() {
    tone(110, 'sawtooth', 0.28, 0.09);
    tone(80,  'sawtooth', 0.22, 0.055, 0.09);
  },

  /* Level up — ascending arpeggio */
  levelup() {
    [440, 550, 660, 880, 1100].forEach((f, i) =>
      tone(f, 'triangle', 0.22, 0.055, i * 0.07)
    );
  },
};
