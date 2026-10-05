(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let moving = !reduced.matches;
let kick = () => {};

/* Motion toggle */
const toggle = document.createElement('button');
toggle.className = 'motion-toggle'; toggle.type = 'button';
function label() {
  toggle.textContent = moving ? 'Pause 3D motion' : 'Enable 3D motion';
  toggle.setAttribute('aria-pressed', String(moving));
  document.body.classList.toggle('motion-off', !moving);
}
toggle.onclick = () => { moving = !moving; label(); kick(); };
document.body.append(toggle); label();
reduced.addEventListener('change', e => { moving = !e.matches; label(); kick(); });

/* Mobile menu */
const nav = document.querySelector('.nav-inner'), links = nav?.querySelector('.links');
if (links) {
  links.id = 'main-navigation';
  const menu = document.createElement('button');
  menu.className = 'menu-toggle'; menu.type = 'button'; menu.textContent = 'Menu';
  menu.setAttribute('aria-controls', links.id); menu.setAttribute('aria-expanded', 'false');
  nav.insertBefore(menu, links);
  menu.onclick = () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); };
  links.addEventListener('click', () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); });
}

/* 3D portrait frame */
const portrait = document.querySelector('.hero .portrait');
let stage = null;
if (portrait) {
  stage = document.createElement('div'); stage.className = 'portrait-stage';
  const frame = document.createElement('div'); frame.className = 'portrait-frame';
  portrait.replaceWith(stage); stage.append(frame); frame.append(portrait);
  const caption = document.createElement('div'); caption.className = 'portrait-caption';
  caption.innerHTML = 'AKACHI MADUAKO<span>Cybersecurity / Software</span>';
  frame.append(caption);
}

