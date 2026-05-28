/* ============================================================
   NEXTYPE v5.0 — theme.js
   Handles: theme switching, palette UI, CSS var reads
============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════
   CURRENT THEME STATE
════════════════════════════════════════════════════════ */
let theme = 'neon-blue';

/* ════════════════════════════════════════════════════════
   APPLY THEME
   Sets data-theme on <html> and updates palette dots
════════════════════════════════════════════════════════ */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  theme = t;
  document.querySelectorAll('.tdot').forEach(d =>
    d.classList.toggle('on', d.dataset.t === t)
  );
}

/* ════════════════════════════════════════════════════════
   CSS VARIABLE HELPERS
   Used by game engine to read current theme colors
════════════════════════════════════════════════════════ */
function css(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function wCols(i) {
  return {
    s: css(`--w${i}`),   // solid color
    g: css(`--w${i}g`),  // glow color
    k: css(`--w${i}k`),  // key/subtle bg
  };
}

/* ════════════════════════════════════════════════════════
   THEME SWITCHER UI
   Floating palette button bottom-right
════════════════════════════════════════════════════════ */
const tswBtn     = document.getElementById('tsw-btn');
const tswPalette = document.getElementById('tsw-palette');
let tswOpen = false;

tswBtn.addEventListener('click', e => {
  e.stopPropagation();
  tswOpen = !tswOpen;
  tswPalette.classList.toggle('open', tswOpen);
});

document.addEventListener('click', () => {
  if (tswOpen) {
    tswOpen = false;
    tswPalette.classList.remove('open');
  }
});

document.querySelectorAll('.tdot').forEach(dot =>
  dot.addEventListener('click', e => {
    e.stopPropagation();
    applyTheme(dot.dataset.t);
    tswOpen = false;
    tswPalette.classList.remove('open');
  })
);
