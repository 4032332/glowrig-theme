/* hero-aurora.js — rotating particle sphere for GlowRig hero */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PURPLE = [180, 79, 255];
  const CYAN   = [0, 245, 255];
  const PINK   = [255, 68, 170];

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
    const r  = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () { mouse.tx = 0.5; mouse.ty = 0.5; });

  // ── Background aurora bands ───────────────────────────────────────────────
  const bands = [
    { color: PURPLE, alpha: 0.20, speed: 3.5e-4, phase: 0.0,           yBase: 0.36, thick: 0.13 },
    { color: CYAN,   alpha: 0.16, speed: 2.8e-4, phase: Math.PI * 0.7, yBase: 0.58, thick: 0.11 },
    { color: PINK,   alpha: 0.09, speed: 3.0e-4, phase: Math.PI * 1.5, yBase: 0.47, thick: 0.08 },
  ];

  function drawBand(b, t) {
    const mx   = (mouse.x - 0.5) * 40;
    const yc   = H * b.yBase;
    const half = H * b.thick;
    const w    = (mul, off) => Math.sin(t * b.speed * mul + b.phase + off) * H * 0.05;
    const ty   = [yc - half + w(1.0, 0), yc - half * 0.8 + w(1.3, 1), yc - half * 1.1 + w(0.9, 2), yc - half + w(1.1, 3)];
    const by   = [yc + half - w(0.8, 1), yc + half * 1.1 - w(1.2, 2), yc + half * 0.9 - w(1.0, 3), yc + half - w(1.1, 0)];
    const grad = ctx.createLinearGradient(0, yc - half, 0, yc + half);
    grad.addColorStop(0,    rgba(b.color, 0));
    grad.addColorStop(0.35, rgba(b.color, b.alpha * 0.4));
    grad.addColorStop(0.5,  rgba(b.color, b.alpha));
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

  // ── Particle sphere ───────────────────────────────────────────────────────
  // Particles live on the surface of a unit sphere using spherical coordinates.
  // theta = polar angle [0, PI], phi = azimuthal angle [0, 2PI].
  // Each particle has its own angular drift (dPhi, dTheta) so they wander
  // continuously — the "electron bouncing" effect.

  const PALETTE = [PURPLE, PURPLE, CYAN, CYAN, PINK];

  const particles = Array.from({ length: 65 }, function () {
    // Uniform distribution on sphere surface (avoid pole clustering)
    const theta = Math.acos(2 * Math.random() - 1);
    const phi   = Math.random() * Math.PI * 2;
    return {
      theta:      theta,
      phi:        phi,
      // Angular velocity — randomised so some zip, some drift
      dPhi:       (Math.random() - 0.5) * 0.0030,
      dTheta:     (Math.random() - 0.5) * 0.0020,
      // Random kick strength and phase for irregular jitter
      kickAmp:    0.0005 + Math.random() * 0.0012,
      kickSpeed:  0.0008 + Math.random() * 0.0015,
      kickPhase:  Math.random() * Math.PI * 2,
      color:      PALETTE[Math.floor(Math.random() * PALETTE.length)],
      baseAlpha:  0.55 + Math.random() * 0.45,
      baseSize:   1.5  + Math.random() * 2.5,
      pulseSpeed: 0.0012 + Math.random() * 0.0018,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  });

  // Auto-rotation angle accumulator
  let rotY = 0;
  let lastT = null;

  function updateAndDraw(t) {
    const dt = lastT === null ? 16 : Math.min(t - lastT, 50);
    lastT = t;

    // Accumulate Y-axis rotation
    rotY += dt * 0.00045;

    // Mouse adds slight tilt (X-axis) and extra spin (Y-axis)
    const extraY  = (mouse.x - 0.5) *  0.6;
    const extraX  = (mouse.y - 0.5) * -0.3;
    const totalY  = rotY + extraY;
    const cosY    = Math.cos(totalY);
    const sinY    = Math.sin(totalY);
    const cosX    = Math.cos(extraX);
    const sinX    = Math.sin(extraX);

    // Update each particle's position on the sphere surface
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Jitter: add a time-varying kick to angular velocity
      const kick = p.kickAmp * Math.sin(t * p.kickSpeed + p.kickPhase);
      p.phi   += p.dPhi   + kick;
      p.theta += p.dTheta + kick * 0.5;

      // Bounce theta off the poles so particles don't cluster
      if (p.theta < 0.08)             { p.theta = 0.08;             p.dTheta = Math.abs(p.dTheta); }
      if (p.theta > Math.PI - 0.08)   { p.theta = Math.PI - 0.08;   p.dTheta = -Math.abs(p.dTheta); }

      // 3D position on unit sphere
      const sinT = Math.sin(p.theta);
      const sx   = sinT * Math.cos(p.phi);
      const sy   = sinT * Math.sin(p.phi);
      const sz   = Math.cos(p.theta);

      // Rotate around Y axis
      const x1 =  sx * cosY + sz * sinY;
      const y1 =  sy;
      const z1 = -sx * sinY + sz * cosY;

      // Rotate around X axis (mouse tilt)
      const x2 =  x1;
      const y2 =  y1 * cosX - z1 * sinX;
      const z2 =  y1 * sinX + z1 * cosX;

      // Store screen-space result for sorted draw pass
      p._x = x2;
      p._y = y2;
      p._z = z2;
    }

    // Sort back-to-front so front particles render on top
    particles.sort((a, b) => a._z - b._z);

    // Sphere radius scales with the smaller canvas dimension
    const R = Math.min(W, H) * 0.34;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Project to canvas (orthographic — no perspective divide needed at this scale)
      const sx = cx + p._x * R;
      const sy = cy + p._y * R;

      // Depth shading: z ranges −1 (back) to +1 (front)
      const depth = (p._z + 1) * 0.5;           // 0..1
      const pulse = 0.65 + 0.35 * Math.sin(t * p.pulseSpeed + p.pulsePhase);
      const alpha = p.baseAlpha * (0.12 + 0.88 * depth) * pulse;
      const size  = p.baseSize  * (0.25 + 0.75 * depth);
      const glowR = size * 5.5;

      // Glow gradient
      const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      grd.addColorStop(0,   rgba(p.color, alpha));
      grd.addColorStop(0.4, rgba(p.color, alpha * 0.35));
      grd.addColorStop(1,   rgba(p.color, 0));

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Subtle sphere ambient glow (defines the shape even at low density) ────
  function drawSphereGlow() {
    const R = Math.min(W, H) * 0.34;
    const g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.1);
    g.addColorStop(0,   rgba(PURPLE, 0));
    g.addColorStop(0.7, rgba(PURPLE, 0.04));
    g.addColorStop(1,   rgba(PURPLE, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  let raf;
  function frame(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < bands.length; i++) drawBand(bands[i], t);
    drawSphereGlow();
    updateAndDraw(t);

    raf = requestAnimationFrame(frame);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { resize(); ctx.clearRect(0, 0, W, H); updateAndDraw(1200); }, 50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
