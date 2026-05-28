/* ============================================================
   NEXTYPE v5.0 — background.js
   Handles: animated neural-net canvas, blob drift, dot grid
============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════
   NEURAL NETWORK BACKGROUND
   Animated nodes + connecting edges on a fixed canvas
════════════════════════════════════════════════════════ */
const BG  = document.getElementById('neural-bg');
const bgx = BG.getContext('2d');
let bgNodes = [];

function buildBgNodes() {
  BG.width  = window.innerWidth;
  BG.height = window.innerHeight;
  bgNodes = Array.from({ length: 65 }, () => ({
    x:  Math.random() * BG.width,
    y:  Math.random() * BG.height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    r:  0.7 + Math.random() * 2.2,
    a:  0.12 + Math.random() * 0.40,
  }));
}

function animateBg() {
  bgx.clearRect(0, 0, BG.width, BG.height);
  const nc = getComputedStyle(document.documentElement)
    .getPropertyValue('--nc').trim();

  /* Draw edges between nearby nodes */
  for (let i = 0; i < bgNodes.length; i++) {
    for (let j = i + 1; j < bgNodes.length; j++) {
      const dx   = bgNodes[i].x - bgNodes[j].x;
      const dy   = bgNodes[i].y - bgNodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const t = 1 - dist / 150;
        bgx.beginPath();
        bgx.strokeStyle = nc.replace(/[\d.]+\)$/, `${(t * 0.10).toFixed(3)})`);
        bgx.lineWidth = 0.7;
        bgx.moveTo(bgNodes[i].x, bgNodes[i].y);
        bgx.lineTo(bgNodes[j].x, bgNodes[j].y);
        bgx.stroke();
      }
    }
  }

  /* Draw and move nodes */
  bgNodes.forEach(n => {
    bgx.beginPath();
    bgx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    bgx.fillStyle = nc;
    bgx.fill();

    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > BG.width)  n.vx *= -1;
    if (n.y < 0 || n.y > BG.height) n.vy *= -1;
  });

  requestAnimationFrame(animateBg);
}

/* Resize the bg canvas on window resize */
window.addEventListener('resize', () => {
  BG.width  = window.innerWidth;
  BG.height = window.innerHeight;
});
