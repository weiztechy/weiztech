import * as THREE from './assets/vendor/three.module.min.js';
import { createDevices, createMaterials, slab, box, cylinder, rounded } from './models.js';
import { createIllustrationLibrary } from './illustrations.js';

const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const motion = window.WEIZTECH_MOTION || { paused: reducedQuery.matches, reduced: reducedQuery.matches };
const PI = Math.PI;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const out = v => 1 - Math.pow(1 - clamp(v), 3);
const damp = (current, target, speed, dt) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * dt));
const isDark = () => document.documentElement.dataset.theme === 'dark';

let renderer;
try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' }); } catch {}

if (!renderer) {
  document.querySelector('.stage-tabs')?.setAttribute('hidden', '');
  document.querySelector('#device-action')?.setAttribute('hidden', '');
  const hint = document.getElementById('scene-hint');
  if (hint) hint.textContent = 'Computer, WLAN und Drucker – persönlich vor Ort.';
} else {
  renderer.setPixelRatio(1);
  renderer.setSize(1024, 1024, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);

  let dirty = true, frame = 0, last = performance.now(), time = 0, lost = false, warmed = false;
  let bufferWidth = 1024, bufferHeight = 1024;
  const surfaces = [];
  const M = createMaterials();
  M.setTheme(isDark());
  const prototypes = createDevices(renderer, M, () => { dirty = true; start(); });
  const illustrations = createIllustrationLibrary(renderer, M);

  // Neutral photo-studio environment: a large top softbox, two strip lights and a dim floor.
  const environment = (() => {
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0x868b92);
    const panel = (w, h, color, position, look = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), side: THREE.DoubleSide }));
      mesh.position.set(...position); mesh.lookAt(...look); studio.add(mesh);
    };
    panel(12, 8, [3.2, 3.2, 3.2], [0, 9, 1]);
    panel(3, 10, [2.4, 2.45, 2.6], [-8, 3, 2]);
    panel(3, 10, [2.6, 2.3, 2.0], [8, 3, -1]);
    panel(14, 6, [.9, .9, .92], [0, 2, -9]);
    panel(10, 4, [1.4, 1.4, 1.4], [0, 2, 9]);
    panel(30, 30, [.22, .22, .23], [0, -4, 0], [0, 0, 0]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const texture = pmrem.fromScene(studio, .035).texture;
    pmrem.dispose();
    studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    return texture;
  })();

  function addLights(scene, shadowSize = 1024, extent = 6) {
    scene.environment = environment;
    const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc8bc, .7); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-3, 12, 5); key.castShadow = true;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: .5, far: 30 });
    key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 6; key.shadow.blurSamples = 16;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff2e2, .7); fill.position.set(6, 4, 5); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xe4ecff, 1.3); rim.position.set(3, 6, -8); scene.add(rim);
    return { hemi, key, fill, rim };
  }
  function themeLights(item) {
    const dark = isDark();
    item.lights.hemi.intensity = dark ? .35 : .7;
    item.lights.hemi.groundColor.set(dark ? 0x202228 : 0xcfc8bc);
    item.lights.key.intensity = dark ? 2.1 : 2.3;
    item.lights.rim.intensity = dark ? 2.0 : 1.3;
    item.scene.environmentIntensity = dark ? .7 : 1.0;
  }
  function shadowFloor(scene, y = 0, size = 30) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), M.shadow);
    floor.rotation.x = -PI / 2; floor.position.y = y; floor.receiveShadow = true; scene.add(floor); return floor;
  }
  // Soft radial contact shadow, used where a shadow-catching floor would show hard frustum edges.
  const blob = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(.55, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); return t;
  })();
  const blobMaterials = [];
  function contactShadow(w, d, opacity) {
    const material = new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, opacity, color: 0x1b1a17 });
    material.userData.base = opacity; blobMaterials.push(material);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material); mesh.rotation.x = -PI / 2; mesh.position.y = .002; mesh.renderOrder = -1;
    return mesh;
  }
  function surface(element, { view = 5, minWidth = 0, target = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(1, .8, 2), fov = 24, shadowSize = 1024, extent = 6 } = {}) {
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); element.appendChild(canvas);
    const scene = new THREE.Scene();
    const lights = addLights(scene, shadowSize, extent);
    const camera = new THREE.PerspectiveCamera(fov, 1, .1, 200);
    const item = { element, canvas, ctx: canvas.getContext('2d', { alpha: true }), scene, camera, lights, view, minWidth, target, dir: dir.clone().normalize(), visible: false, width: 1, height: 1, pointer: { x: 0, y: 0 }, update: () => {} };
    themeLights(item);
    surfaces.push(item);
    element.addEventListener('pointermove', event => { if (motion.reduced) return; const r = element.getBoundingClientRect(); item.pointer.x = (event.clientX - r.left) / r.width - .5; item.pointer.y = (event.clientY - r.top) / r.height - .5; dirty = true; start(); }, { passive: true });
    element.addEventListener('pointerleave', () => { item.pointer.x = 0; item.pointer.y = 0; dirty = true; start(); });
    return item;
  }
  function fitCamera(s, cssWidth, cssHeight) {
    const aspect = cssWidth / Math.max(1, cssHeight);
    const viewH = Math.max(s.view, s.minWidth / aspect);
    const distance = (viewH / 2) / Math.tan(THREE.MathUtils.degToRad(s.camera.fov) / 2);
    s.camera.aspect = aspect;
    s.camera.position.copy(s.target).addScaledVector(s.dir, distance);
    s.camera.lookAt(s.target);
    s.camera.near = Math.max(.1, distance - 20); s.camera.far = distance + 30;
    s.camera.updateProjectionMatrix();
  }

  /* ---------------- Hero ---------------- */
  const heroElement = document.getElementById('scene-stage');
  const hero = surface(heroElement, { view: 5.9, minWidth: 7.4, target: new THREE.Vector3(0, 1.35, 0), dir: new THREE.Vector3(1.05, .78, 2.1), fov: 24, shadowSize: 2048, extent: 5 });
  const PLINTH = .22;
  const stage = new THREE.Group(); hero.scene.add(stage);
  const plinth = cylinder(3.15, PLINTH, M.plinth, 96); plinth.position.y = PLINTH / 2; plinth.castShadow = false; stage.add(plinth);
  const plinthLip = cylinder(3.2, .04, M.plinthEdge, 96); plinthLip.position.y = .02; plinthLip.castShadow = false; stage.add(plinthLip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.12, .016, 8, 160), M.orangeGlow); ring.rotation.x = -PI / 2; ring.position.y = PLINTH + .004; stage.add(ring);
  const sweep = new THREE.Mesh(new THREE.TorusGeometry(3.12, .045, 10, 120, PI * .55), M.signal.clone()); sweep.rotation.x = -PI / 2; sweep.position.y = PLINTH + .01; sweep.material.opacity = 0; stage.add(sweep);
  hero.scene.add(contactShadow(8.4, 8.4, .35));
  const rig = new THREE.Group(); rig.position.y = PLINTH; hero.scene.add(rig);
  const devices = { laptop: prototypes.laptop, router: prototypes.router, printer: prototypes.printer };
  const baseScale = { laptop: 1, router: 1.02, printer: .98 };
  Object.entries(devices).forEach(([key, object]) => { object.userData.baseScale = baseScale[key]; object.scale.setScalar(baseScale[key]); object.visible = key === 'laptop'; rig.add(object); });
  const orbit = new THREE.Group(); hero.scene.add(orbit);
  [[.09, M.orangeGlow], [.05, M.greenGlow]].forEach(([r, mat]) => orbit.add(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat)));

  const tabs = document.querySelector('.stage-tabs');
  const statusCard = document.querySelector('.status-card');
  const statusTitle = document.getElementById('status-title');
  const statusSub = document.getElementById('status-sub');
  const feedbackEl = document.getElementById('device-feedback');
  const actionLabel = document.getElementById('device-action-label');
  const info = {
    laptop: { label: 'PC & Laptop', title: 'Alles läuft.', action: 'Laptop zuklappen', done: 'Neu gestartet – alles bereit.', aria: 'Laptop' },
    router: { label: 'WLAN & Internet', title: 'Verbunden.', action: 'WLAN verbinden', done: 'Verbindung steht – volles Signal.', aria: 'WLAN-Router' },
    printer: { label: 'Drucker & Zubehör', title: 'Druckbereit.', action: 'Seite drucken', done: 'Seite gedruckt.', aria: 'Drucker' }
  };
  let active = 'laptop', pending = 'laptop', transition = null, actionTime = -100, drag = 0, dragging = false, dragStart = 0, dragBase = 0, moved = false;
  function resetPose(object) { object.position.set(0, 0, 0); object.rotation.set(0, 0, 0); object.scale.setScalar(object.userData.baseScale); }
  function bumpStatus(title, sub) {
    statusTitle.textContent = title; statusSub.textContent = sub;
    if (!motion.paused) { statusCard.classList.remove('is-bumped'); void statusCard.offsetWidth; statusCard.classList.add('is-bumped'); }
  }
  function setDevice(name) {
    if (!devices[name] || name === pending) return;
    if (transition) active = time - transition.start > .45 ? transition.to : transition.from;
    Object.entries(devices).forEach(([key, object]) => { object.visible = key === active; resetPose(object); });
    pending = name; actionTime = -100;
    transition = active === name ? null : { from: active, to: name, start: time };
    document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === name)));
    tabs?.style.setProperty('--tab-index', String(['laptop', 'router', 'printer'].indexOf(name)));
    actionLabel.textContent = info[name].action;
    heroElement.setAttribute('aria-label', `Interaktive 3D-Ansicht: ${info[name].aria}`);
    feedbackEl.textContent = '';
    bumpStatus(info[name].title, info[name].label);
    if (motion.paused || motion.reduced) { devices[active].visible = false; active = name; devices[active].visible = true; transition = null; }
    dirty = true; start();
  }
  function tryDevice() {
    if (active !== pending) return;
    actionTime = time - (motion.paused || motion.reduced ? 4 : 0);
    feedbackEl.textContent = info[active].done;
    setTimeout(() => bumpStatus(info[active].title, info[active].done), motion.paused ? 0 : active === 'laptop' ? 1600 : 900);
    dirty = true; start();
  }
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => setDevice(button.dataset.scene)));
  document.getElementById('device-action').addEventListener('click', tryDevice);
  heroElement.addEventListener('pointerdown', event => { if (event.button !== 0) return; dragging = true; moved = false; dragStart = event.clientX; dragBase = drag; heroElement.setPointerCapture(event.pointerId); heroElement.classList.add('is-dragging'); });
  heroElement.addEventListener('pointermove', event => { if (!dragging) return; moved = moved || Math.abs(event.clientX - dragStart) > 4; drag = dragBase + (event.clientX - dragStart) * .007; dirty = true; start(); }, { passive: true });
  const endDrag = () => { const click = dragging && !moved; dragging = false; heroElement.classList.remove('is-dragging'); if (click) tryDevice(); };
  heroElement.addEventListener('pointerup', endDrag);
  heroElement.addEventListener('pointercancel', () => { dragging = false; heroElement.classList.remove('is-dragging'); });
  heroElement.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { drag += event.key === 'ArrowLeft' ? -.25 : .25; dirty = true; start(); event.preventDefault(); }
    if (event.key === 'Enter' || event.key === ' ') { tryDevice(); event.preventDefault(); }
  });
  heroElement.tabIndex = 0;

  const lid = devices.laptop.getObjectByName('lid');
  const waves = devices.router.getObjectByName('waves');
  const leds = devices.router.getObjectByName('leds');
  const sheet = devices.printer.getObjectByName('sheet');
  hero.update = (t, dt) => {
    if (transition) {
      const progress = clamp((t - transition.start) / .95);
      const departing = devices[transition.from], arriving = devices[transition.to];
      const exit = ease(progress / .5), enter = out((progress - .25) / .75);
      departing.scale.setScalar(departing.userData.baseScale * (1 - exit * .85)); departing.position.set(-exit * 1.6, 0, -exit * .6); departing.rotation.y = -exit * .7; departing.visible = exit < .98;
      arriving.visible = enter > 0; arriving.scale.setScalar(arriving.userData.baseScale * (.15 + .85 * enter)); arriving.position.set((1 - enter) * 1.6, 0, -(1 - enter) * .6); arriving.rotation.y = (1 - enter) * .7;
      stage.rotation.y = ease(progress) * .6; sweep.rotation.z = progress * 2.2; sweep.material.opacity = Math.sin(progress * PI) * .9;
      if (progress === 1) { active = transition.to; transition = null; resetPose(arriving); sweep.material.opacity = 0; }
    }
    const targetY = -.32 + drag + hero.pointer.x * .3;
    rig.rotation.y = motion.paused ? -.32 + drag : damp(rig.rotation.y, targetY + Math.sin(t * .3) * .04, 6, dt);
    rig.rotation.x = motion.paused ? 0 : damp(rig.rotation.x, hero.pointer.y * .06, 6, dt);
    rig.position.y = PLINTH + (motion.paused ? 0 : Math.sin(t * .8) * .025);
    orbit.children.forEach((orb, i) => { const a = t * .25 + i * PI; orb.position.set(Math.cos(a) * 3.12, PLINTH + .02, Math.sin(a) * 3.12); });
    const elapsed = actionTime > -50 ? t - actionTime : -1;
    // Laptop: close and reopen the lid.
    if (active === 'laptop' && elapsed >= 0 && elapsed < 2) { const close = ease(elapsed / .45), open = out((elapsed - .6) / 1.3); lid.rotation.x = lid.userData.open + (PI / 2 - .04 - lid.userData.open) * close * (1 - open); }
    else lid.rotation.x = lid.userData.open;
    // Router: pulsing waves, boosted after "connect".
    const boost = active === 'router' && elapsed >= 0 && elapsed < 3 ? Math.sin(clamp(elapsed / 3) * PI) : 0;
    waves.children.forEach((wave, i) => { if (!wave.material.transparent) return; const p = ((t * .9 + (2 - i) * .33) % 1); wave.scale.setScalar(.92 + p * .14 + boost * .25); wave.material.opacity = (.35 + Math.sin(p * PI) * .55) * (motion.paused ? 1 : 1); });
    leds.children.forEach((led, i) => { led.visible = !(boost > 0 && i > 0 && Math.sin(t * 18 + i * 1.7) > .3); });
    // Printer: feed a page.
    if (active === 'printer' && elapsed >= 0) { const feed = out((elapsed - .2) / 1.8); sheet.position.z = THREE.MathUtils.lerp(sheet.userData.zIn, sheet.userData.zOut, feed); sheet.position.y = sheet.userData.y0 - feed * .14; }
    else { sheet.position.z = sheet.userData.zIn; sheet.position.y = sheet.userData.y0; }
  };

  /* ---------------- Service illustrations ---------------- */
  for (const element of document.querySelectorAll('.service-art')) {
    const art = illustrations.create(element.dataset.render);
    const s = surface(element, { view: art.view, minWidth: 5.4, target: art.target, dir: new THREE.Vector3(1.1, .95, 2.3), fov: 22, extent: 4.5 });
    s.scene.add(art.group); shadowFloor(s.scene, 0, 20);
    art.group.rotation.y = -.12;
    const card = element.closest('.service-card');
    let hover = 0, hoverTarget = 0;
    const setHover = value => { hoverTarget = value; dirty = true; start(); };
    card.addEventListener('pointerenter', () => setHover(1)); card.addEventListener('pointerleave', () => setHover(0));
    card.addEventListener('focusin', () => setHover(1)); card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) setHover(0); });
    s.update = (t, dt) => { hover = motion.paused ? hoverTarget : damp(hover, hoverTarget, 6, dt); art.group.rotation.y = motion.paused ? -.12 : damp(art.group.rotation.y, -.12 + hover * .16 + s.pointer.x * .14, 5, dt); art.update(t, hover, dt); };
  }

  /* ---------------- Neighbourhood model ---------------- */
  const mapElement = document.querySelector('[data-render="map"]');
  if (mapElement) {
    const map = surface(mapElement, { view: 5.8, minWidth: 9.0, target: new THREE.Vector3(0, .2, .1), dir: new THREE.Vector3(1.15, 1.45, 1.8), fov: 26, shadowSize: 2048, extent: 6 });
    const town = new THREE.Group(); map.scene.add(town); town.rotation.y = -.18;
    shadowFloor(map.scene, 0, 30);
    const terrain = slab(7.2, 5.4, .32, .45, M.plinth); terrain.position.y = .16; terrain.castShadow = true; town.add(terrain);
    const G = .32;
    const roadV = box(.62, .01, 5.0, M.road, -.15, G + .005, 0); roadV.castShadow = false; town.add(roadV);
    const roadH = box(6.8, .012, .62, M.road, 0, G + .006, .1); roadH.castShadow = false; town.add(roadH);
    for (let i = 0; i < 15; i++) { if (Math.abs(-3.1 + i * .44 + .15) < .4) continue; town.add(box(.2, .004, .03, M.paper, -3.1 + i * .44, G + .013, .1)); }
    for (let i = 0; i < 11; i++) { if (Math.abs(-2.2 + i * .44 - .1) < .4) continue; town.add(box(.03, .004, .2, M.paper, -.15, G + .012, -2.2 + i * .44)); }
    const roofShape = new THREE.Shape(); roofShape.moveTo(-.5, 0); roofShape.lineTo(0, .38); roofShape.lineTo(.5, 0); roofShape.closePath();
    function house(x, z, w, d, h, roofMat, rotation = 0) {
      const g = new THREE.Group(); g.position.set(x, G, z); g.rotation.y = rotation; town.add(g);
      g.add(box(w, h, d, M.white, 0, h / 2, 0));
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d + .1, bevelEnabled: false }); roofGeo.translate(0, 0, -(d + .1) / 2);
      const roof = new THREE.Mesh(roofGeo, roofMat); roof.scale.set((w + .12) / 1, 1, 1); roof.position.y = h; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
      const door = box(.12, .22, .01, M.graphite, -w * .2, .11, d / 2 + .005); g.add(door);
      const win = box(.16, .14, .01, M.glass, w * .2, h * .55, d / 2 + .005); g.add(win);
      const win2 = box(.01, .14, .16, M.glass, w / 2 + .005, h * .55, 0); g.add(win2);
      return g;
    }
    house(-2.45, -1.55, .8, .7, .55, M.graphite, .1);
    house(-1.3, -1.6, .7, .65, .7, M.orange);
    house(2.55, -1.4, .75, .7, .6, M.graphite, -.1);
    house(-2.35, 1.4, .8, .7, .6, M.graphite);
    house(-1.15, 1.65, .65, .6, .5, M.graphite, -.15);
    house(1.6, 1.5, .8, .7, .65, M.graphite, .05);
    house(2.7, 1.55, .6, .6, .5, M.orange, .1);
    // Office (destination)
    const office = new THREE.Group(); office.position.set(1.15, G, -1.6); town.add(office);
    office.add(box(.95, 1.15, .8, M.white, 0, .575, 0));
    office.add(box(1.0, .06, .85, M.graphite, 0, 1.18, 0));
    for (let r = 0; r < 3; r++) { office.add(box(.82, .14, .01, M.glass, 0, .32 + r * .3, .405)); office.add(box(.01, .14, .68, M.glass, .48, .32 + r * .3, 0)); }
    const sign = box(.3, .08, .01, M.orangeGlow, 0, 1.06, .406); office.add(sign);
    // Trees
    for (const [x, z, s] of [[-3.05, -.7, 1], [.55, -2.1, .85], [3.05, .7, 1.1], [.7, 2.1, .9], [-3.0, 2.15, .8], [-.75, -.75, .7], [2.0, -.6, .8]]) {
      const trunk = cylinder(.035, .22 * s, M.graphite, 8); trunk.position.set(x, G + .11 * s, z); town.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.22 * s, 2), M.sage); crown.position.set(x, G + .3 * s, z); crown.castShadow = true; town.add(crown);
    }
    // Pin, pulse and route
    const pinGroup = new THREE.Group(); pinGroup.position.set(-2.35, G + 1.25, 1.4); town.add(pinGroup);
    const pinHead = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 18), M.orange); pinHead.castShadow = true; pinGroup.add(pinHead);
    const pinDot = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 12), M.paper); pinDot.position.z = .15; pinGroup.add(pinDot);
    const pinTip = new THREE.Mesh(new THREE.ConeGeometry(.16, .34, 24), M.orange); pinTip.rotation.z = PI; pinTip.position.y = -.25; pinTip.castShadow = true; pinGroup.add(pinTip);
    const pulse = new THREE.Mesh(new THREE.RingGeometry(.2, .26, 48), M.signal.clone()); pulse.rotation.x = -PI / 2; pulse.position.set(-2.35, G + .015, 1.4); town.add(pulse);
    const route = [[-2.35, G + .03, 1.4], [-2.35, G + .03, .1], [-.15, G + .03, .1], [-.15, G + .03, -1.05], [1.15, G + .03, -1.1]];
    const curve = new THREE.CatmullRomCurve3(route.map(p => new THREE.Vector3(...p)), false, 'catmullrom', .08);
    const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .028, 8, false), M.orangeGlow); town.add(path);
    // Service van
    const van = new THREE.Group(); town.add(van);
    van.add(rounded(.3, .24, .56, .06, M.white)); van.children[0].position.y = .02;
    van.add(box(.31, .045, .5, M.orange, 0, -.04, -.02));
    van.add(box(.26, .1, .02, M.glass, 0, .07, .28));
    van.add(box(.012, .08, .14, M.glass, .155, .07, .17)); van.add(box(.012, .08, .14, M.glass, -.155, .07, .17));
    for (const x of [-.15, .15]) for (const z of [-.17, .17]) { const wheel = cylinder(.06, .04, M.black, 16); wheel.rotation.z = PI / 2; wheel.position.set(x, -.11, z); van.add(wheel); }
    map.update = (t, dt) => {
      town.rotation.y = motion.paused ? -.18 : damp(town.rotation.y, -.18 + map.pointer.x * .18, 4, dt);
      const p = (t % 12) / 12, travel = ease(clamp((p - .1) / .72));
      van.position.copy(curve.getPointAt(travel)); van.position.y = G + .17;
      const tangent = curve.getTangentAt(Math.min(.999, Math.max(.001, travel))); van.rotation.y = Math.atan2(tangent.x, tangent.z);
      van.scale.setScalar(ease(Math.min(p / .08, (1 - p) / .08)));
      pinGroup.position.y = G + 1.25 + Math.sin(t * 1.6) * .06; pinGroup.rotation.y = -town.rotation.y + .35;
      const q = (t % 2.6) / 2.6; pulse.scale.setScalar(1 + q * 4); pulse.material.opacity = (1 - q) * .7;
    };
  }

  /* ---------------- Loop ---------------- */
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, innerWidth < 640 ? 1.5 : 2);
    let maxWidth = 512, maxHeight = 512;
    for (const s of surfaces) {
      const r = s.element.getBoundingClientRect();
      s.width = Math.max(1, Math.round(r.width * ratio)); s.height = Math.max(1, Math.round(r.height * ratio));
      s.canvas.width = s.width; s.canvas.height = s.height;
      maxWidth = Math.max(maxWidth, s.width); maxHeight = Math.max(maxHeight, s.height);
      fitCamera(s, r.width, r.height);
    }
    bufferWidth = Math.min(2400, maxWidth); bufferHeight = Math.min(2000, maxHeight);
    renderer.setSize(bufferWidth, bufferHeight, false);
    dirty = true; start();
  }
  const observer = new IntersectionObserver(entries => { for (const entry of entries) { const s = surfaces.find(item => item.element === entry.target); if (s) s.visible = entry.isIntersecting; } dirty = true; start(); }, { rootMargin: '120px' });
  surfaces.forEach(s => observer.observe(s.element));
  const resizeObserver = new ResizeObserver(() => resize());
  surfaces.forEach(s => resizeObserver.observe(s.element));
  document.addEventListener('weiztech:motion', () => { dirty = true; last = performance.now(); start(); });
  document.addEventListener('weiztech:theme', () => { M.setTheme(isDark()); blobMaterials.forEach(m => { m.opacity = m.userData.base * (isDark() ? 1.8 : 1); m.color.set(isDark() ? 0x000000 : 0x1b1a17); }); surfaces.forEach(themeLights); dirty = true; start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (frame) cancelAnimationFrame(frame); frame = 0; } else { last = performance.now(); dirty = true; start(); } });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; if (frame) cancelAnimationFrame(frame); frame = 0; surfaces.forEach(s => s.element.classList.remove('scene-ready')); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; resize(); });
  function start() { if (warmed && !frame && !document.hidden && !lost) frame = requestAnimationFrame(loop); }
  function loop(now) {
    frame = 0; if (document.hidden || lost) return;
    const interval = innerWidth < 640 ? 1000 / 30 : 1000 / 45;
    if (!dirty && now - last < interval - 1) { frame = requestAnimationFrame(loop); return; }
    const dt = Math.min((now - last) / 1000, .08); last = now; if (!motion.paused) time += dt;
    const visible = surfaces.filter(s => s.visible);
    for (const s of visible) {
      if (motion.paused && !dirty) continue;
      s.update(time, motion.paused ? 0 : dt);
      const w = Math.min(s.width, bufferWidth), h = Math.min(s.height, bufferHeight);
      renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h);
      renderer.render(s.scene, s.camera);
      s.ctx.clearRect(0, 0, s.width, s.height);
      s.ctx.drawImage(renderer.domElement, 0, bufferHeight - h, w, h, 0, 0, s.width, s.height);
      s.element.classList.add('scene-ready');
    }
    dirty = false;
    if (!motion.paused && visible.length) frame = requestAnimationFrame(loop);
  }
  // Compile shaders off the main thread where supported (all three hero devices included), then start.
  resize();
  const hidden = Object.values(devices).filter(object => !object.visible);
  hidden.forEach(object => { object.visible = true; });
  const warm = renderer.compileAsync ? Promise.all(surfaces.map(s => renderer.compileAsync(s.scene, s.camera).catch(() => {}))) : Promise.resolve();
  hidden.forEach(object => { object.visible = false; });
  Promise.race([warm, new Promise(resolve => setTimeout(resolve, 3000))]).then(() => { warmed = true; dirty = true; last = performance.now(); start(); });
}
