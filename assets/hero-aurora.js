/* hero-aurora.js — JARVIS-style holographic globe for GlowRig hero */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const PURPLE = [180, 79, 255];
  const CYAN   = [0, 245, 255];
  const PINK   = [255, 68, 170];
  const WHITE  = [255, 255, 255];

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  let W, H, cx, cy, R;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    W  = canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 600;
    H  = canvas.height = canvas.clientHeight || canvas.offsetHeight || 480;
    cx = W * 0.5;
    cy = H * 0.5;
    R  = Math.min(W, H) * 0.32;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 0);

  const heroEl = canvas.closest('.hero-section') || document.documentElement;
  heroEl.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () { mouse.tx = 0.5; mouse.ty = 0.5; });

  // ── Background aurora (very muted — globe is the star) ────────────────────
  const bands = [
    { color: PURPLE, alpha: 0.14, speed: 3.5e-4, phase: 0.0,           yBase: 0.35, thick: 0.11 },
    { color: CYAN,   alpha: 0.11, speed: 2.8e-4, phase: Math.PI * 0.7, yBase: 0.60, thick: 0.09 },
  ];
  function drawBand(b, t) {
    const mx = (mouse.x - 0.5) * 35;
    const yc = H * b.yBase, half = H * b.thick;
    const w  = (m, o) => Math.sin(t * b.speed * m + b.phase + o) * H * 0.045;
    const ty = [yc - half + w(1, 0), yc - half * 0.8 + w(1.3, 1), yc - half * 1.1 + w(0.9, 2), yc - half + w(1.1, 3)];
    const by = [yc + half - w(0.8, 1), yc + half * 1.1 - w(1.2, 2), yc + half * 0.9 - w(1.0, 3), yc + half - w(1.1, 0)];
    const g  = ctx.createLinearGradient(0, yc - half, 0, yc + half);
    g.addColorStop(0, rgba(b.color, 0)); g.addColorStop(0.5, rgba(b.color, b.alpha)); g.addColorStop(1, rgba(b.color, 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-50 + mx * 0.1, ty[0]);
    ctx.bezierCurveTo(W * 0.28 + mx * 0.3, ty[1], W * 0.68 + mx * 0.18, ty[2], W + 50 + mx * 0.06, ty[3]);
    ctx.lineTo(W + 50 + mx * 0.06, by[3]);
    ctx.bezierCurveTo(W * 0.68 + mx * 0.18, by[2], W * 0.28 + mx * 0.3, by[1], -50 + mx * 0.1, by[0]);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // ── Wireframe helpers ─────────────────────────────────────────────────────
  // Project a 3D point (post Y-rotation) onto the canvas
  function project(x3, y3) {
    return { sx: cx + x3, sy: cy + y3 };
  }

  // Draw a latitude circle at polar angle theta (0=north pole, PI=south pole)
  // Latitude circles are horizontal → they stay circular under Y-rotation (orthographic)
  function drawLatitude(theta, rotY, tiltX, col, alpha) {
    const r   = R * Math.sin(theta);
    const y3  = R * Math.cos(theta);
    // Apply X-tilt: y' = y*cos(tilt) - z*sin(tilt), but latitude circles have no z spread
    // They remain circles; the tilt shifts their centre vertically
    const yCentre = cy + y3 * Math.cos(tiltX);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(col, alpha);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(cx, yCentre, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw a longitude great circle at prime-meridian offset phi0 (rotated by rotY)
  // Projects as a vertical ellipse with semi-major=R, semi-minor=R*|cos(phi0-rotY)|
  function drawLongitude(phi0, rotY, tiltX, col, alpha) {
    const phi  = phi0 - rotY;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const steps = 80;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(col, alpha);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t   = (i / steps) * Math.PI * 2;
      const x3  = R * Math.sin(t) * cosP;
      const y3r = R * Math.cos(t);                        // y before X-tilt
      const z3  = R * Math.sin(t) * sinP;                 // z before X-tilt
      const y3  = y3r * Math.cos(tiltX) - z3 * Math.sin(tiltX);
      const p   = project(x3, y3);
      if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // ── Orbital rings (the JARVIS signature rings) ────────────────────────────
  // Each ring sits just outside the sphere and rotates on its own axis.
  // Represented as a parametric ellipse in 3D space.
  const rings = [
    { tiltX: 0.20, tiltZ: 0.0,        ownSpin: 0,            speed:  5.0e-4, color: CYAN,   alpha: 0.55, width: 1.8 },
    { tiltX: 1.15, tiltZ: Math.PI / 4, ownSpin: Math.PI / 3,  speed: -3.8e-4, color: PURPLE, alpha: 0.50, width: 1.5 },
    { tiltX: 0.65, tiltZ: Math.PI / 2, ownSpin: Math.PI * 0.8, speed: 6.5e-4,  color: CYAN,   alpha: 0.38, width: 1.2 },
  ];

  function drawRing(ring, rotY, tiltX, t) {
    const Rr   = R * 1.22;
    const spin = ring.ownSpin + rotY + t * ring.speed;
    const tx   = ring.tiltX;
    const tz   = ring.tiltZ;
    const steps = 90;

    // Build a parametric path for this ring in 3D then project
    const buildPath = () => {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a  = (i / steps) * Math.PI * 2;
        // Ring in XZ plane, tilted around X by tx then rotated around Y by spin
        let x = Rr * Math.cos(a);
        let y = -Rr * Math.sin(a) * Math.sin(tx);
        let z =  Rr * Math.sin(a) * Math.cos(tx);
        // Rotate ring around Y by spin
        const x2 = x * Math.cos(spin) + z * Math.sin(spin);
        const z2 = -x * Math.sin(spin) + z * Math.cos(spin);
        x = x2; z = z2;
        // Apply global X tilt from mouse
        const y2 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
        const sx = cx + x;
        const sy = cy + y2;
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
    };

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Wide glow pass
    buildPath();
    ctx.strokeStyle = rgba(ring.color, ring.alpha * 0.25);
    ctx.lineWidth   = ring.width * 7;
    ctx.stroke();
    // Narrow bright core pass
    buildPath();
    ctx.strokeStyle = rgba(ring.color, ring.alpha);
    ctx.lineWidth   = ring.width;
    ctx.stroke();
    ctx.restore();
  }

  // ── Particles on the sphere surface ───────────────────────────────────────
  const PALETTE = [PURPLE, PURPLE, CYAN, CYAN, PINK, CYAN, PURPLE];
  const particles = Array.from({ length: 80 }, function () {
    return {
      theta:      Math.acos(2 * Math.random() - 1),
      phi:        Math.random() * Math.PI * 2,
      dPhi:       (Math.random() - 0.5) * 0.0025,
      dTheta:     (Math.random() - 0.5) * 0.0018,
      kickAmp:    4e-4 + Math.random() * 1e-3,
      kickSpeed:  7e-4 + Math.random() * 1.3e-3,
      kickPhase:  Math.random() * Math.PI * 2,
      color:      PALETTE[Math.floor(Math.random() * PALETTE.length)],
      baseAlpha:  0.50 + Math.random() * 0.50,
      baseSize:   1.2  + Math.random() * 2.2,
      pulseSpeed: 1.0e-3 + Math.random() * 1.8e-3,
      pulsePhase: Math.random() * Math.PI * 2,
      _x: 0, _y: 0, _z: 0,
    };
  });

  let rotY = 0, lastT = null;

  function updateParticles(t, dt) {
    rotY += dt * 0.00040;
    const extraY = (mouse.x - 0.5) *  0.55;
    const tiltX  = (mouse.y - 0.5) * -0.28;
    const totalY = rotY + extraY;
    const cosY = Math.cos(totalY), sinY = Math.sin(totalY);
    const cosX = Math.cos(tiltX),  sinX = Math.sin(tiltX);

    for (let i = 0; i < particles.length; i++) {
      const p   = particles[i];
      const kick = p.kickAmp * Math.sin(t * p.kickSpeed + p.kickPhase);
      p.phi   += p.dPhi   + kick;
      p.theta += p.dTheta + kick * 0.4;
      if (p.theta < 0.07)           { p.theta = 0.07;           p.dTheta =  Math.abs(p.dTheta); }
      if (p.theta > Math.PI - 0.07) { p.theta = Math.PI - 0.07; p.dTheta = -Math.abs(p.dTheta); }
      const st = Math.sin(p.theta);
      let x =  st * Math.cos(p.phi);
      let y =  st * Math.sin(p.phi);
      let z =  Math.cos(p.theta);
      // Y rotation
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      x = x1; z = z1;
      // X tilt
      const y1 = y * cosX - z * sinX;
      p._x = x; p._y = y1; p._z = z;
    }
    // Sort back→front
    particles.sort((a, b) => a._z - b._z);
    return tiltX;
  }

  function drawParticles(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p     = particles[i];
      const sx    = cx + p._x * R;
      const sy    = cy + p._y * R;
      const depth = (p._z + 1) * 0.5;
      const pulse = 0.60 + 0.40 * Math.sin(t * p.pulseSpeed + p.pulsePhase);
      const alpha = p.baseAlpha * (0.08 + 0.92 * depth) * pulse;
      const size  = p.baseSize  * (0.20 + 0.80 * depth);
      const gr    = size * 5;
      const grd   = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
      grd.addColorStop(0,   rgba(WHITE,   alpha * 0.8));
      grd.addColorStop(0.2, rgba(p.color, alpha));
      grd.addColorStop(0.5, rgba(p.color, alpha * 0.35));
      grd.addColorStop(1,   rgba(p.color, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx, sy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Central sphere ambient glow ───────────────────────────────────────────
  function drawCoreGlow() {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.05);
    g.addColorStop(0,    rgba(PURPLE, 0.18));
    g.addColorStop(0.45, rgba(CYAN,   0.06));
    g.addColorStop(0.75, rgba(PURPLE, 0.03));
    g.addColorStop(1,    rgba(PURPLE, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Main frame ────────────────────────────────────────────────────────────
  let raf;
  function frame(t) {
    const dt = lastT === null ? 16 : Math.min(t - lastT, 50);
    lastT = t;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    ctx.clearRect(0, 0, W, H);

    // Aurora backdrop
    for (let i = 0; i < bands.length; i++) drawBand(bands[i], t);

    // Core glow
    drawCoreGlow();

    // Compute current rotation for wireframe + rings
    const extraY = (mouse.x - 0.5) * 0.55;
    const tiltX  = (mouse.y - 0.5) * -0.28;
    const totalY = rotY + extraY;   // rotY updated in updateParticles

    // Wireframe — 7 latitude circles, 9 longitude great circles
    const nLat = 7, nLon = 9;
    for (let i = 1; i < nLat; i++) {
      const theta = (i / nLat) * Math.PI;
      const fade  = 0.5 - Math.abs(theta / Math.PI - 0.5); // brightest at equator
      drawLatitude(theta, totalY, tiltX, CYAN, 0.09 + fade * 0.08);
    }
    for (let i = 0; i < nLon; i++) {
      const phi0 = (i / nLon) * Math.PI;
      drawLongitude(phi0, totalY, tiltX, PURPLE, 0.10);
    }

    // Orbital rings
    for (let i = 0; i < rings.length; i++) drawRing(rings[i], totalY, tiltX, t);

    // Particles (also updates rotY)
    updateParticles(t, dt);
    drawParticles(t);

    raf = requestAnimationFrame(frame);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { resize(); updateParticles(1200, 16); ctx.clearRect(0, 0, W, H); drawCoreGlow(); drawParticles(1200); }, 50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
