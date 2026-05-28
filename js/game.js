/* ============================================================
   NEXTYPE v5.0 — game.js
   Core game engine: state, spawning, rendering, input, HUD
   Depends on: theme.js, audio.js, words.js, background.js
============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════
   DIFFICULTY CONFIG
   spawnMs  — ms between new word spawns
   baseSpd  — starting fall speed (px per frame)
   spdInc   — speed added per level
   maxLen   — max word length allowed
   lives    — starting lives
════════════════════════════════════════════════════════ */
const DIFF = {
  easy:   { spawnMs: 3200, baseSpd: 0.26, spdInc: 0.022, maxLen: 6,  lives: 10 },
  normal: { spawnMs: 2200, baseSpd: 0.50, spdInc: 0.046, maxLen: 9,  lives: 10 },
  hard:   { spawnMs: 1400, baseSpd: 0.80, spdInc: 0.075, maxLen: 12, lives: 10 },
  insane: { spawnMs: 820,  baseSpd: 1.28, spdInc: 0.13,  maxLen: 99, lives: 10 },
};

/* ════════════════════════════════════════════════════════
   CANVAS SETUP
════════════════════════════════════════════════════════ */
const C  = document.getElementById('gc');
const cx = C.getContext('2d');
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = window.devicePixelRatio || 1;
  W   = C.offsetWidth;
  H   = C.offsetHeight;
  C.width  = W * DPR;
  C.height = H * DPR;
  cx.scale(DPR, DPR);
}
window.addEventListener('resize', () => { resize(); });

/* ════════════════════════════════════════════════════════
   GAME STATE
════════════════════════════════════════════════════════ */
const MAX_LIVES = 10;
let entities  = [];   // active falling word objects
let particles = [];   // explosion particles
let floaters  = [];   // +score floating text labels
let gs        = {};   // live game state object
let diff      = 'easy';
let running   = false;
let rafId, spawnTimer;
let charHits  = 0, charMiss = 0, tStart = 0;

/* ════════════════════════════════════════════════════════
   LIVES / HEARTS UI
════════════════════════════════════════════════════════ */
function buildLives(n) {
  const el = document.getElementById('lives-dots');
  el.innerHTML = '';
  for (let i = 0; i < MAX_LIVES; i++) {
    const d = document.createElement('div');
    d.id        = `ld${i}`;
    d.className = 'ldot' + (i < n ? '' : ' dead');
    el.appendChild(d);
  }
}

function killDot(idx) {
  const d = document.getElementById(`ld${idx}`);
  if (d) { d.classList.add('dead', 'dying'); }
}

/* ════════════════════════════════════════════════════════
   HUD UPDATE
════════════════════════════════════════════════════════ */
function hudUpdate() {
  document.getElementById('h-score').textContent = gs.score.toLocaleString();
  document.getElementById('h-lvl').textContent   = gs.level;
  document.getElementById('combo-n').textContent  = gs.combo;
  document.getElementById('i-combo').textContent = '×' + gs.combo;
  document.getElementById('i-words').textContent = gs.destroyed;

  document.getElementById('combo-badge').classList.toggle('show', gs.combo >= 3);
  document.getElementById('prog-fill').style.width =
    ((gs.destroyed % 10) / 10 * 100) + '%';

  const elapsed = (Date.now() - tStart) / 60000 || 0.001;
  const wpm = Math.round((charHits / 5) / elapsed);
  const att = charHits + charMiss;
  const acc = att > 5 ? Math.round(charHits / att * 100) : 100;

  document.getElementById('m-wpm').textContent = wpm > 0 ? wpm : '—';
  document.getElementById('m-acc').textContent = att > 10 ? acc + '%' : '—';
}

function popVal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 200);
}

/* ════════════════════════════════════════════════════════
   GAME INIT
════════════════════════════════════════════════════════ */
function initGame() {
  entities = []; particles = []; floaters = [];
  const d = DIFF[diff];
  gs = { score: 0, level: 1, lives: d.lives, destroyed: 0, combo: 0, bestCombo: 0 };
  charHits = 0; charMiss = 0; tStart = Date.now();
  document.getElementById('wi').value = '';
  buildLives(d.lives);
  hudUpdate();
}

