/* hero-aurora.js — dense particle sphere (JARVIS-style) */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Brand palette ─────────────────────────────────────────────────────── */
  const PALETTE = [
    [180,  79, 255],  // purple
    [180,  79, 255],  // purple (weighted)
    [  0, 245, 255],  // cyan
    [  0, 245, 255],  // cyan (weighted)
    [ 60, 255, 140],  // green
    [255, 255, 255],  // white
    [255, 255, 255],  // white (weighted)
    [  0, 200, 255],  // cyan-blue
    [140,  60, 255],  // deep purple
    [ 40, 255, 180],  // teal-green
  ];

  /* ── Pre-render glow stamps to offscreen canvases ──────────────────────── */
  // Using stamps + drawImage is far faster than createRadialGradient per frame.
  function makeStamp(rgb, diameter) {
    const oc = document.createElement('canvas');
    oc.width = oc.height = diameter;
    const ox = oc.getContext('2d');
    const half = diameter / 2;
    const g = ox.createRadialGradient(half, half, 0, half, half, half);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.12, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
    g.addColorStop(0.35, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.50)`);
    g.addColorStop(0.65, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.15)`);
    g.addColorStop(1,    `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ox.fillStyle = g;
    ox.beginPath();
    ox.arc(half, half, half, 0, Math.PI * 2);
    ox.fill();
    return oc;
  }

  // Build a stamp pool: each palette entry gets 3 sizes (small/medium/large)
  const SIZES = [7, 12, 18];
  const stampPool = PALETTE.map(rgb => SIZES.map(s => makeStamp(rgb, s)));

  /* ── Canvas sizing ─────────────────────────────────────────────────────── */
  let W, H, cx, cy, R;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    W  = canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 600;
    H  = canvas.height = canvas.clientHeight || canvas.offsetHeight || 480;
    cx = W * 0.5;
    cy = H * 0.5;
    R  = Math.min(W, H) * 0.42;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 0);

  /* ── Mouse parallax ────────────────────────────────────────────────────── */
  const heroEl = canvas.closest('.hero-section') || document.documentElement;
  heroEl.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () { mouse.tx = 0.5; mouse.ty = 0.5; });

  /* ── Particle generation ───────────────────────────────────────────────── */
  // 600 particles: most on the surface, some slightly inside for layering
  const N = 600;
  const particles = [];
  for (var i = 0; i < N; i++) {
    var pi   = Math.floor(Math.random() * PALETTE.length);
    var si   = Math.floor(Math.random() * SIZES.length);
    // Bias toward smaller sizes (more tiny particles = denser look)
    if (Math.random() < 0.55) si = 0;
    else if (Math.random() < 0.6) si = 1;
    particles.push({
      theta:      Math.acos(2 * Math.random() - 1),  // uniform on sphere
      phi:        Math.random() * Math.PI * 2,
      dPhi:       (Math.random() - 0.5) * 0.0028,
      dTheta:     (Math.random() - 0.5) * 0.0020,
      kickAmp:    2e-4 + Math.random() * 1.1e-3,
      kickSpeed:  5e-4 + Math.random() * 1.5e-3,
      kickPhase:  Math.random() * Math.PI * 2,
      // Radial depth: 0.78–1.0 of R — inner particles give the multilayer feel
      rFrac:      0.78 + Math.random() * 0.22,
      pi:         pi,   // palette index
      si:         si,   // size index
      alpha:      0.45 + Math.random() * 0.55,
      pulseSpeed: 7e-4  + Math.random() * 1.8e-3,
      pulsePhase: Math.random() * Math.PI * 2,
      _x: 0, _y: 0, _z: 0,
    });
  }

  /* ── Rotation state ────────────────────────────────────────────────────── */
  var rotY = 0, lastT = null;

  function update(t, dt) {
    rotY += dt * 0.00036;

    var extraY = (mouse.x - 0.5) *  0.65;
    var tiltX  = (mouse.y - 0.5) * -0.32;
    var totalY = rotY + extraY;
    var cosY   = Math.cos(totalY), sinY = Math.sin(totalY);
    var cosX   = Math.cos(tiltX),  sinX = Math.sin(tiltX);

    for (var i = 0; i < N; i++) {
      var p    = particles[i];
      var kick = p.kickAmp * Math.sin(t * p.kickSpeed + p.kickPhase);
      p.phi   += p.dPhi   + kick;
      p.theta += p.dTheta + kick * 0.45;
      // Clamp theta away from poles
      if (p.theta < 0.04)            { p.theta = 0.04;             p.dTheta =  Math.abs(p.dTheta); }
      if (p.theta > Math.PI - 0.04)  { p.theta = Math.PI - 0.04;   p.dTheta = -Math.abs(p.dTheta); }

      var st = Math.sin(p.theta);
      var x  =  st * Math.cos(p.phi);
      var y  =  st * Math.sin(p.phi);
      var z  =  Math.cos(p.theta);

      // Y-axis rotation
      var x1 =  x * cosY + z * sinY;
      var z1 = -x * sinY + z * cosY;
      x = x1; z = z1;

      // X-axis tilt (mouse)
      var y1 = y * cosX - z * sinX;
      // z1 = y * sinX + z * cosX; // don't need screen z for projection

      p._x = x;
      p._y = y1;
      p._z = z;   // used for depth sort
    }

    // Back-to-front sort so front particles paint over back ones
    particles.sort(function (a, b) { return a._z - b._z; });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    /* Soft inner glow — builds the bright core visible through the sphere */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.85);
    ig.addColorStop(0,    'rgba(100,0,200,0.14)');
    ig.addColorStop(0.35, 'rgba(0,180,255,0.07)');
    ig.addColorStop(0.70, 'rgba(40,255,120,0.03)');
    ig.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
    ctx.fill();

    /* Particle field */
    for (var i = 0; i < N; i++) {
      var p     = particles[i];
      var r     = R * p.rFrac;
      var sx    = cx + p._x * r;
      var sy    = cy + p._y * r;

      // Depth: 0 (back) → 1 (front)
      var depth = (p._z + 1) * 0.5;
      var pulse = 0.55 + 0.45 * Math.sin(t * p.pulseSpeed + p.pulsePhase);
      // Back particles are very faint; front are bright — sells the 3D sphere
      var alpha = p.alpha * (0.04 + 0.96 * depth) * pulse;

      var stamp = stampPool[p.pi][p.si];
      var half  = stamp.width * 0.5;

      ctx.globalAlpha = alpha;
      ctx.drawImage(stamp, sx - half, sy - half);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ── Animation loop ────────────────────────────────────────────────────── */
  var raf;
  function frame(t) {
    var dt = lastT === null ? 16 : Math.min(t - lastT, 50);
    lastT  = t;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    update(t, dt);
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { resize(); update(1200, 16); draw(1200); }, 50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
