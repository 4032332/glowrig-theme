/* hero-aurora.js — neural synapse sphere (JARVIS-style) */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-aurora-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Palette ─────────────────────────────────────────────────────────── */
  const PURPLE = [180,  79, 255];
  const CYAN   = [  0, 245, 255];
  const GREEN  = [ 60, 255, 140];
  const WHITE  = [255, 255, 255];
  const DPURP  = [120,  40, 220];
  const TCYAN  = [ 40, 220, 200];

  const NODE_COLORS = [
    PURPLE, PURPLE, PURPLE,
    CYAN,   CYAN,   CYAN,
    GREEN,
    WHITE,  WHITE,
    DPURP,  TCYAN,
  ];

  /* ── Canvas sizing ─────────────────────────────────────────────────────── */
  let W, H, cx, cy, R;
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    W  = canvas.width  = canvas.clientWidth  || canvas.offsetWidth  || 640;
    H  = canvas.height = canvas.clientHeight || canvas.offsetHeight || 560;
    cx = W * 0.5;
    cy = H * 0.5;
    R  = Math.min(W, H) * 0.47;
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 0);

  /* ── Mouse ─────────────────────────────────────────────────────────────── */
  const heroEl = canvas.closest('.hero-section') || document.documentElement;
  heroEl.addEventListener('mousemove', function (e) {
    const r = canvas.getBoundingClientRect();
    mouse.tx = Math.max(0, Math.min(1, (e.clientX - r.left)  / (r.width  || 1)));
    mouse.ty = Math.max(0, Math.min(1, (e.clientY - r.top)   / (r.height || 1)));
  });
  heroEl.addEventListener('mouseleave', function () { mouse.tx = 0.5; mouse.ty = 0.5; });

  /* ── Nodes ─────────────────────────────────────────────────────────────── */
  // Most on sphere surface (rFrac ~1), some inside for depth layers
  const N = 320;
  const nodes = [];

  for (var i = 0; i < N; i++) {
    var rFrac = Math.random() < 0.65
      ? 0.88 + Math.random() * 0.12   // outer shell
      : 0.45 + Math.random() * 0.43;  // inner layers
    var col = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
    nodes.push({
      theta:     Math.acos(2 * Math.random() - 1),
      phi:       Math.random() * Math.PI * 2,
      dPhi:      (Math.random() - 0.5) * 0.00055,
      dTheta:    (Math.random() - 0.5) * 0.00035,
      rFrac:     rFrac,
      col:       col,
      baseBright: 0.28 + Math.random() * 0.45,
      glow:      0,   // 0–1, decays after synapse fires
      _x: 0, _y: 0, _z: 0,
      sx: 0, sy: 0,
    });
  }

  /* ── Connections ────────────────────────────────────────────────────────── */
  // Built once from initial positions; indices remain stable as nodes drift slowly
  var connections = [];

  function buildConnections() {
    // Compute initial raw 3D positions (pre-rotation)
    var pos = nodes.map(function (n) {
      var st = Math.sin(n.theta);
      return [
        st * Math.cos(n.phi) * n.rFrac,
        st * Math.sin(n.phi) * n.rFrac,
        Math.cos(n.theta)    * n.rFrac,
      ];
    });

    var connPerNode = new Int8Array(N);
    var MAX_PER  = 6;    // max connections per node
    var DIST_MAX = 0.52; // unit-sphere distance threshold for short connections
    var DIST_ARC = 1.4;  // allow some long-arc connections for the JARVIS feel

    connections = [];
    var seen = {};

    for (var i = 0; i < N; i++) {
      if (connPerNode[i] >= MAX_PER) continue;
      var px = pos[i][0], py = pos[i][1], pz = pos[i][2];

      // Gather candidate neighbours
      var cands = [];
      for (var j = 0; j < N; j++) {
        if (i === j) continue;
        var dx = px - pos[j][0], dy = py - pos[j][1], dz = pz - pos[j][2];
        var d = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < DIST_MAX) cands.push({ j: j, d: d, arc: false });
      }
      cands.sort(function (a, b) { return a.d - b.d; });

      // Take up to 4 short connections
      var taken = 0;
      for (var k = 0; k < cands.length && taken < 4 && connPerNode[i] < MAX_PER; k++) {
        var jj = cands[k].j;
        if (connPerNode[jj] >= MAX_PER) continue;
        var key = Math.min(i,jj) + '_' + Math.max(i,jj);
        if (seen[key]) continue;
        seen[key] = 1;
        connections.push({ a: i, b: jj, arc: false, pulses: [] });
        connPerNode[i]++;
        connPerNode[jj]++;
        taken++;
      }

      // Occasionally add a long-arc connection (gives the dramatic sweep lines)
      if (Math.random() < 0.18 && connPerNode[i] < MAX_PER) {
        for (var k2 = 0; k2 < N; k2++) {
          if (k2 === i) continue;
          var dx2 = px - pos[k2][0], dy2 = py - pos[k2][1], dz2 = pz - pos[k2][2];
          var d2 = Math.sqrt(dx2*dx2 + dy2*dy2 + dz2*dz2);
          if (d2 > DIST_MAX && d2 < DIST_ARC && connPerNode[k2] < MAX_PER) {
            var key2 = Math.min(i,k2) + '_' + Math.max(i,k2);
            if (!seen[key2]) {
              seen[key2] = 1;
              connections.push({ a: i, b: k2, arc: true, pulses: [] });
              connPerNode[i]++;
              connPerNode[k2]++;
              break;
            }
          }
        }
      }
    }
  }

  /* ── Pulse spawning ─────────────────────────────────────────────────────── */
  function spawnPulse() {
    if (!connections.length) return;
    var conn = connections[Math.floor(Math.random() * connections.length)];
    var col  = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
    var dir  = Math.random() < 0.5 ? 1 : -1;
    conn.pulses.push({
      t:     dir > 0 ? 0 : 1,
      dir:   dir,
      col:   col,
      speed: 0.003 + Math.random() * 0.007,
      size:  3.5 + Math.random() * 4,
    });
  }

  /* ── Rotation + projection ─────────────────────────────────────────────── */
  var rotY = 0, lastT = null;

  function updateNodes(t, dt) {
    rotY += dt * 0.00018;

    var extraY = (mouse.x - 0.5) *  0.6;
    var tiltX  = (mouse.y - 0.5) * -0.3;
    var cosY   = Math.cos(rotY + extraY), sinY = Math.sin(rotY + extraY);
    var cosX   = Math.cos(tiltX),         sinX = Math.sin(tiltX);

    for (var i = 0; i < N; i++) {
      var n = nodes[i];
      n.phi   += n.dPhi;
      n.theta += n.dTheta;
      if (n.theta < 0.05)           { n.theta = 0.05;           n.dTheta =  Math.abs(n.dTheta); }
      if (n.theta > Math.PI - 0.05) { n.theta = Math.PI - 0.05; n.dTheta = -Math.abs(n.dTheta); }

      var st = Math.sin(n.theta);
      var x  =  st * Math.cos(n.phi) * n.rFrac;
      var y  =  st * Math.sin(n.phi) * n.rFrac;
      var z  =  Math.cos(n.theta)    * n.rFrac;

      // Y rotation
      var x1 =  x * cosY + z * sinY;
      var z1 = -x * sinY + z * cosY;
      // X tilt
      var y1 = y * cosX - z1 * sinX;
      var z2 = y * sinX + z1 * cosX;

      n._x = x1; n._y = y1; n._z = z2;
      n.sx = cx + x1 * R;
      n.sy = cy + y1 * R;

      // Decay glow
      if (n.glow > 0) n.glow = Math.max(0, n.glow - dt * 0.0025);
    }
  }

  function updatePulses(dt) {
    var step = dt * 0.055;
    for (var i = 0; i < connections.length; i++) {
      var conn = connections[i];
      for (var j = conn.pulses.length - 1; j >= 0; j--) {
        var p = conn.pulses[j];
        p.t += p.dir * p.speed * step;
        if (p.t >= 1 || p.t <= 0) {
          // Arrived — light up node
          var arrived = p.t >= 1 ? conn.b : conn.a;
          nodes[arrived].glow = 1.0;
          conn.pulses.splice(j, 1);
        }
      }
    }
  }

  /* ── Draw ─────────────────────────────────────────────────────────────── */
  function rgba(col, a) {
    return 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a + ')';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    var depth = function (n) { return (n._z + 1) * 0.5; }; // 0=back, 1=front

    /* ── Lines ─── */
    for (var i = 0; i < connections.length; i++) {
      var conn = connections[i];
      var na = nodes[conn.a], nb = nodes[conn.b];
      var da = depth(na), db = depth(nb);
      var avgD = (da + db) * 0.5;

      // Cull lines behind the sphere (both nodes very far back)
      if (avgD < 0.06) continue;

      var lineAlpha = conn.arc
        ? 0.04 + avgD * 0.22   // arc lines brighter
        : 0.025 + avgD * 0.15; // short lines

      var c = na.col;
      ctx.beginPath();
      ctx.moveTo(na.sx, na.sy);
      ctx.lineTo(nb.sx, nb.sy);
      ctx.strokeStyle = rgba(c, lineAlpha);
      ctx.lineWidth   = conn.arc ? (0.3 + avgD * 1.2) : (0.2 + avgD * 0.9);
      ctx.stroke();

      /* ── Pulses on this connection ── */
      for (var j = 0; j < conn.pulses.length; j++) {
        var p   = conn.pulses[j];
        var t   = p.t;
        var px  = na.sx + (nb.sx - na.sx) * t;
        var py  = na.sy + (nb.sy - na.sy) * t;
        var pd  = da + (db - da) * t;

        if (pd < 0.08) continue; // behind sphere, skip

        var pa   = 0.65 + pd * 0.35;
        var ps   = p.size * (0.5 + pd * 0.8);
        var pcol = p.col;

        // Bright core
        ctx.fillStyle = rgba(WHITE, pa * 0.9);
        ctx.beginPath();
        ctx.arc(px, py, ps * 0.3, 0, 6.283185);
        ctx.fill();

        // Colour halo
        var pg = ctx.createRadialGradient(px, py, 0, px, py, ps * 2);
        pg.addColorStop(0,    rgba(pcol, pa * 0.85));
        pg.addColorStop(0.45, rgba(pcol, pa * 0.35));
        pg.addColorStop(1,    rgba(pcol, 0));
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, ps * 2, 0, 6.283185);
        ctx.fill();
      }
    }

    /* ── Nodes ─── */
    // Sort back-to-front so front nodes paint over back ones
    var sorted = nodes.slice().sort(function (a, b) { return a._z - b._z; });

    for (var i = 0; i < sorted.length; i++) {
      var n  = sorted[i];
      var d  = depth(n);
      if (d < 0.05) continue;

      var glow = n.glow;
      var base = n.baseBright * (0.06 + d * 0.94);
      var a    = Math.min(1, base + glow * 0.95);
      var sz   = (0.4 + d * 2.8) * (1 + glow * 3);
      var c    = n.col;

      // Bright white core
      ctx.fillStyle = rgba(WHITE, a * 0.85);
      ctx.beginPath();
      ctx.arc(n.sx, n.sy, Math.max(0.3, sz * 0.22), 0, 6.283185);
      ctx.fill();

      // Colour glow ring
      var ng = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, sz * 2.5);
      ng.addColorStop(0,    rgba(c, a * 0.8));
      ng.addColorStop(0.4,  rgba(c, a * 0.25));
      ng.addColorStop(1,    rgba(c, 0));
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(n.sx, n.sy, sz * 2.5, 0, 6.283185);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* ── Loop ──────────────────────────────────────────────────────────────── */
  var raf;
  var pulseAccum = 0;
  var PULSE_INTERVAL = 55; // ms between bursts

  function frame(t) {
    var dt = lastT === null ? 16 : Math.min(t - lastT, 50);
    lastT  = t;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    updateNodes(t, dt);
    updatePulses(dt);

    pulseAccum += dt;
    if (pulseAccum > PULSE_INTERVAL) {
      pulseAccum = 0;
      var burst = 3 + Math.floor(Math.random() * 4);
      for (var k = 0; k < burst; k++) spawnPulse();
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  // Wait for first resize before building connections and starting loop
  setTimeout(function () {
    buildConnections();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateNodes(0, 0);
      draw();
    } else {
      raf = requestAnimationFrame(frame);
    }
  }, 120);

  window.addEventListener('pagehide', function () { cancelAnimationFrame(raf); });
})();