/* ════════════════════════════════════════════════════════
   WORD SPAWNER
════════════════════════════════════════════════════════ */
function spawnWord() {
  if (!running) return;
  const d    = DIFF[diff];
  const pool = WORDS.filter(w => w.length <= d.maxLen);
  const txt  = pool[Math.floor(Math.random() * pool.length)].toLowerCase();
  const ci   = Math.ceil(Math.random() * 6);  // color index 1–6

  /* Measure at base size then choose final size */
  cx.font = `700 20px 'Share Tech Mono',monospace`;
  const baseW = cx.measureText(txt).width;

  const fz = Math.max(15, 23 - txt.length);  // font size: shorter word = bigger
  cx.font = `700 ${fz}px 'Share Tech Mono',monospace`;
  const tw = cx.measureText(txt).width;

  const PAD = 24;
  const x   = PAD + Math.random() * Math.max(10, W - tw - PAD * 2);
  const spd = (d.baseSpd + (gs.level - 1) * d.spdInc) * (0.75 + Math.random() * 0.52);

  /* Build per-character letter objects for animated destruction */
  const letters = [];
  let cx2 = 0;
  for (let i = 0; i < txt.length; i++) {
    const cw = cx.measureText(txt[i]).width;
    letters.push({
      ch: txt[i], x: cx2, w: cw,
      alpha: 1, scale: 1,
      dying: false, dyingSpeed: 0,
    });
    cx2 += cw;
  }

  entities.push({
    txt, x, y: -60, tw, fz, ci, spd, letters,
    typedLen: 0,
    matched: false, dying: false,
    alpha: 1, bodyAlpha: 1,
    glow: 0,
    wobble:    Math.random() * Math.PI * 2,
    wobbleAmp: 0.6 + Math.random() * 1.4,
    wobbleSpd: 0.018 + Math.random() * 0.035,
    spawnTime: Date.now(),
  });
}

function startSpawnCycle() {
  clearInterval(spawnTimer);
  const base     = DIFF[diff].spawnMs;
  const interval = Math.max(400, base - (gs.level - 1) * 50);
  spawnTimer = setInterval(() => {
    if (entities.filter(e => !e.matched).length < 14) spawnWord();
  }, interval);
}

/* ════════════════════════════════════════════════════════
   PARTICLE SYSTEM
════════════════════════════════════════════════════════ */
function burst(bx, by, ci, len) {
  const c = wCols(ci);
  const n = 18 + len * 3;

  /* Radial dot particles */
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i / n) + (Math.random() - 0.5) * 0.8;
    const spd = 1.5 + Math.random() * 5.5;
    particles.push({
      kind: 'dot',
      x: bx, y: by,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 1.5,
      r: 1.6 + Math.random() * 3.8,
      alpha: 1, color: c.s, shrink: 0.93,
    });
  }

  /* Spark streak particles */
  for (let i = 0; i < 8; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 7;
    particles.push({
      kind: 'spark',
      x: bx, y: by,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2,
      ax: Math.cos(ang), ay: Math.sin(ang),
      len: 8 + Math.random() * 16,
      alpha: 1, r: 0.8, color: c.s, shrink: 0.88,
    });
  }

  /* Expanding ring particles */
  particles.push({ kind: 'ring', x: bx, y: by, r: 4, alpha: 0.9, spd: 3.5, color: c.s });
  particles.push({ kind: 'ring', x: bx, y: by, r: 2, alpha: 0.55, spd: 2.2, color: '#fff' });

  /* Floating glitch characters */
  const glitch = ['0','1','>','<','#','*','!','@','%','&'];
  for (let i = 0; i < 6; i++) {
    particles.push({
      kind: 'glyph',
      x: bx + (Math.random() - 0.5) * 40,
      y: by + (Math.random() - 0.5) * 25,
      ch: glitch[Math.floor(Math.random() * glitch.length)],
      vy: -1.8 - Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 1.8,
      alpha: 1, color: c.g,
    });
  }
}

