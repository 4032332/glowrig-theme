/* hero-aurora.js — animated RGB aurora for GlowRig hero */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Brand palette as [r, g, b]
  const PURPLE = [180, 79, 255];
  const CYAN   = [0, 245, 255];
  const PINK   = [255, 68, 170];

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  let W, H;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    W = canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 600;
    H = canvas.height = canvas.clientHeight || canvas.offsetHeight || 480;
  }
  window.addEventListener('resize', resize);
  // Delay first resize so CSS has painted the canvas dimensions
  setTimeout(resize, 0);

  // Mouse parallax — track relative to the canvas
  const heroEl = canvas.closest('.hero-section') || document.documentElement;
  heroEl.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () {
    mouse.tx = 0.5; mouse.ty = 0.5;
  });

  // ── Aurora band definitions ──────────────────────────────────────────────
  // yBase: vertical centre as fraction of H
  // thick: half-height of the band as fraction of H
  // speed, phase: drive the sine-wave animation
  var bands = [
    { color: PURPLE, alpha: 0.50, speed: 4.0e-4, phase: 0.00,            yBase: 0.40, thick: 0.16 },
    { color: CYAN,   alpha: 0.40, speed: 3.0e-4, phase: Math.PI * 0.65,  yBase: 0.54, thick: 0.13 },
    { color: PURPLE, alpha: 0.28, speed: 2.5e-4, phase: Math.PI * 1.30,  yBase: 0.31, thick: 0.12 },
    { color: CYAN,   alpha: 0.32, speed: 5.0e-4, phase: Math.PI * 0.20,  yBase: 0.64, thick: 0.14 },
    { color: PINK,   alpha: 0.18, speed: 3.5e-4, phase: Math.PI * 1.80,  yBase: 0.47, thick: 0.10 },
    { color: PURPLE, alpha: 0.15, speed: 2.0e-4, phase: Math.PI * 0.95,  yBase: 0.72, thick: 0.09 },
  ];

  // ── Particle field ───────────────────────────────────────────────────────
  var particles = [];
  var PALETTE = [PURPLE, CYAN, CYAN, PURPLE, PINK];
  for (var i = 0; i < 55; i++) {
    particles.push({
      x:          Math.random(),
      y:          0.15 + Math.random() * 0.70,
      r:          0.6  + Math.random() * 1.8,
      drift:      3e-5 + Math.random() * 7e-5,
      bobSpeed:   8e-4 + Math.random() * 1.2e-3,
      bobAmp:     0.025 + Math.random() * 0.045,
      phase:      Math.random() * Math.PI * 2,
      pulseSpeed: 1.5e-3 + Math.random() * 2.0e-3,
      color:      PALETTE[Math.floor(Math.random() * PALETTE.length)],
      alpha:      0.35 + Math.random() * 0.55,
    });
  }

  // ── Draw one aurora band ─────────────────────────────────────────────────
  function drawBand(b, t) {
    var mx   = (mouse.x - 0.5) * 55;
    var yc   = H * b.yBase;
    var half = H * b.thick;

    // Four y-positions (start, cp1, cp2, end) for top and bottom bezier edges.
    // Each point gets a slightly different sine phase so the band undulates.
    var w = function (mul, off) { return Math.sin(t * b.speed * mul + b.phase + off) * H * 0.065; };

    var ty = [yc - half + w(1.0, 0.0), yc - half * 0.75 + w(1.4, 1.1),
              yc - half * 1.20 + w(0.9, 2.2), yc - half + w(1.1, 3.0)];
    var by = [yc + half - w(0.8, 1.1), yc + half * 1.10 - w(1.3, 2.2),
              yc + half * 0.85 - w(1.0, 3.0), yc + half - w(1.2, 0.0)];

    // Gradient runs top→bottom through the band centre
    var grad = ctx.createLinearGradient(0, yc - half, 0, yc + half);
    grad.addColorStop(0.00, rgba(b.color, 0));
    grad.addColorStop(0.30, rgba(b.color, b.alpha * 0.35));
    grad.addColorStop(0.50, rgba(b.color, b.alpha));
    grad.addColorStop(0.70, rgba(b.color, b.alpha * 0.35));
    grad.addColorStop(1.00, rgba(b.color, 0));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(-70 + mx * 0.2, ty[0]);
    ctx.bezierCurveTo(
      W * 0.28 + mx * 0.45, ty[1],
      W * 0.66 + mx * 0.25, ty[2],
      W + 70   + mx * 0.10, ty[3]
    );
    ctx.lineTo(W + 70 + mx * 0.10, by[3]);
    ctx.bezierCurveTo(
      W * 0.66 + mx * 0.25, by[2],
      W * 0.28 + mx * 0.45, by[1],
      -70      + mx * 0.20, by[0]
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── Draw glowing particles ───────────────────────────────────────────────
  function drawParticles(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < particles.length; i++) {
      var p  = particles[i];
      var px = ((p.x + t * p.drift) % 1) * W;
      var py = p.y * H + Math.sin(t * p.bobSpeed + p.phase) * p.bobAmp * H;
      var pa = p.alpha * (0.45 + 0.55 * Math.sin(t * p.pulseSpeed + p.phase));
      var gr = p.r * 5;

      var grd = ctx.createRadialGradient(px, py, 0, px, py, gr);
      grd.addColorStop(0.0, rgba(p.color, pa));
      grd.addColorStop(0.4, rgba(p.color, pa * 0.35));
      grd.addColorStop(1.0, rgba(p.color, 0));

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(px, py, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Animation loop ───────────────────────────────────────────────────────
  var raf;

  function frame(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;

    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < bands.length; i++) drawBand(bands[i], t);
    drawParticles(t);

    raf = requestAnimationFrame(frame);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () {
      resize();
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bands.length; i++) drawBand(bands[i], 800);
      drawParticles(800);
    }, 50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
