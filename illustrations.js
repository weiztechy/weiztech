import * as THREE from './assets/vendor/three.module.min.js';
import { rounded, slab, box, cylinder, markMesh, drawMark, roundRect, canvasTexture, screenMaterial, fonts } from './models.js';

// Six bespoke service illustrations. Each stands on y = 0 and returns
// { group, view, target, update(time, hover, dt) }.
const TAU = Math.PI * 2, PI = Math.PI;
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const phase = (t, d, o = 0) => (((t + o) % d) + d) % d / d;
const damp = (c, t, s, dt) => THREE.MathUtils.lerp(c, t, 1 - Math.exp(-s * dt));
const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };

export function createIllustrationLibrary(renderer, M) {
  const textures = [];
  const tex = (w, h, draw) => { const t = canvasTexture(renderer, w, h, draw); textures.push(t); return t; };

  /* ---------- Shared screen artwork ---------- */
  const check = (ctx, x, y, r, fill = '#1fae78', stroke = '#ffffff', width) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = width || r * .28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * .42, y + r * .02); ctx.lineTo(x - r * .1, y + r * .34); ctx.lineTo(x + r * .45, y - r * .32); ctx.stroke();
  };
  const dashboard = tex(800, 480, (ctx, W, H) => {
    ctx.fillStyle = '#f7f7f5'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, 54); ctx.fillStyle = '#e7e6e2'; ctx.fillRect(0, 54, W, 2);
    drawMark(ctx, 22, 15, 40); ctx.fillStyle = '#121418'; ctx.font = `700 22px ${fonts.body}`; ctx.textBaseline = 'middle'; ctx.fillText('Systemstatus', 76, 28);
    check(ctx, W - 36, 28, 14);
    const card = (x, y, w, h) => { roundRect(ctx, x, y, w, h, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e7e6e2'; ctx.lineWidth = 2; ctx.stroke(); };
    card(22, 78, 360, 180); card(400, 78, 378, 180); card(22, 276, 756, 180);
    ctx.fillStyle = '#5f6570'; ctx.font = `600 18px ${fonts.body}`; ctx.fillText('Leistung', 44, 108); ctx.fillText('Speicher', 422, 108); ctx.fillText('Aktivität', 44, 306);
    ctx.fillStyle = '#121418'; ctx.font = `600 56px ${fonts.display}`; ctx.fillText('98 %', 44, 170); ctx.fillText('412 GB', 422, 170);
    roundRect(ctx, 44, 214, 316, 14, 7); ctx.fillStyle = '#eceae6'; ctx.fill(); roundRect(ctx, 44, 214, 300, 14, 7); ctx.fillStyle = '#1fae78'; ctx.fill();
    roundRect(ctx, 422, 214, 334, 14, 7); ctx.fillStyle = '#eceae6'; ctx.fill(); roundRect(ctx, 422, 214, 150, 14, 7); ctx.fillStyle = '#ff9a1a'; ctx.fill();
    ctx.strokeStyle = '#ff9a1a'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
    [0, 18, 10, 34, 26, 52, 40, 70, 58, 84, 76, 92].forEach((v, i) => { const x = 44 + i * 64, y = 430 - v; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.lineTo(44 + 11 * 64, 440); ctx.lineTo(44, 440); ctx.closePath(); ctx.fillStyle = 'rgba(255,154,26,.12)'; ctx.fill();
  });
  const phoneDone = tex(300, 600, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fbfbfa'); g.addColorStop(1, '#f1f0ec'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#121418'; ctx.font = `700 20px ${fonts.body}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10:24', W / 2, 40);
    check(ctx, W / 2, 250, 66);
    ctx.font = `600 40px ${fonts.display}`; ctx.fillText('Fertig', W / 2, 368);
    ctx.fillStyle = '#5f6570'; ctx.font = `500 20px ${fonts.body}`; ctx.fillText('Alles eingerichtet', W / 2, 410);
    roundRect(ctx, 40, 500, W - 80, 56, 28); ctx.fillStyle = '#ff9a1a'; ctx.fill();
    ctx.fillStyle = '#1c1204'; ctx.font = `700 22px ${fonts.body}`; ctx.fillText('Los geht’s', W / 2, 529);
  });
  const photo = tex(360, 270, (ctx, W, H) => {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#ffcf91'); sky.addColorStop(1, '#ffeedd'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(260, 80, 30, 0, TAU); ctx.fillStyle = '#ff9a1a'; ctx.fill();
    ctx.fillStyle = '#86b592'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(90, 130); ctx.lineTo(170, 190); ctx.lineTo(250, 120); ctx.lineTo(W, 200); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#5c8f6a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(140, 210); ctx.lineTo(W, 230); ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14; ctx.strokeRect(0, 0, W, H);
  });
  const document_ = tex(360, 500, (ctx, W, H) => {
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, W, H);
    drawMark(ctx, 30, 30, 50);
    ctx.fillStyle = '#121418'; roundRect(ctx, 30, 100, 200, 22, 11); ctx.fill();
    ctx.fillStyle = '#c9cbd0'; [280, 250, 290, 210, 270, 240, 160].forEach((w, i) => { roundRect(ctx, 30, 160 + i * 40, w, 12, 6); ctx.fill(); });
    ctx.fillStyle = '#ff9a1a'; roundRect(ctx, 30, 450, 110, 18, 9); ctx.fill();
  });
  const photoMat = new THREE.MeshStandardMaterial({ map: photo.texture, roughness: .7 });
  const docMat = new THREE.MeshStandardMaterial({ map: document_.texture, roughness: .9 });
  const setupSteps = ['Benutzerkonto', 'E-Mail', 'WLAN', 'Programme'];
  let setupDone = 0;
  const setupScreen = tex(800, 560, (ctx, W, H) => {
    ctx.fillStyle = '#fbfbfa'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#121418'; ctx.font = `600 44px ${fonts.display}`; ctx.textBaseline = 'middle'; ctx.fillText('Willkommen!', 48, 70);
    ctx.fillStyle = '#5f6570'; ctx.font = `500 22px ${fonts.body}`; ctx.fillText('Ihr neues Gerät wird eingerichtet', 50, 118);
    setupSteps.forEach((label, i) => {
      const y = 170 + i * 84; roundRect(ctx, 44, y, W - 88, 66, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e7e6e2'; ctx.lineWidth = 2; ctx.stroke();
      if (i < setupDone) check(ctx, 86, y + 33, 18);
      else { ctx.beginPath(); ctx.arc(86, y + 33, 17, 0, TAU); ctx.strokeStyle = i === setupDone ? '#ff9a1a' : '#d5d4cf'; ctx.lineWidth = 4; ctx.stroke(); }
      ctx.fillStyle = i < setupDone ? '#121418' : '#5f6570'; ctx.font = `${i < setupDone ? 700 : 600} 25px ${fonts.body}`; ctx.fillText(label, 124, y + 34);
    });
    roundRect(ctx, 44, H - 40, W - 88, 12, 6); ctx.fillStyle = '#eceae6'; ctx.fill();
    roundRect(ctx, 44, H - 40, Math.max(12, (W - 88) * setupDone / setupSteps.length), 12, 6); ctx.fillStyle = '#ff9a1a'; ctx.fill();
  });

  /* ---------- Shared parts ---------- */
  function monitor(screenTexture, w = 2.6, h = 1.55) {
    const g = new THREE.Group();
    const shell = rounded(w, h, .07, .06, M.aluminium); shell.position.y = h / 2 + .55; g.add(shell);
    const glass = rounded(w - .04, h - .04, .01, .05, M.glass, .003); glass.position.set(0, h / 2 + .55, .036); g.add(glass);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - .12, h - .2), screenMaterial(screenTexture)); screen.position.set(0, h / 2 + .58, .042); g.add(screen);
    const neck = rounded(.32, .75, .06, .03, M.aluminium); neck.position.set(0, .42, -.12); neck.rotation.x = -.12; g.add(neck);
    const foot = slab(.9, .6, .04, .08, M.aluminium); foot.position.set(0, .02, -.05); g.add(foot);
    return g;
  }
  function phone(screenTexture, s = 1) {
    const g = new THREE.Group();
    g.add(rounded(.86, 1.74, .08, .14, M.spaceGray));
    const glass = rounded(.82, 1.7, .01, .12, M.glass, .003); glass.position.z = .041; g.add(glass);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.76, 1.52), screenMaterial(screenTexture)); screen.position.z = .047; g.add(screen);
    const island = rounded(.2, .05, .005, .025, M.black, .002); island.position.set(0, .74, .05); g.add(island);
    g.scale.setScalar(s); return g;
  }
  function card(material, w, h) {
    const g = new THREE.Group();
    const back = rounded(w, h, .02, .03, M.paper, .006); g.add(back);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - .02, h - .02), material); face.position.z = .011; g.add(face);
    return g;
  }
  function checkBadge(r = .32) {
    const g = new THREE.Group();
    const disc = cylinder(r, .08, M.green, 40); disc.rotation.x = PI / 2; g.add(disc);
    const a = box(.07 * r / .32, .2 * r / .32, .04, M.paper); a.position.set(-.07 * r / .32, -.02 * r / .32, .05); a.rotation.z = .75; g.add(a);
    const b = box(.07 * r / .32, .38 * r / .32, .04, M.paper); b.position.set(.06 * r / .32, .03 * r / .32, .05); b.rotation.z = -.68; g.add(b);
    return g;
  }

  /* ---------- 1 · PC & Laptop: workstation ---------- */
  function workstation() {
    const group = new THREE.Group();
    const screen = monitor(dashboard.texture); screen.position.set(-.55, 0, -.35); screen.rotation.y = .08; group.add(screen);
    const tower = new THREE.Group(); tower.position.set(1.85, 0, -.3); tower.rotation.y = -.35; group.add(tower);
    const body = rounded(.9, 1.9, .95, .06, M.graphite); body.position.y = .95; tower.add(body);
    const panel = rounded(.04, 1.75, .85, .04, M.tint); panel.position.set(.465, .95, 0); tower.add(panel);
    // Glass side panel faces +x after rotation; fans glow behind it.
    const fans = [];
    for (let i = 0; i < 2; i++) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.26, .025, 10, 48), M.orangeGlow); rim.rotation.y = PI / 2; rim.position.set(.43, 1.35 - i * .62, .05); tower.add(rim);
      const fan = new THREE.Group(); fan.position.copy(rim.position); fan.position.x = .41; fan.rotation.y = PI / 2;
      for (let j = 0; j < 7; j++) { const blade = box(.06, .2, .01, M.spaceGray); blade.position.set(Math.sin(j * TAU / 7) * .12, Math.cos(j * TAU / 7) * .12, 0); blade.rotation.z = -j * TAU / 7 + .5; fan.add(blade); }
      tower.add(fan); fans.push(fan);
    }
    tower.add(box(.02, .1, .1, M.greenGlow, .3, 1.85, .47));
    tower.add(box(.3, .03, .02, M.spaceGray, 0, 1.7, .478));
    const keyboard = new THREE.Group(); keyboard.position.set(-.6, 0, .75); keyboard.rotation.y = .06; group.add(keyboard);
    keyboard.add(at(slab(2.3, .72, .06, .06, M.aluminium), 0, .03, 0));
    const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.whiteMatte, 60); const o = new THREE.Object3D(); let k = 0;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) { o.position.set(-1.02 + c * .17, .07, -.24 + r * .155); o.scale.set(.145, .025, .13); o.updateMatrix(); keys.setMatrixAt(k++, o.matrix); }
    keys.count = k; keys.castShadow = true; keyboard.add(keys);
    const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .16, 8, 16), M.aluminium); mouse.scale.set(1, .45, 1); mouse.rotation.x = PI / 2; mouse.position.set(1.05, .06, .8); mouse.castShadow = true; group.add(mouse);
    const mug = cylinder(.15, .32, M.orange, 28); mug.position.set(-2.15, .16, .55); group.add(mug);
    let spin = 0;
    return { group, view: 3.6, target: new THREE.Vector3(0, .95, 0), update(t, hover, dt) { spin += (1.2 + hover * 4) * dt; fans.forEach((f, i) => f.rotation.z = -spin - i); } };
  }

  /* ---------- 2 · WLAN: mesh system ---------- */
  function wifi() {
    const group = new THREE.Group();
    const nodes = [];
    [[0, -.45, 1.5], [-1.9, .35, 1.05], [1.9, .35, 1.05]].forEach(([x, z, h], i) => {
      const node = new THREE.Group(); node.position.set(x, 0, z); group.add(node);
      const body = rounded(.9, h, .9, .32, M.white); body.position.y = h / 2; node.add(body);
      const cap = slab(.78, .78, .04, .28, M.whiteMatte, .01); cap.position.y = h + .005; node.add(cap);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.18, .02, 8, 40), M.orangeGlow); ring.rotation.x = -PI / 2; ring.position.y = h + .03; node.add(ring);
      const led = box(.18, .03, .01, i === 0 ? M.greenGlow : M.orangeGlow, 0, h * .18, .455); led.castShadow = false; node.add(led);
      if (i === 0) { const mark = markMesh(M.spaceGray, M.orange, .34, .01); mark.position.set(0, h * .62, .452); node.add(mark); }
      nodes.push({ node, h });
    });
    const waves = [];
    for (let i = 0; i < 3; i++) {
      const wave = new THREE.Mesh(new THREE.TorusGeometry(.6, .018, 8, 80), M.signal.clone()); wave.rotation.x = -PI / 2; wave.position.set(0, 1.62, -.45); group.add(wave); waves.push(wave);
    }
    // Arched links with travelling packets.
    const links = [], packets = [];
    nodes.slice(1).forEach(({ node, h }) => {
      const a = new THREE.Vector3(0, 1.55, -.45), b = new THREE.Vector3(node.position.x, h + .1, node.position.z);
      const mid = a.clone().lerp(b, .5); mid.y += .55;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .012, 6, false), M.signal.clone()); tube.material.opacity = .45; group.add(tube);
      links.push(curve);
      for (let j = 0; j < 2; j++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 10), M.orangeGlow); group.add(p); packets.push({ mesh: p, curve, offset: j * .5 }); }
    });
    const laptopMini = new THREE.Group(); laptopMini.position.set(-.1, 0, 1.05); laptopMini.rotation.y = -.25; group.add(laptopMini);
    laptopMini.add(at(slab(1.1, .75, .04, .05, M.aluminium), 0, .02, 0));
    const lidMini = rounded(1.1, .72, .025, .05, M.aluminium); lidMini.position.set(0, .4, -.42); lidMini.rotation.x = -.25; laptopMini.add(lidMini);
    const lidScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .6), screenMaterial(dashboard.texture)); lidScreen.position.set(0, .4, -.405); lidScreen.rotation.x = -.25; laptopMini.add(lidScreen);
    return {
      group, view: 3.4, target: new THREE.Vector3(0, .8, 0), update(t, hover) {
        waves.forEach((w, i) => { const p = phase(t, 3.6, i * 1.2); w.scale.setScalar(.6 + p * 2.2); w.material.opacity = Math.sin(p * PI) * (.55 + hover * .3); });
        packets.forEach(({ mesh, curve, offset }) => { const p = phase(t * (1 + hover), 2.4, offset * 2.4); mesh.position.copy(curve.getPointAt(p)); mesh.scale.setScalar(smooth(Math.min(p / .12, (1 - p) / .12))); });
      }
    };
  }

  /* ---------- 3 · Drucker & Zubehör: flatbed scanner ---------- */
  function scanner() {
    const group = new THREE.Group();
    const chassis = slab(3.2, 2.2, .34, .2, M.white); chassis.position.y = .17; group.add(chassis);
    const bed = slab(2.7, 1.7, .012, .06, M.glass, .004); bed.position.set(0, .342, .05); group.add(bed);
    const doc = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .9), photoMat); doc.rotation.x = -PI / 2; doc.rotation.z = .06; doc.position.set(-.4, .35, .15); group.add(doc);
    const bar = box(2.6, .02, .06, M.orangeGlow, 0, .356, -.7); bar.castShadow = false; group.add(bar);
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .5), new THREE.MeshBasicMaterial({ color: 0xffb45c, transparent: true, opacity: .22, depthWrite: false, toneMapped: false }));
    beam.rotation.x = -PI / 2; beam.position.set(0, .358, -.7); group.add(beam);
    const hinge = new THREE.Group(); hinge.position.set(0, .36, -1.08); hinge.rotation.x = -1.05; group.add(hinge);
    const lid = slab(3.2, 2.15, .1, .18, M.white); lid.position.set(0, .05, 1.07); hinge.add(lid);
    const pad = slab(2.7, 1.7, .01, .06, M.whiteMatte, .003); pad.position.set(0, -.006, 1.07); hinge.add(pad);
    const btn = cylinder(.06, .02, M.orangeGlow, 20); btn.position.set(1.3, .345, .95); group.add(btn);
    group.add(box(.22, .02, .02, M.greenGlow, 1.0, .345, .95));
    const print = card(photoMat, 1.0, .75); print.rotation.set(-PI / 2, 0, -.35); print.position.set(2.15, .012, .75); group.add(print);
    const print2 = card(docMat, .72, 1.0); print2.rotation.set(-PI / 2, 0, .2); print2.position.set(2.05, .03, -.15); group.add(print2);
    return {
      group, view: 3.0, target: new THREE.Vector3(.2, .55, 0), update(t, hover, dt) {
        const p = phase(t, 5.5), sweep = p < .7 ? smooth((p - .1) / .6) : 1 - smooth((p - .7) / .3);
        bar.position.z = -.7 + sweep * 1.5; beam.position.z = bar.position.z;
        beam.material.opacity = (p < .7 ? .25 : .08) + hover * .1;
        hinge.rotation.x = damp(hinge.rotation.x, -1.05 - hover * .18, 5, dt);
      }
    };
  }

  /* ---------- 4 · Neue Geräte: tablet setup ---------- */
  function setup() {
    const group = new THREE.Group();
    const tablet = new THREE.Group(); tablet.position.set(-.35, 1.2, -.2); tablet.rotation.x = -.22; group.add(tablet);
    tablet.add(rounded(2.6, 1.85, .08, .16, M.aluminium));
    const glass = rounded(2.56, 1.81, .01, .14, M.glass, .003); glass.position.z = .041; tablet.add(glass);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 1.69), screenMaterial(setupScreen.texture)); screen.position.z = .047; tablet.add(screen);
    const stand = new THREE.Group(); stand.position.set(-.35, 0, -.35); group.add(stand);
    stand.add(at(slab(1.1, .8, .05, .1, M.aluminium), 0, .025, .05));
    const arm = rounded(.4, 1.0, .05, .04, M.aluminium); arm.position.set(0, .5, -.1); arm.rotation.x = -.35; stand.add(arm);
    const mobile = phone(phoneDone.texture, .85); mobile.position.set(1.55, .74, .4); mobile.rotation.set(-.12, -.35, 0); group.add(mobile);
    const dock = slab(.62, .5, .08, .1, M.graphite); dock.position.set(1.55, .04, .45); group.add(dock);
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[1.55, .05, .7], [1.4, .02, 1.2], [.4, .02, 1.25], [-1.6, .02, .9], [-2.1, .02, .2]].map(p => new THREE.Vector3(...p))), 64, .025, 8), M.whiteMatte);
    cable.castShadow = true; group.add(cable);
    const plug = rounded(.36, .24, .2, .06, M.white); plug.position.set(-2.2, .12, .05); group.add(plug);
    let last = -1;
    return {
      group, view: 3.0, target: new THREE.Vector3(0, .9, 0), update(t, hover) {
        const p = phase(t, 8);
        const done = hover > .5 ? setupSteps.length : Math.min(setupSteps.length, Math.floor(p * 6));
        if (done !== last) { last = done; setupDone = done; setupScreen.redraw(); }
        mobile.position.y = .74 + Math.sin(t * 1.2) * .03;
      }
    };
  }

  /* ---------- 5 · Daten übertragen: SSD to phone ---------- */
  function transfer() {
    const group = new THREE.Group();
    const ssd = new THREE.Group(); ssd.position.set(-1.6, 0, .1); ssd.rotation.y = .3; group.add(ssd);
    const ssdBody = slab(1.1, 1.6, .22, .16, M.spaceGray); ssdBody.position.y = .11; ssd.add(ssdBody);
    ssd.add(box(1.1, .04, .08, M.orange, 0, .2, .6));
    const ssdMark = markMesh(M.aluminiumPolished, M.orange, .45, .008); ssdMark.rotation.x = -PI / 2; ssdMark.position.set(0, .226, -.2); ssd.add(ssdMark);
    ssd.add(box(.08, .02, .02, M.greenGlow, .38, .2, .64));
    const mobile = phone(phoneDone.texture, 1.0); mobile.position.set(1.65, .9, -.1); mobile.rotation.set(-.08, -.35, 0); group.add(mobile);
    const dock = slab(.7, .55, .08, .1, M.graphite); dock.position.set(1.65, .04, 0); group.add(dock);
    const curve = new THREE.CatmullRomCurve3([[-1.45, .35, .1], [-.9, 1.5, .2], [.4, 1.7, .1], [1.3, 1.1, 0]].map(p => new THREE.Vector3(...p)));
    const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .01, 6, false), M.signal.clone()); path.material.opacity = .35; group.add(path);
    const items = [];
    for (let i = 0; i < 4; i++) { const c = i % 2 ? card(photoMat, .5, .38) : card(docMat, .36, .5); group.add(c); items.push(c); }
    const folder = new THREE.Group(); folder.position.set(.1, 0, .9); folder.rotation.y = -.2; group.add(folder);
    const fBody = slab(.95, .7, .06, .06, M.orange); fBody.position.y = .03; folder.add(fBody);
    const fTab = slab(.35, .14, .06, .04, M.orange); fTab.position.set(-.27, .03, -.38); folder.add(fTab);
    return {
      group, view: 2.9, target: new THREE.Vector3(0, .8, 0), update(t, hover) {
        items.forEach((c, i) => {
          const p = phase(t * (1 + hover * .8), 5, i * 1.25);
          c.position.copy(curve.getPointAt(p));
          c.scale.setScalar(smooth(Math.min(p / .12, (1 - p) / .12)));
          c.rotation.set(-.15, Math.sin(p * PI) * .5 - .2, Math.sin(p * TAU) * .15);
        });
      }
    };
  }

  /* ---------- 6 · Kaufberatung: comparison ---------- */
  function consult() {
    const group = new THREE.Group();
    const left = new THREE.Group(), right = new THREE.Group();
    left.position.set(-1.25, 0, 0); right.position.set(1.25, 0, 0); group.add(left, right);
    [left, right].forEach((g, i) => {
      const podium = cylinder(.95, i ? .32 : .2, M.plinthEdge, 64); podium.position.y = i ? .16 : .1; g.add(podium);
      const top = cylinder(.97, .02, M.plinth, 64); top.position.y = i ? .33 : .21; g.add(top);
    });
    // Left: compact laptop; right: tablet with keyboard (recommended).
    const lap = new THREE.Group(); lap.position.set(0, .22, 0); lap.rotation.y = .4; left.add(lap);
    lap.add(at(slab(1.3, .9, .05, .06, M.spaceGray), 0, .025, 0));
    const lapLid = rounded(1.3, .85, .03, .06, M.spaceGray); lapLid.position.set(0, .46, -.5); lapLid.rotation.x = -.28; lap.add(lapLid);
    const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .72), screenMaterial(dashboard.texture)); lapScreen.position.set(0, .465, -.482); lapScreen.rotation.x = -.28; lap.add(lapScreen);
    const tab = new THREE.Group(); tab.position.set(0, .34, 0); tab.rotation.y = -.4; right.add(tab);
    tab.add(at(slab(1.4, .7, .05, .06, M.graphite), 0, .025, .2));
    const tabBody = rounded(1.4, .98, .05, .08, M.aluminium); tabBody.position.set(0, .5, -.2); tabBody.rotation.x = -.3; tab.add(tabBody);
    const tabScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .88), screenMaterial(setupScreen.texture)); tabScreen.position.set(0, .508, -.174); tabScreen.rotation.x = -.3; tab.add(tabScreen);
    const badge = checkBadge(.26); badge.position.set(1.25, 1.75, .1); group.add(badge);
    const label = new THREE.Group(); label.position.set(-1.25, 1.45, .1); group.add(label);
    for (let i = 0; i < 3; i++) { const star = new THREE.Mesh(new THREE.OctahedronGeometry(.07, 0), i < 2 ? M.orange : M.plinthEdge); star.position.x = (i - 1) * .2; label.add(star); }
    return {
      group, view: 2.8, target: new THREE.Vector3(0, .75, 0), update(t, hover, dt) {
        badge.position.y = 1.75 + Math.sin(t * 1.4) * .05; badge.rotation.y = Math.sin(t * .8) * .35;
        badge.scale.setScalar(damp(badge.scale.x, 1 + hover * .18, 6, dt));
        label.rotation.y = t * .5;
      }
    };
  }

  /* ---------- Business page: small office ---------- */
  function office() {
    const group = new THREE.Group();
    const F = .12; // floor top
    const floor = slab(6.6, 4.6, F, .32, M.plinth); floor.position.y = F / 2; group.add(floor);
    const wall = box(6.6, 2.3, .12, M.whiteMatte, 0, F + 1.15, -2.24); group.add(wall);
    const windowPane = box(1.9, 1.0, .02, M.tint, -1.6, F + 1.45, -2.17); group.add(windowPane);
    group.add(box(1.98, .05, .06, M.aluminium, -1.6, F + .93, -2.16));
    const sign = markMesh(M.spaceGray, M.orange, .75, .03); sign.position.set(2.45, F + 1.85, -2.16); group.add(sign);
    // Wall shelf with router
    group.add(box(1.1, .05, .34, M.white, .35, F + 1.55, -2.0));
    const router = new THREE.Group(); router.position.set(.35, F + 1.6, -2.0); group.add(router);
    router.add(at(slab(.7, .3, .09, .06, M.graphite), 0, .045, 0));
    for (let i = 0; i < 4; i++) { const led = box(.05, .015, .01, i ? M.greenGlow : M.orangeGlow, -.15 + i * .1, .05, .152); led.castShadow = false; router.add(led); }
    for (const x of [-.26, .26]) { const ant = rounded(.07, .5, .03, .03, M.graphite); ant.position.set(x, .3, -.12); ant.rotation.z = x > 0 ? -.12 : .12; router.add(ant); }

    function desk(x, z, rotation) {
      const d = new THREE.Group(); d.position.set(x, F, z); d.rotation.y = rotation; group.add(d);
      d.add(at(slab(2.0, 1.0, .07, .04, M.white), 0, .95, 0));
      for (const lx of [-.92, .92]) for (const lz of [-.42, .42]) d.add(box(.05, .92, .05, M.aluminium, lx, .46, lz));
      const screen = monitor(dashboard.texture, 2.6, 1.55); screen.scale.setScalar(.5); screen.position.set(0, .985, -.2); d.add(screen);
      d.add(at(slab(.9, .28, .03, .03, M.aluminium), -.05, 1.0, .22));
      const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .07, 6, 12), M.aluminium); mouse.scale.set(1, .45, 1); mouse.rotation.x = PI / 2; mouse.position.set(.55, 1.0, .24); mouse.castShadow = true; d.add(mouse);
      const chair = new THREE.Group(); chair.position.set(0, 0, .85); chair.rotation.y = PI + .25; d.add(chair);
      chair.add(at(slab(.62, .6, .09, .1, M.graphite), 0, .58, 0));
      const back = rounded(.6, .72, .08, .12, M.graphite); back.position.set(0, 1.0, .3); back.rotation.x = -.08; chair.add(back);
      chair.add(at(cylinder(.03, .5, M.aluminium, 12), 0, .32, 0));
      for (let i = 0; i < 5; i++) { const leg = box(.05, .03, .36, M.aluminium); leg.rotation.y = i * TAU / 5; leg.position.set(Math.sin(i * TAU / 5) * .17, .07, Math.cos(i * TAU / 5) * .17); chair.add(leg); }
      return { group: d, screenTarget: new THREE.Vector3(x, F + 1.55, z - .2) };
    }
    const deskA = desk(-1.55, -.85, .05), deskB = desk(1.45, -.85, -.05);
    deskA.group.add(at(cylinder(.07, .16, M.orange, 20), .8, 1.07, -.25));

    // Network printer on a cabinet
    const cab = new THREE.Group(); cab.position.set(2.55, F, 1.15); cab.rotation.y = -.5; group.add(cab);
    cab.add(at(rounded(.95, .72, .7, .05, M.whiteMatte), 0, .36, 0));
    cab.add(box(.85, .01, .01, M.aluminiumDark, 0, .36, .352));
    cab.add(at(rounded(.85, .42, .66, .06, M.white), 0, .93, 0));
    cab.add(box(.6, .04, .03, M.black, 0, .9, .33));
    cab.add(box(.1, .025, .01, M.greenGlow, .3, 1.07, .332));
    const page = new THREE.Mesh(new THREE.PlaneGeometry(.42, .55), docMat); page.rotation.x = -PI / 2 + .1; page.position.set(0, .82, .52); cab.add(page);

    // Plant
    const plant = new THREE.Group(); plant.position.set(-2.75, F, 1.35); group.add(plant);
    plant.add(at(cylinder(.24, .45, M.orange, 28), 0, .225, 0));
    [[0, .75, 0, .32], [.14, .95, .06, .24], [-.12, 1.0, -.05, .22]].forEach(([x, y, z, r]) => { const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), M.sage); leaf.position.set(x, y, z); leaf.castShadow = true; plant.add(leaf); });

    // Data links from the router to each device
    const hub = new THREE.Vector3(.35, F + 1.75, -1.95);
    const printerTarget = new THREE.Vector3(2.45, F + 1.2, 1.1);
    const packets = [];
    [deskA.screenTarget, deskB.screenTarget, printerTarget].forEach((end, i) => {
      const mid = hub.clone().lerp(end, .5); mid.y += .7;
      const curve = new THREE.QuadraticBezierCurve3(hub, mid, end);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .01, 6, false), M.signal.clone()); tube.material.opacity = .35; group.add(tube);
      for (let j = 0; j < 2; j++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 10), M.orangeGlow); group.add(p); packets.push({ mesh: p, curve, offset: (i * .33 + j * .5) % 1 }); }
    });
    return {
      group, view: 4.4, target: new THREE.Vector3(0, 1.0, -.1), update(t) {
        packets.forEach(({ mesh, curve, offset }) => { const p = phase(t, 2.8, offset * 2.8); mesh.position.copy(curve.getPointAt(p)); mesh.scale.setScalar(smooth(Math.min(p / .12, (1 - p) / .12))); });
      }
    };
  }

  // Redraw once brand fonts have loaded.
  (document.fonts?.ready || Promise.resolve()).then(() => textures.forEach(t => t.redraw()));

  return { create: type => ({ laptop: workstation, router: wifi, printer: scanner, setup, transfer, consult, office }[type] || workstation)() };
}