function addFloat(x, y, txt, color) {
  floaters.push({
    x, y, txt, color,
    alpha: 1, vy: -2.4,
    vx: (Math.random() - 0.5) * 1.0,
  });
}

/* ════════════════════════════════════════════════════════
   DESTROY WORD
════════════════════════════════════════════════════════ */
function destroyWord(idx) {
  const e   = entities[idx];
  e.matched = true;
  e.dying   = true;

  /* Trigger dying animation on all remaining letters */
  e.letters.forEach(l => {
    if (!l.dying) {
      l.dying      = true;
      l.dyingSpeed = 0.06 + Math.random() * 0.06;
    }
  });

  const ex = e.x + e.tw / 2;
  const ey = e.y - e.fz / 2;

  burst(ex, ey, e.ci, e.txt.length);
  SFX.destroy(e.txt.length);

  gs.combo++;
  if (gs.combo > gs.bestCombo) gs.bestCombo = gs.combo;
  if (gs.combo >= 3) SFX.combo(gs.combo);

  const mult  = 1 + (gs.combo - 1) * 0.40;
  const pts   = Math.round(e.txt.length * 15 * mult * gs.level);
  gs.score    += pts;
  gs.destroyed++;

  const c     = wCols(e.ci);
  const label = gs.combo >= 3 ? `+${pts} 🔥×${gs.combo}` : `+${pts}`;
  addFloat(ex, e.y - e.fz - 14, label, c.s);

  const newLvl = Math.floor(gs.destroyed / 10) + 1;
  if (newLvl > gs.level) {
    gs.level = newLvl;
    showLevelUp();
    startSpawnCycle();
    SFX.levelup();
  }

  hudUpdate();
  popVal('h-score');
}

function showLevelUp() {
  const el  = document.getElementById('lvl-up');
  const txt = document.getElementById('lvl-txt');
  txt.textContent = `LEVEL ${gs.level} ↑`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

/* ════════════════════════════════════════════════════════
   MISS WORD
════════════════════════════════════════════════════════ */
function missWord(idx) {
  entities.splice(idx, 1);
  const lifeIdx = gs.lives - 1;
  gs.lives--;
  gs.combo = 0;
  SFX.miss();
  killDot(lifeIdx);

  const dr = document.getElementById('danger-ring');
  dr.classList.add('flash');
  setTimeout(() => dr.classList.remove('flash'), 450);
  dr.classList.toggle('critical', gs.lives <= 3);

  hudUpdate();
  if (gs.lives <= 0) endGame();
}

/* ════════════════════════════════════════════════════════
   GAME OVER
════════════════════════════════════════════════════════ */
function endGame() {
  running = false;
  clearInterval(spawnTimer);
  cancelAnimationFrame(rafId);
  document.getElementById('danger-ring').classList.remove('critical', 'flash');

  const elapsed = (Date.now() - tStart) / 60000 || 0.001;
  const wpm     = Math.round((charHits / 5) / elapsed);
  const att     = charHits + charMiss;
  const acc     = att > 0 ? Math.round(charHits / att * 100) : 100;

  const msgs = [
    'The words were too fast for you this time.',
    'You ran out of lives — try again!',
    'So close! One more round and you will do better.',
    'Too many words slipped past you.',
    'Game over — your fingers need more practice.',
    'The words beat you — but not for long!',
  ];

  document.getElementById('r-score').textContent  = gs.score.toLocaleString();
  document.getElementById('r-words').textContent  = gs.destroyed;
  document.getElementById('r-level').textContent  = gs.level;
  document.getElementById('r-combo').textContent  = gs.bestCombo;
  document.getElementById('r-wpm').textContent    = wpm;
  document.getElementById('r-acc').textContent    = acc + '%';
  document.getElementById('over-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
  document.getElementById('perf-tag').textContent =
    `WPM: ${wpm}  ·  ACC: ${acc}%  ·  WORDS: ${gs.destroyed}  ·  LEVEL: ${gs.level}`;

  showScreen('s-over');
}

/* ════════════════════════════════════════════════════════
   RENDER — ROUNDED RECT HELPER
════════════════════════════════════════════════════════ */
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);   c.quadraticCurveTo(x + w, y,     x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);   c.quadraticCurveTo(x,     y + h, x,     y + h - r);
  c.lineTo(x, y + r);       c.quadraticCurveTo(x,     y,     x + r, y);
  c.closePath();
}