/* Card tilt */
const fine = matchMedia('(pointer:fine)');
document.querySelectorAll('.card,.game-card,.portrait-frame').forEach(el => {
  el.addEventListener('pointermove', e => {
    if (!moving || !fine.matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 10}deg) translateY(-4px)`;
  });
  el.addEventListener('pointerleave', () => el.style.transform = '');
});

/* Background canvas */
const canvas = document.createElement('canvas');
canvas.id = 'space'; canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

if (window.THREE && webglOK()) threatGlobe(); else torus();

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

/* ---------- Three.js: live network / threat globe ---------- */
function threatGlobe() {
  const T = window.THREE;
  const GREEN = new T.Color('#b4f878'), DIM = new T.Color('#86b46c'), ALERT = new T.Color('#ff5d4f');
  const small = () => innerWidth < 620;

  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch (e) { torus(); return; }
  canvas.classList.add('globe');

  const scene = new T.Scene();
  scene.fog = new T.Fog(0x080b10, 5.4, 7.4);
  const camera = new T.PerspectiveCamera(35, 1, .1, 50);
  camera.position.z = 6;

  const root = new T.Group();   // positioned on screen
  const tilt = new T.Group();   // pointer tilt
  const globe = new T.Group();  // spins
  root.add(tilt); tilt.add(globe); scene.add(root);
  globe.rotation.x = .35;

  // Round soft dot texture
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.35, 'rgba(255,255,255,.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();

  // Surface dots (fibonacci sphere)
  const N = small() ? 650 : 1100, surf = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    surf.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
  }
  const surfGeo = new T.BufferGeometry();
  surfGeo.setAttribute('position', new T.BufferAttribute(surf, 3));
  globe.add(new T.Points(surfGeo, new T.PointsMaterial({
    size: .034, map: dotTex, color: DIM, transparent: true, depthWrite: false, blending: T.AdditiveBlending
  })));

  // Faint inner sphere to occlude the far side a little
  globe.add(new T.Mesh(new T.SphereGeometry(.985, 48, 32),
    new T.MeshBasicMaterial({ color: 0x080b10, transparent: true, opacity: .3, depthWrite: false })));

  // Hosts
  const H = 22, hosts = [];
  for (let i = 0; i < H; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
    hosts.push(new T.Vector3(Math.cos(a) * r, u, Math.sin(a) * r));
  }
  const hostPos = new Float32Array(H * 3), hostCol = new Float32Array(H * 3);
  hosts.forEach((v, i) => { hostPos.set([v.x * 1.01, v.y * 1.01, v.z * 1.01], i * 3); hostCol.set([GREEN.r, GREEN.g, GREEN.b], i * 3); });
  const hostGeo = new T.BufferGeometry();
  hostGeo.setAttribute('position', new T.BufferAttribute(hostPos, 3));
  hostGeo.setAttribute('color', new T.BufferAttribute(hostCol, 3));
  globe.add(new T.Points(hostGeo, new T.PointsMaterial({
    size: .085, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending
  })));

  // Connections with travelling packets
  const links = [];
  for (let i = 0; i < 26; i++) {
    const a = hosts[i % H], b = hosts[(i * 7 + 3) % H];
    if (a === b) continue;
    const mid = a.clone().add(b).multiplyScalar(.5);
    const lift = 1 + a.distanceTo(b) * .32;
    const curve = new T.QuadraticBezierCurve3(a.clone(), mid.normalize().multiplyScalar(lift), b.clone());
    const line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(40)),
      new T.LineBasicMaterial({ color: GREEN, transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false }));
    globe.add(line);
    links.push({ curve, line, t: Math.random(), speed: .05 + Math.random() * .09, from: i % H, to: (i * 7 + 3) % H });
  }
  const pk = new Float32Array(links.length * 3), pkGeo = new T.BufferGeometry();
  pkGeo.setAttribute('position', new T.BufferAttribute(pk, 3));
  globe.add(new T.Points(pkGeo, new T.PointsMaterial({
    size: .06, map: dotTex, color: 0xe9ffd6, transparent: true, depthWrite: false, blending: T.AdditiveBlending
  })));

  // Orbit ring + satellite
  const orbit = new T.Group(); orbit.rotation.set(1.15, .2, -.35); tilt.add(orbit);
  const ringPts = new T.EllipseCurve(0, 0, 1.38, 1.38, 0, Math.PI * 2).getPoints(128).map(p => new T.Vector3(p.x, p.y, 0));
  orbit.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(ringPts),
    new T.LineBasicMaterial({ color: GREEN, transparent: true, opacity: .22, depthWrite: false })));
  const sat = new T.Points(new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3)),
    new T.PointsMaterial({ size: .1, map: dotTex, color: GREEN, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  orbit.add(sat);

  // Halo
  const haloTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), grad = g.createRadialGradient(128, 128, 60, 128, 128, 128);
    grad.addColorStop(0, 'rgba(180,248,120,.16)'); grad.addColorStop(1, 'rgba(180,248,120,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new T.CanvasTexture(c);
  })();
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, fog: false }));
  halo.scale.set(3.1, 3.1, 1); tilt.add(halo);

  // Alert pulses: red when detected, green when contained
  const pulses = [];
  for (let i = 0; i < 6; i++) {
    const m = new T.Mesh(new T.RingGeometry(.9, 1, 48),
      new T.MeshBasicMaterial({ color: ALERT, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    m.visible = false; globe.add(m); pulses.push({ m, start: -1, life: 1.6 });
  }
  const hostState = new Float32Array(H); // >0 while host is flagged
  function pulse(host, color, delay, now) {
    const p = pulses.find(p => p.start < 0); if (!p) return;
    const v = hosts[host];
    p.m.position.copy(v).multiplyScalar(1.012);
    p.m.lookAt(v.clone().multiplyScalar(2));
    p.m.material.color.copy(color);
    p.start = now + delay; p.host = host;
  }
  let nextAlert = 1.2;

  // Layout: anchor globe behind portrait, drift right as you scroll
  let w = 0, h = 0, anchor = { x: 0, y: 0, r: 200 };
  function layout() {
    w = innerWidth; h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, small() ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const one = w < 620;
    if (stage) {
      const r = stage.getBoundingClientRect();
      anchor = one
        ? { x: r.left + r.width * .5, y: r.top + scrollY + r.height * .45, r: Math.min(r.height * .5, w * .55) }
        : { x: r.left + r.width * .18, y: r.top + scrollY + r.height * .38, r: Math.min(r.height * .42, w * .2) };
    } else {
      // Sub-pages: sit to the right of the page header
      const hero = document.querySelector('body > header, main > header, .case-hero') || document.body;
      const r = hero.getBoundingClientRect();
      const hh = Math.max(Math.min(r.height, h), 320);
      anchor = one
        ? { x: w * .82, y: r.top + scrollY + hh * .45, r: w * .42 }
        : { x: w * .8, y: r.top + scrollY + hh * .5, r: Math.min(hh * .4, w * .16, 250) };
      if (!one) {
        const tr = Math.max(0, ...[...hero.querySelectorAll('h1,.lede')].map(e => e.getBoundingClientRect().right));
        anchor.x = Math.min(Math.max(anchor.x, tr + anchor.r * .55), w - anchor.r * .15);
      }
    }
    anchor.dim = !stage && (one || w < 900);
  }
  const visH = () => 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  function place(sy, intro) {
    const start = Math.max(0, anchor.y - h * .5), p = Math.min(Math.max((sy - start) / (h * .9), 0), 1), e = p * p * (3 - 2 * p);
    const sx0 = anchor.x, sy0 = anchor.y - sy;
    const sx1 = small() ? w * .92 : w * .97, sy1 = h * .5;
    const sx = sx0 + (sx1 - sx0) * e, syy = sy0 + (sy1 - sy0) * e;
    const unit = visH() / h;
    root.position.set((sx - w / 2) * unit, -(syy - h / 2) * unit, 0);
    const s = anchor.r * unit * (1 - .2 * e) * intro;
    root.scale.setScalar(s);
    canvas.style.opacity = String(anchor.dim ? .38 - e * .18 : (small() ? .7 : .95) - e * (small() ? .45 : .55));
  }

  // Pointer parallax
  let px = 0, py = 0;
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; }, { passive: true });

  const clock = new T.Clock();
  let time = 0, running = false, introT = moving ? 0 : 1;
  const tmp = new T.Vector3();

  function frame() {
    const dt = Math.min(clock.getDelta(), .05);
    if (moving) time += dt;
    introT = moving ? Math.min(introT + dt / 1.4, 1) : 1;
    const ease = 1 - Math.pow(1 - introT, 3);

    if (moving) {
      globe.rotation.y += dt * .09;
      orbit.rotation.z += dt * .25;
      tilt.rotation.x += ((py * .35) - tilt.rotation.x) * .05;
      tilt.rotation.y += ((px * .5) - tilt.rotation.y) * .05;

      links.forEach((l, i) => {
        l.t = (l.t + dt * l.speed) % 1;
        l.curve.getPoint(l.t, tmp); pk.set([tmp.x, tmp.y, tmp.z], i * 3);
        l.line.material.opacity = .1 + (hostState[l.from] > 0 || hostState[l.to] > 0 ? .5 : .06);
        l.line.material.color.copy(hostState[l.from] > 0 || hostState[l.to] > 0 ? ALERT : GREEN);
      });
      pkGeo.attributes.position.needsUpdate = true;
      const a = time * .25; sat.geometry.attributes.position.setXYZ(0, Math.cos(a) * 1.38, Math.sin(a) * 1.38, 0);
      sat.geometry.attributes.position.needsUpdate = true;

      if (time > nextAlert) {
        const host = Math.floor(Math.random() * H);
        pulse(host, ALERT, 0, time); pulse(host, GREEN, 1.3, time);
        hostState[host] = 1.3;
        nextAlert = time + 2.6 + Math.random() * 2;
      }
      for (let i = 0; i < H; i++) {
        if (hostState[i] > 0) hostState[i] -= dt;
        const c = hostState[i] > 0 ? ALERT : GREEN;
        hostCol.set([c.r, c.g, c.b], i * 3);
      }
      hostGeo.attributes.color.needsUpdate = true;
      pulses.forEach(p => {
        if (p.start < 0) return;
        const k = (time - p.start) / p.life;
        if (k < 0) { p.m.visible = false; return; }
        if (k >= 1) { p.start = -1; p.m.visible = false; return; }
        p.m.visible = true; p.m.scale.setScalar(.02 + k * .22); p.m.material.opacity = (1 - k) * .9;
      });
    } else {
      links.forEach((l, i) => { l.curve.getPoint(l.t, tmp); pk.set([tmp.x, tmp.y, tmp.z], i * 3); });
      pkGeo.attributes.position.needsUpdate = true;
    }

    place(scrollY, .7 + .3 * ease);
    renderer.render(scene, camera);
    if (moving && !document.hidden) requestAnimationFrame(frame); else running = false;
  }
  kick = () => { if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } };

  layout();
  addEventListener('resize', () => { layout(); kick(); });
  addEventListener('load', () => { layout(); kick(); });
  addEventListener('scroll', () => { if (!moving) kick(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  kick();
}

/* ---------- Fallback: original 2D torus (sub-pages / no WebGL) ---------- */
function torus() {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  let w, h, dpr;
  function resize() { w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!moving) draw(0); }
  const points = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 24; j++) { const a = i / 12 * Math.PI * 2, b = j / 24 * Math.PI * 2; points.push([(2 + .66 * Math.cos(a)) * Math.cos(b), .66 * Math.sin(a), (2 + .66 * Math.cos(a)) * Math.sin(b)]); }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const angle = moving ? t * .00009 : 0.4, size = Math.min(w * .24, 340);
    const projected = points.map(([x, y, z]) => { const rx = x * Math.cos(angle) - z * Math.sin(angle), rz = x * Math.sin(angle) + z * Math.cos(angle); const ry = y * .8 - rz * .6, zz = y * .6 + rz * .8; const p = 5 / (5 + zz); return [w * .77 + rx * size * p, h * .45 + ry * size * p, zz]; });
    ctx.lineWidth = .65;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 24; j++) { const k = i * 24 + j, p = projected[k]; for (const n of [i * 24 + (j + 1) % 24, ((i + 1) % 12) * 24 + j]) { const q = projected[n]; ctx.strokeStyle = `rgba(154,211,119,${.07 + (p[2] + 3) * .018})`; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    if (moving && !document.hidden) requestAnimationFrame(draw);
  }
  kick = () => requestAnimationFrame(draw);
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && moving) requestAnimationFrame(draw); });
  resize(); if (moving) requestAnimationFrame(draw);
}
})();
