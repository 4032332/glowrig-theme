/* hero-aurora.js — atom model + aurora backdrop for GlowRig hero */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PURPLE = [180, 79, 255];
  const CYAN   = [0, 245, 255];
  const PINK   = [255, 68, 170];
  const WHITE  = [255, 255, 255];

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  let W, H, cx, cy;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    W  = canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 600;
    H  = canvas.height = canvas.clientHeight || canvas.offsetHeight || 480;
    cx = W * 0.5;
    cy = H * 0.5;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 0);

  const heroEl = canvas.closest('.hero-section') || document.documentElement;
  heroEl.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left)  / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)   / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () { mouse.tx = 0.5; mouse.ty = 0.5; });

  // ── Background aurora bands (subtle, behind atom) ────────────────────────
  var bands = [
    { color: PURPLE, alpha: 0.22, speed: 3.5e-4, phase: 0.0,           yBase: 0.38, thick: 0.14 },
    { color: CYAN,   alpha: 0.18, speed: 2.8e-4, phase: Math.PI * 0.7, yBase: 0.56, thick: 0.12 },
    { color: PINK,   alpha: 0.10, speed: 3.0e-4, phase: Math.PI * 1.5, yBase: 0.47, thick: 0.09 },
  ];

  function drawBand(b, t) {
    var mx   = (mouse.x - 0.5) * 40;
    var yc   = H * b.yBase;
    var half = H * b.thick;
    var w = function (mul, off) { return Math.sin(t * b.speed * mul + b.phase + off) * H * 0.055; };
    var ty = [yc - half + w(1.0, 0), yc - half * 0.8 + w(1.3, 1), yc - half * 1.1 + w(0.9, 2), yc - half + w(1.1, 3)];
    var by = [yc + half - w(0.8, 1), yc + half * 1.1 - w(1.2, 2), yc + half * 0.9 - w(1.0, 3), yc + half - w(1.1, 0)];
    var grad = ctx.createLinearGradient(0, yc - half, 0, yc + half);
    grad.addColorStop(0,    rgba(b.color, 0));
    grad.addColorStop(0.35, rgba(b.color, b.alpha * 0.4));
    grad.addColorStop(0.50, rgba(b.color, b.alpha));
    grad.addColorStop(0.65, rgba(b.color, b.alpha * 0.4));
    grad.addColorStop(1,    rgba(b.color, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-60 + mx * 0.15, ty[0]);
    ctx.bezierCurveTo(W * 0.28 + mx * 0.35, ty[1], W * 0.66 + mx * 0.2, ty[2], W + 60 + mx * 0.08, ty[3]);
    ctx.lineTo(W + 60 + mx * 0.08, by[3]);
    ctx.bezierCurveTo(W * 0.66 + mx * 0.2, by[2], W * 0.28 + mx * 0.35, by[1], -60 + mx * 0.15, by[0]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── Atom: orbital ring definitions ───────────────────────────────────────
  // Each orbit is an ellipse drawn at rotation `rot`.
  // `ry` is the compressed vertical radius — determines apparent 3D tilt.
  // `depthFactor` (0–1) controls how much depth shading applies to electrons.
  // A depthFactor of 1 = strongly tilted ring; 0 = ring facing camera.
  var ORBIT_R = Math.min(W, H) * 0.32; // set at render time
  var orbits = [
    { color: PURPLE, rot: 0,              rx: 1.0, ryFrac: 0.22, speed:  1.4e-3, depthFactor: 0.95, electrons: [0, Math.PI] },
    { color: CYAN,   rot: Math.PI / 3,    rx: 0.9, ryFrac: 0.30, speed: -1.1e-3, depthFactor: 0.85, electrons: [Math.PI * 0.5, Math.PI * 1.5] },
    { color: PINK,   rot: Math.PI * 2/3,  rx: 0.85,ryFrac: 0.18, speed:  1.7e-3, depthFactor: 0.92, electrons: [Math.PI * 0.25, Math.PI * 1.25] },
  ];

  // ── Nucleus ──────────────────────────────────────────────────────────────
  var nucleusPulse = 0;

  function drawNucleus(t) {
    // Slow pulse
    var pulse = 1 + 0.08 * Math.sin(t * 0.0018);
    var nr = 14 * pulse;

    // Outer glow
    var og = ctx.createRadialGradient(cx, cy, 0, cx, cy, nr * 5);
    og.addColorStop(0,    rgba(WHITE,  0.25));
    og.addColorStop(0.15, rgba(PURPLE, 0.45));
    og.addColorStop(0.40, rgba(CYAN,   0.18));
    og.addColorStop(1,    rgba(PURPLE, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, nr * 5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, nr);
    cg.addColorStop(0,   rgba(WHITE,  0.95));
    cg.addColorStop(0.4, rgba(CYAN,   0.80));
    cg.addColorStop(0.8, rgba(PURPLE, 0.60));
    cg.addColorStop(1,   rgba(PURPLE, 0));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, nr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Draw one orbital ring (ellipse with back half dashed) ─────────────────
  function drawRing(o, rx, ry) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.rot);

    // Back half — dashed, faint
    ctx.beginPath();
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = rgba(o.color, 0.18);
    ctx.lineWidth = 1;
    // Back half of ellipse runs from π to 2π (sin < 0 = behind)
    // Draw as a manual arc using parametric points
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2, false);
    ctx.stroke();

    // Front half — solid, brighter
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(o.color, 0.38);
    ctx.lineWidth = 1;
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI, false);
    ctx.stroke();

    ctx.restore();
  }

  // ── Draw one electron with glow and depth shading ────────────────────────
  function drawElectron(o, phase, t, rx, ry) {
    var angle = t * o.speed + phase;

    // Position on the ellipse (pre-rotation)
    var lx = rx * Math.cos(angle);
    var ly = ry * Math.sin(angle);

    // Rotate into canvas space
    var cos = Math.cos(o.rot);
    var sin = Math.sin(o.rot);
    var ex  = cx + lx * cos - ly * sin;
    var ey  = cy + lx * sin + ly * cos;

    // Depth: sin(angle) > 0 → front half (coming toward viewer)
    var z = Math.sin(angle) * o.depthFactor; // -1 (back) to +1 (front)

    // Skip electrons deep in the back (behind the nucleus obscures them)
    var baseAlpha = 0.55 + z * 0.35;
    var size      = 3.5 + z * 1.8;
    var glowRad   = size * 4.5;

    // Glow
    var grd = ctx.createRadialGradient(ex, ey, 0, ex, ey, glowRad);
    grd.addColorStop(0,    rgba(WHITE,    baseAlpha * 0.9));
    grd.addColorStop(0.15, rgba(o.color,  baseAlpha));
    grd.addColorStop(0.50, rgba(o.color,  baseAlpha * 0.35));
    grd.addColorStop(1,    rgba(o.color,  0));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(ex, ey, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // Bright core dot
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(WHITE, baseAlpha * 0.85);
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    return { x: ex, y: ey, z: z };
  }

  // ── Main render ──────────────────────────────────────────────────────────
  function render(t) {
    // Mouse parallax: slight tilt of the whole scene
    var tiltX = (mouse.x - 0.5) * 0.18;
    var tiltY = (mouse.y - 0.5) * 0.10;

    ctx.clearRect(0, 0, W, H);

    // Background aurora
    for (var i = 0; i < bands.length; i++) drawBand(bands[i], t);

    // Compute orbit radii relative to current canvas size
    var baseR = Math.min(W, H) * 0.30;

    // Rotate all orbits slightly with mouse
    for (var i = 0; i < orbits.length; i++) {
      var o  = orbits[i];
      var rx = baseR * o.rx;
      var ry = rx * o.ryFrac;

      // Apply mouse tilt as a small rotation offset to each orbit
      var savedRot = o.rot;
      o.rot = o.rot + tiltX * (i % 2 === 0 ? 1 : -1) * 0.12;

      drawRing(o, rx, ry);

      // Draw each electron on this orbit
      for (var j = 0; j < o.electrons.length; j++) {
        drawElectron(o, o.electrons[j], t, rx, ry);
      }

      o.rot = savedRot;
    }

    // Nucleus always on top
    drawNucleus(t);
  }

  var raf;
  function frame(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    render(t);
    raf = requestAnimationFrame(frame);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { resize(); render(1200); }, 50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