/* ════════════════════════════════════════════════════════
   RENDER — DRAW PASS
════════════════════════════════════════════════════════ */
function draw() {
  cx.clearRect(0, 0, W, H);

  /* Ground danger line */
  cx.save();
  cx.strokeStyle = 'rgba(255,40,70,0.10)';
  cx.lineWidth   = 1;
  cx.setLineDash([5, 15]);
  cx.beginPath(); cx.moveTo(0, H - 1); cx.lineTo(W, H - 1);
  cx.stroke();
  cx.setLineDash([]);
  cx.restore();

  const typed = wi.value.toLowerCase().trim();
  const ink0  = css('--ink0');

  /* ── WORD ENTITIES ── */
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.alpha <= 0) continue;

    const c = wCols(e.ci);
    cx.save();
    cx.globalAlpha = e.alpha;
    cx.font = `700 ${e.fz}px 'Share Tech Mono',monospace`;

    const PX = 14, PY = 9;
    const bw = e.tw + PX * 2;
    const bh = e.fz + PY * 2;
    const wx = e.x - PX + Math.sin(e.wobble) * e.wobbleAmp;
    const by = e.y - e.fz - PY;

    /* Pill background */
    cx.fillStyle   = c.k;
    cx.shadowColor = 'transparent';
    rr(cx, wx, by, bw, bh, 8);
    cx.fill();

    /* Pill border — glows while being typed */
    cx.strokeStyle = c.s;
    cx.lineWidth   = e.glow > 0.3 ? 2.2 : 1.5;
    cx.shadowColor = c.g;
    cx.shadowBlur  = e.glow * 28 + 5;
    rr(cx, wx, by, bw, bh, 8);
    cx.stroke();
    cx.shadowBlur  = 0;

    /* Top highlight line */
    cx.beginPath();
    cx.moveTo(wx + 8, by + 1);
    cx.lineTo(wx + bw - 8, by + 1);
    cx.strokeStyle = `rgba(255,255,255,${0.10 + e.glow * 0.12})`;
    cx.lineWidth   = 1;
    cx.stroke();

    /* Per-letter character rendering */
    const isMatching = typed && e.txt.startsWith(typed);
    let letterX = e.x + Math.sin(e.wobble) * e.wobbleAmp;

    for (let j = 0; j < e.letters.length; j++) {
      const lt = e.letters[j];
      if (lt.alpha <= 0) { letterX += lt.w; continue; }

      cx.save();
      cx.globalAlpha = e.alpha * lt.alpha;

      if (lt.dying) {
        const cx_ = letterX + lt.w / 2;
        const cy_ = e.y;
        cx.translate(cx_, cy_);
        cx.scale(lt.scale, lt.scale);
        cx.translate(-lt.w / 2, 0);
      }

      if (j < e.typedLen) {
        /* Already typed — bright, shrinking */
        cx.fillStyle   = c.s;
        cx.shadowColor = c.g;
        cx.shadowBlur  = 20;
      } else if (isMatching && j < typed.length) {
        /* Currently matching */
        cx.fillStyle   = c.s;
        cx.shadowColor = c.g;
        cx.shadowBlur  = 16;
      } else {
        /* Untyped — white, high contrast */
        cx.fillStyle   = ink0;
        cx.shadowBlur  = 0;
      }

      if (lt.dying) {
        cx.fillText(lt.ch, 0, 0);
      } else {
        cx.fillText(lt.ch, letterX, e.y);
      }
      cx.restore();

      letterX += lt.w;
    }

    /* Typing progress underline */
    if (e.typedLen > 0 && !e.dying) {
      cx.font = `700 ${e.fz}px 'Share Tech Mono',monospace`;
      let pw = 0;
      for (let k = 0; k < e.typedLen; k++) pw += e.letters[k]?.w || 0;
      const ux = e.x + Math.sin(e.wobble) * e.wobbleAmp;
      cx.save();
      cx.globalAlpha = e.alpha * 0.85;
      cx.strokeStyle = c.s;
      cx.lineWidth   = 2.5;
      cx.shadowColor = c.g;
      cx.shadowBlur  = 12;
      cx.beginPath();
      cx.moveTo(ux, e.y + 4);
      cx.lineTo(ux + pw, e.y + 4);
      cx.stroke();
      cx.restore();
    }

    cx.restore();
  }

  /* ── PARTICLES ── */
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.alpha <= 0) continue;
    cx.save();
    cx.globalAlpha = p.alpha;

    if (p.kind === 'ring') {
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.strokeStyle = p.color;
      cx.lineWidth   = 1.8;
      cx.shadowColor = p.color;
      cx.shadowBlur  = 14;
      cx.stroke();
    } else if (p.kind === 'spark') {
      cx.beginPath();
      cx.moveTo(p.x, p.y);
      cx.lineTo(p.x + p.ax * p.len * p.alpha, p.y + p.ay * p.len * p.alpha);
      cx.strokeStyle = p.color;
      cx.lineWidth   = 1.2;
      cx.shadowColor = p.color;
      cx.shadowBlur  = 7;
      cx.stroke();
    } else if (p.kind === 'glyph') {
      cx.font        = "bold 11px 'Share Tech Mono',monospace";
      cx.fillStyle   = p.color;
      cx.shadowColor = p.color;
      cx.shadowBlur  = 10;
      cx.fillText(p.ch, p.x, p.y);
    } else {
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle   = p.color;
      cx.shadowColor = p.color;
      cx.shadowBlur  = 9;
      cx.fill();
    }
    cx.restore();
  }

  /* ── FLOATING SCORE LABELS ── */
  cx.textAlign = 'center';
  for (const f of floaters) {
    if (f.alpha <= 0) continue;
    cx.save();
    cx.globalAlpha = f.alpha;
    cx.font        = "bold 12px 'Exo 2',sans-serif";
    cx.fillStyle   = f.color;
    cx.shadowColor = f.color;
    cx.shadowBlur  = 16;
    cx.fillText(f.txt, f.x, f.y);
    cx.restore();
  }
  cx.textAlign = 'left';
}

/* ════════════════════════════════════════════════════════
   UPDATE PASS
════════════════════════════════════════════════════════ */
function update() {
  const typed = wi.value.toLowerCase().trim();

  /* Update word entities */
  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];

    if (e.dying) {
      const allGone = e.letters.every(l => l.alpha <= 0);
      if (allGone) { e.alpha -= 0.1; e.y -= 1.5; }
      e.letters.forEach(l => {
        if (l.dying) {
          l.alpha -= l.dyingSpeed;
          l.scale  = Math.max(0.01, l.scale - l.dyingSpeed * 0.6);
        }
      });
      if (e.alpha <= 0) entities.splice(i, 1);
    } else {
      e.y      += e.spd;
      e.wobble += e.wobbleSpd;
      e.glow    = Math.max(0, e.glow - 0.05);

      if (typed && e.txt.startsWith(typed)) {
        e.glow     = Math.min(1, e.glow + 0.32);
        e.typedLen = typed.length;

        /* Mark consumed letters as dying */
        for (let j = 0; j < typed.length; j++) {
          const lt = e.letters[j];
          if (lt && !lt.dying) {
            lt.dying      = true;
            lt.dyingSpeed = 0.07 + Math.random() * 0.07;
          }
        }
      } else {
        /* Reset partial match if input no longer matches */
        if (e.typedLen > 0) {
          e.letters.forEach((l, idx) => {
            if (idx < e.typedLen) {
              l.dying = false; l.alpha = 1; l.scale = 1;
            }
          });
          e.typedLen = 0;
        }
      }

      if (e.y > H + 40) missWord(i);
    }
  }

  /* Update particles */
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.kind === 'ring') {
      p.r += p.spd; p.alpha -= 0.052;
    } else if (p.kind === 'spark') {
      p.x += p.vx; p.y += p.vy; p.vy += 0.20; p.alpha -= 0.038;
    } else if (p.kind === 'glyph') {
      p.x += p.vx; p.y += p.vy; p.vy += 0.10; p.alpha -= 0.024;
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12;
      p.alpha -= 0.025; p.r *= p.shrink;
    }
    if (p.alpha <= 0 || p.r < 0.1) particles.splice(i, 1);
  }

  /* Update floaters */
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.x += f.vx; f.y += f.vy; f.alpha -= 0.016;
    if (f.alpha <= 0) floaters.splice(i, 1);
  }
}

/* ════════════════════════════════════════════════════════
   MAIN LOOP
════════════════════════════════════════════════════════ */
function loop() {
  update();
  draw();
  rafId = requestAnimationFrame(loop);
}

/* ════════════════════════════════════════════════════════
   INPUT — REAL-TIME AUTO-DESTROY
════════════════════════════════════════════════════════ */
const wi = document.getElementById('wi');

wi.addEventListener('input', () => {
  wake();
  const typed = wi.value.toLowerCase();
  if (!typed) {
    entities.forEach(e => {
      if (e.typedLen > 0) {
        e.letters.forEach((l, idx) => {
          if (idx < e.typedLen) { l.dying = false; l.alpha = 1; l.scale = 1; }
        });
        e.typedLen = 0;
        e.glow     = 0;
      }
    });
    return;
  }

  /* Find deepest exact match */
  let found = -1, bestY = -Infinity;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (!e.matched && e.txt === typed && e.y > bestY) {
      bestY = e.y; found = i;
    }
  }

  if (found !== -1) {
    charHits += entities[found].txt.length;
    destroyWord(found);
    wi.value = '';
    wi.classList.add('hit');
    setTimeout(() => wi.classList.remove('hit'), 230);
  } else {
    let anyMatch = false;
    for (const e of entities) {
      if (!e.matched && e.txt.startsWith(typed)) { anyMatch = true; break; }
    }
    if (anyMatch) {
      SFX.key();
      charHits++;
    } else {
      charMiss++;
      wi.classList.add('miss');
      setTimeout(() => wi.classList.remove('miss'), 320);
    }
  }

  hudUpdate();
});

/* Enter as fallback submit */
wi.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    wake();
    const typed = wi.value.toLowerCase().trim();
    if (!typed) return;
    let found = -1, bestY = -Infinity;
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.matched && ent.txt === typed && ent.y > bestY) {
        bestY = ent.y; found = i;
      }
    }
    if (found !== -1) {
      charHits += entities[found].txt.length;
      destroyWord(found);
      wi.value = '';
      wi.classList.add('hit');
      setTimeout(() => wi.classList.remove('hit'), 230);
    } else {
      gs.combo = 0;
      charMiss++;
      wi.classList.add('miss');
      setTimeout(() => { wi.classList.remove('miss'); wi.value = ''; }, 340);
    }
    hudUpdate();
  }
  if (e.key === 'Escape') wi.value = '';
});

/* Auto-focus input while playing */
document.addEventListener('keydown', e => {
  if (running && document.activeElement !== wi && e.key !== 'Escape') wi.focus();
});

/* ════════════════════════════════════════════════════════
   SCREEN MANAGEMENT
════════════════════════════════════════════════════════ */
function showScreen(id) {
  ['s-start', 's-over'].forEach(s =>
    document.getElementById(s).classList.toggle('gone', s !== id)
  );
}
function hideScreens() {
  ['s-start', 's-over'].forEach(s =>
    document.getElementById(s).classList.add('gone')
  );
}

/* ════════════════════════════════════════════════════════
   START / RESTART
════════════════════════════════════════════════════════ */
function startGame() {
  wake();
  hideScreens();
  resize();
  initGame();
  running = true;
  startSpawnCycle();
  cancelAnimationFrame(rafId);
  loop();
  setTimeout(() => wi.focus(), 80);
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

/* ════════════════════════════════════════════════════════
   DIFFICULTY BUTTONS
════════════════════════════════════════════════════════ */
document.querySelectorAll('.dbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dbtn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    diff = btn.dataset.d;
  });
});
