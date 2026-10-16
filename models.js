import * as THREE from './assets/vendor/three.module.min.js';

// Shared geometry helpers, materials and hero devices.
// All devices are built standing on y = 0 and centred on x/z.

const PI = Math.PI;

export function roundedShape(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); s.closePath();
  return s;
}
/** Rounded slab: w × h in the XY plane, d deep along Z, centred. */
export function rounded(w, h, d, r, material, bevelMax = .04) {
  const bevel = Math.max(.001, Math.min(bevelMax, d / 4, r / 2.5));
  const geo = new THREE.ExtrudeGeometry(roundedShape(w - bevel * 2, h - bevel * 2, Math.max(.001, r - bevel)), {
    depth: Math.max(.0005, d - 2 * bevel), bevelEnabled: true, bevelSegments: 4, steps: 1,
    bevelSize: bevel, bevelThickness: bevel, curveSegments: 10
  });
  geo.translate(0, 0, -(d - 2 * bevel) / 2);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
/** Rounded slab lying flat: w wide (x), depth along z, t thick (y). */
export function slab(w, depth, t, r, material, bevelMax) {
  const mesh = rounded(w, depth, t, r, material, bevelMax);
  mesh.rotation.x = -PI / 2;
  return mesh;
}
const unitBox = new THREE.BoxGeometry(1, 1, 1);
export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(unitBox, material); mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
export function cylinder(r, h, material, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

// The WeizTech mark (from the SVG logo) as three extrudable shapes.
const MARK = [
  [[5, 10], [54, 10], [138, 166], [102, 190]],
  [[87, 10], [136, 10], [218, 166], [183, 190]],
  [[207, 68], [254, 5], [306, 5], [242, 127]]
];
export function markMesh(inkMaterial, accentMaterial, width = 1, depth = .04) {
  const group = new THREE.Group(), scale = width / 312;
  MARK.forEach((points, index) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => { const px = (x - 156) * scale, py = (98 - y) * scale; i ? shape.lineTo(px, py) : shape.moveTo(px, py); });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * .3, bevelSize: depth * .25, bevelSegments: 2 });
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, index === 2 ? accentMaterial : inkMaterial); mesh.castShadow = true;
    group.add(mesh);
  });
  return group;
}
export function drawMark(ctx, x, y, width, ink = '#16181c', accent = '#ff9a1a') {
  const s = width / 312;
  MARK.forEach((points, index) => {
    ctx.beginPath();
    points.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x + px * s, y + py * s));
    ctx.closePath(); ctx.fillStyle = index === 2 ? accent : ink; ctx.fill();
  });
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Canvas-backed texture that can be redrawn once web fonts are ready. */
export function canvasTexture(renderer, width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const redraw = () => { ctx.clearRect(0, 0, width, height); draw(ctx, width, height); texture.needsUpdate = true; };
  redraw();
  return { texture, redraw };
}
export function screenMaterial(texture) {
  return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
}

const FONT_DISPLAY = 'Outfit, "Segoe UI", Arial, sans-serif';
const FONT_BODY = 'Manrope, "Segoe UI", Arial, sans-serif';
export const fonts = { display: FONT_DISPLAY, body: FONT_BODY };

export function createMaterials() {
  const M = {
    aluminium: new THREE.MeshPhysicalMaterial({ color: 0xd4d7db, metalness: 1, roughness: .34 }),
    aluminiumPolished: new THREE.MeshPhysicalMaterial({ color: 0xe8eaed, metalness: 1, roughness: .12 }),
    aluminiumDark: new THREE.MeshPhysicalMaterial({ color: 0x9fa4ab, metalness: 1, roughness: .3 }),
    spaceGray: new THREE.MeshPhysicalMaterial({ color: 0x5b5f66, metalness: 1, roughness: .4 }),
    graphite: new THREE.MeshPhysicalMaterial({ color: 0x24272c, metalness: .1, roughness: .55, clearcoat: .25, clearcoatRoughness: .5 }),
    graphiteGloss: new THREE.MeshPhysicalMaterial({ color: 0x1a1c20, metalness: .1, roughness: .2, clearcoat: 1, clearcoatRoughness: .15 }),
    keycap: new THREE.MeshStandardMaterial({ color: 0x1d1f23, roughness: .62, metalness: 0 }),
    well: new THREE.MeshStandardMaterial({ color: 0x8e939a, roughness: .45, metalness: .8 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0a0b0d, roughness: .6, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 }),
    tint: new THREE.MeshPhysicalMaterial({ color: 0x9fb4c8, metalness: 0, roughness: .08, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, metalness: 0, roughness: .42, clearcoat: .35, clearcoatRoughness: .35 }),
    whiteMatte: new THREE.MeshStandardMaterial({ color: 0xe9e9e6, metalness: 0, roughness: .7 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xfbfbf8, roughness: .92, metalness: 0 }),
    orange: new THREE.MeshPhysicalMaterial({ color: 0xff9a1a, metalness: 0, roughness: .38, clearcoat: .4, clearcoatRoughness: .3 }),
    orangeGlow: new THREE.MeshBasicMaterial({ color: 0xffa83d, toneMapped: false }),
    greenGlow: new THREE.MeshBasicMaterial({ color: 0x3ddc97, toneMapped: false }),
    green: new THREE.MeshPhysicalMaterial({ color: 0x1fae78, metalness: 0, roughness: .4, clearcoat: .3 }),
    sage: new THREE.MeshStandardMaterial({ color: 0x9cc3a0, roughness: .75, metalness: 0 }),
    slate: new THREE.MeshStandardMaterial({ color: 0x7d8ca1, roughness: .5, metalness: .1 }),
    road: new THREE.MeshStandardMaterial({ color: 0xd6d6d2, roughness: .85, metalness: 0 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0xf2f1ed, roughness: .85, metalness: 0 }),
    plinthEdge: new THREE.MeshStandardMaterial({ color: 0xe4e3de, roughness: .8, metalness: 0 }),
    signal: new THREE.MeshBasicMaterial({ color: 0xff9a1a, transparent: true, opacity: .8, depthWrite: false, toneMapped: false }),
    shadow: new THREE.ShadowMaterial({ color: 0x1b1a17, opacity: .18 })
  };
  M.setTheme = dark => {
    M.plinth.color.set(dark ? 0x202226 : 0xf2f1ed);
    M.plinthEdge.color.set(dark ? 0x2a2d32 : 0xe4e3de);
    M.road.color.set(dark ? 0x3a3d43 : 0xd6d6d2);
    M.shadow.opacity = dark ? .5 : .18;
    M.shadow.color.set(dark ? 0x000000 : 0x1b1a17);
    M.sage.color.set(dark ? 0x6f9a76 : 0x9cc3a0);
  };
  return M;
}

export function createDevices(renderer, M, onReady = () => {}) {
  const textures = [];

  /* ---------- Laptop ---------- */
  const laptopScreen = canvasTexture(renderer, 1600, 1000, (ctx, W, H) => {
    // Wallpaper
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#20232a'); bg.addColorStop(1, '#2d323b');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * .82, H * .95, 0, W * .82, H * .95, W * .6);
    glow.addColorStop(0, 'rgba(255,154,26,.55)'); glow.addColorStop(1, 'rgba(255,154,26,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const glow2 = ctx.createRadialGradient(W * .1, 0, 0, W * .1, 0, W * .5);
    glow2.addColorStop(0, 'rgba(120,160,220,.25)'); glow2.addColorStop(1, 'rgba(120,160,220,0)');
    ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);
    // Menu bar
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, W, 44);
    drawMark(ctx, 26, 11, 36, '#ffffff', '#ff9a1a');
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `600 20px ${FONT_BODY}`; ctx.textBaseline = 'middle';
    ctx.fillText('WeizTech', 76, 23);
    ctx.textAlign = 'right'; ctx.fillText('Di 10:24', W - 28, 23); ctx.textAlign = 'left';
    // Window
    const wx = 250, wy = 130, ww = 1100, wh = 650;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
    roundRect(ctx, wx, wy, ww, wh, 28); ctx.fillStyle = '#fbfbfa'; ctx.fill(); ctx.restore();
    ctx.save(); roundRect(ctx, wx, wy, ww, wh, 28); ctx.clip();
    ctx.fillStyle = '#f1f1ef'; ctx.fillRect(wx, wy, ww, 64);
    ctx.fillStyle = '#e4e4e0'; ctx.fillRect(wx, wy + 64, ww, 2);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.beginPath(); ctx.arc(wx + 36 + i * 30, wy + 32, 9, 0, PI * 2); ctx.fillStyle = c; ctx.fill(); });
    ctx.fillStyle = '#6b7079'; ctx.font = `600 22px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.fillText('Systemcheck', wx + ww / 2, wy + 33); ctx.textAlign = 'left';
    // Sidebar
    ctx.fillStyle = '#f6f6f4'; ctx.fillRect(wx, wy + 66, 260, wh - 66);
    ctx.fillStyle = '#e4e4e0'; ctx.fillRect(wx + 260, wy + 66, 2, wh - 66);
    ['Übersicht', 'Computer', 'WLAN', 'Drucker', 'Sicherung'].forEach((label, i) => {
      if (i === 0) { roundRect(ctx, wx + 18, wy + 92 + i * 58, 224, 46, 12); ctx.fillStyle = '#ffe9cc'; ctx.fill(); }
      ctx.fillStyle = i === 0 ? '#a8500a' : '#4b5059'; ctx.font = `${i === 0 ? 700 : 600} 22px ${FONT_BODY}`;
      ctx.fillText(label, wx + 42, wy + 116 + i * 58);
    });
    // Main content
    const cx = wx + 310;
    ctx.beginPath(); ctx.arc(cx + 46, wy + 158, 46, 0, PI * 2); ctx.fillStyle = '#dff5ea'; ctx.fill();
    ctx.strokeStyle = '#11805b'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 25, wy + 160); ctx.lineTo(cx + 40, wy + 175); ctx.lineTo(cx + 68, wy + 142); ctx.stroke();
    ctx.fillStyle = '#121418'; ctx.font = `600 64px ${FONT_DISPLAY}`; ctx.fillText('Alles läuft.', cx + 120, wy + 150);
    ctx.fillStyle = '#5f6570'; ctx.font = `500 25px ${FONT_BODY}`; ctx.fillText('Ihr System wurde geprüft und optimiert.', cx + 122, wy + 198);
    const rows = [['Updates', 'Aktuell'], ['WLAN', 'Verbunden · 5 GHz'], ['Drucker', 'Bereit'], ['Datensicherung', 'Heute, 09:12']];
    rows.forEach(([label, value], i) => {
      const ry = wy + 262 + i * 86;
      roundRect(ctx, cx, ry, 730, 70, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#e7e6e2'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 36, ry + 35, 9, 0, PI * 2); ctx.fillStyle = '#1fae78'; ctx.fill();
      ctx.fillStyle = '#121418'; ctx.font = `700 25px ${FONT_BODY}`; ctx.fillText(label, cx + 62, ry + 36);
      ctx.fillStyle = '#5f6570'; ctx.font = `500 23px ${FONT_BODY}`; ctx.textAlign = 'right'; ctx.fillText(value, cx + 706, ry + 36); ctx.textAlign = 'left';
    });
    ctx.restore();
    // Dock
    roundRect(ctx, W / 2 - 230, H - 96, 460, 74, 24); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
    ['#ff9a1a', '#3b82f6', '#22c55e', '#e5e7eb', '#a855f7'].forEach((c, i) => { roundRect(ctx, W / 2 - 202 + i * 84, H - 84, 54, 50, 14); ctx.fillStyle = c; ctx.fill(); });
  });
  textures.push(laptopScreen);

  const laptop = new THREE.Group(); laptop.name = 'laptop';
  {
    const W = 4.4, D = 3.0, T = .13;
    const base = slab(W, D, T, .18, M.aluminium); base.position.y = T / 2; laptop.add(base);
    const well = slab(3.98, 1.5, .014, .07, M.well, .004); well.position.set(0, T, -.47); laptop.add(well);
    // Keyboard: four full rows, a function row and a row with a spacebar.
    const keyGeo = new THREE.BoxGeometry(1, 1, 1);
    const keys = new THREE.InstancedMesh(keyGeo, M.keycap, 90); keys.castShadow = true; keys.receiveShadow = true;
    const o = new THREE.Object3D(); let k = 0; const pitch = .285, cols = 13, x0 = -((cols - 1) * pitch) / 2;
    const put = (x, z, w, d) => { o.position.set(x, T + .024, z); o.scale.set(w, .028, d); o.updateMatrix(); keys.setMatrixAt(k++, o.matrix); };
    for (let c = 0; c < cols; c++) put(x0 + c * pitch, -1.08, .25, .14);
    for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++) put(x0 + c * pitch, -.86 + r * .27, .25, .235);
    for (let c = 0; c < cols; c++) { if (c >= 4 && c <= 8) continue; put(x0 + c * pitch, .22, .25, .235); }
    put(0, .22, pitch * 5 - .035, .235);
    keys.count = k; laptop.add(keys);
    const pad = slab(1.62, 1.0, .01, .09, M.aluminiumPolished, .003); pad.position.set(0, T + .001, .9); laptop.add(pad);
    laptop.add(box(.56, .03, .05, M.aluminiumDark, 0, T - .012, D / 2 - .01));
    const hinge = cylinder(.068, 3.5, M.spaceGray); hinge.rotation.z = PI / 2; hinge.position.set(0, T + .01, -1.43); laptop.add(hinge);
    const lid = new THREE.Group(); lid.name = 'lid'; lid.position.set(0, T + .02, -1.45); lid.userData.open = -.3; lid.rotation.x = -.3;
    const shell = rounded(W, 2.9, .08, .18, M.aluminium); shell.position.set(0, 1.45, -.04); lid.add(shell);
    const bezel = rounded(W - .08, 2.82, .01, .15, M.glass, .003); bezel.position.set(0, 1.45, .004); lid.add(bezel);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(4.08, 2.55), screenMaterial(laptopScreen.texture));
    display.name = 'display'; display.position.set(0, 1.5, .0105); lid.add(display);
    const cam = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), M.black); cam.position.set(0, 2.83, .011); lid.add(cam);
    const logo = markMesh(M.aluminiumPolished, M.orange, .9, .012); logo.position.set(0, 1.5, -.082); logo.rotation.y = PI; lid.add(logo);
    laptop.add(lid);
    for (const [x, z] of [[-1.9, -1.2], [1.9, -1.2], [-1.9, 1.25], [1.9, 1.25]]) { const foot = cylinder(.1, .02, M.black, 16); foot.position.set(x, -.005, z); laptop.add(foot); }
  }

  /* ---------- Router ---------- */
  const router = new THREE.Group(); router.name = 'router';
  {
    const body = slab(3.3, 2.0, .36, .26, M.graphite); body.position.y = .24; router.add(body);
    const top = slab(3.02, 1.72, .012, .2, M.graphiteGloss, .004); top.position.y = .425; router.add(top);
    const vents = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.black, 40);
    const o = new THREE.Object3D(); let v = 0;
    for (let i = 0; i < 20; i++) { o.position.set(-1.14 + i * .12, .433, -.25); o.scale.set(.05, .01, .92); o.updateMatrix(); vents.setMatrixAt(v++, o.matrix); }
    vents.count = v; router.add(vents);
    const mark = markMesh(M.aluminiumPolished, M.orange, .52, .01); mark.rotation.x = -PI / 2; mark.position.set(0, .438, .52); router.add(mark);
    const leds = new THREE.Group(); leds.name = 'leds'; router.add(leds);
    for (let i = 0; i < 5; i++) { const led = box(.11, .026, .01, i === 0 ? M.orangeGlow : M.greenGlow, -.56 + i * .28, .25, 1.0); led.castShadow = false; leds.add(led); }
    router.add(box(2.9, .012, .01, M.spaceGray, 0, .1, 1.0));
    for (const [x, z] of [[-1.3, -.7], [1.3, -.7], [-1.3, .7], [1.3, .7]]) { const foot = cylinder(.12, .06, M.black, 16); foot.position.set(x, .03, z); router.add(foot); }
    [[-1.3, .2], [-.44, .06], [.44, -.06], [1.3, -.2]].forEach(([x, tilt]) => {
      const pivot = new THREE.Group(); pivot.position.set(x, .3, -.98); pivot.rotation.set(-.1, 0, tilt); router.add(pivot);
      const knuckle = cylinder(.075, .3, M.graphite, 20); knuckle.rotation.z = PI / 2; pivot.add(knuckle);
      const blade = rounded(.3, 1.9, .085, .14, M.graphite); blade.position.y = 1.0; pivot.add(blade);
    });
    const waves = new THREE.Group(); waves.name = 'waves'; waves.position.set(0, 2.55, -.9); router.add(waves);
    for (let i = 0; i < 3; i++) {
      const arc = PI * .5;
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(.42 + i * .32, .035, 10, 64, arc), M.signal.clone());
      mesh.rotation.z = PI / 2 - arc / 2; mesh.position.y = -i * .05; waves.add(mesh);
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), M.orangeGlow); dot.position.y = -.22; waves.add(dot);
  }

  /* ---------- Printer ---------- */
  const panelScreen = canvasTexture(renderer, 320, 200, (ctx, W, H) => {
    ctx.fillStyle = '#0f1a14'; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(70, H / 2, 38, 0, PI * 2); ctx.fillStyle = '#1fae78'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(52, H / 2 + 2); ctx.lineTo(65, H / 2 + 15); ctx.lineTo(90, H / 2 - 14); ctx.stroke();
    ctx.fillStyle = '#e8fff4'; ctx.font = `700 40px ${FONT_BODY}`; ctx.textBaseline = 'middle'; ctx.fillText('Bereit', 128, H / 2);
  });
  const pageTexture = canvasTexture(renderer, 700, 990, (ctx, W, H) => {
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, W, H);
    drawMark(ctx, 60, 64, 80);
    ctx.fillStyle = '#16181c'; ctx.font = `650 34px ${FONT_DISPLAY}`; ctx.textBaseline = 'middle'; ctx.fillText('Weiz', 152, 96);
    ctx.fillStyle = '#e68400'; ctx.fillText('Tech', 152 + ctx.measureText('Weiz').width, 96);
    ctx.fillStyle = '#121418'; ctx.font = `600 52px ${FONT_DISPLAY}`; ctx.fillText('Alles läuft.', 60, 210);
    const img = ctx.createLinearGradient(0, 260, 0, 560); img.addColorStop(0, '#ffd9a6'); img.addColorStop(1, '#ffefd8');
    roundRect(ctx, 60, 260, W - 120, 300, 18); ctx.fillStyle = img; ctx.fill();
    ctx.save(); roundRect(ctx, 60, 260, W - 120, 300, 18); ctx.clip();
    ctx.fillStyle = '#7fb08a'; ctx.beginPath(); ctx.moveTo(60, 560); ctx.lineTo(220, 400); ctx.lineTo(330, 480); ctx.lineTo(470, 350); ctx.lineTo(W - 60, 470); ctx.lineTo(W - 60, 560); ctx.fill();
    ctx.fillStyle = '#5c8f6a'; ctx.beginPath(); ctx.moveTo(60, 560); ctx.lineTo(300, 470); ctx.lineTo(520, 520); ctx.lineTo(W - 60, 500); ctx.lineTo(W - 60, 560); ctx.fill();
    ctx.beginPath(); ctx.arc(520, 330, 34, 0, PI * 2); ctx.fillStyle = '#ff9a1a'; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#c9cbd0';
    [520, 470, 500, 380, 510, 300].forEach((w, i) => { roundRect(ctx, 60, 610 + i * 46, w, 16, 8); ctx.fill(); });
  });
  textures.push(panelScreen, pageTexture);

  const printer = new THREE.Group(); printer.name = 'printer';
  {
    const W = 3.5, D = 2.4;
    const bodyH = 1.12;
    const body = rounded(W, bodyH, D, .16, M.white); body.position.y = .12 + bodyH / 2; printer.add(body);
    const plinth = rounded(W - .08, .14, D - .08, .06, M.graphite); plinth.position.y = .08; printer.add(plinth);
    const seam = slab(W - .06, D - .06, .02, .17, M.black, .005); seam.position.y = .12 + bodyH + .005; printer.add(seam);
    const lid = slab(W, D, .14, .2, M.white); lid.position.y = .12 + bodyH + .085; printer.add(lid);
    const glassLine = box(W - .5, .006, .05, M.tint, 0, .12 + bodyH + .157, -D / 2 + .3); printer.add(glassLine);
    // Front: output slot, control panel and status light.
    const front = D / 2;
    printer.add(box(2.5, .08, .06, M.black, -.2, .62, front - .01));
    const panel = new THREE.Group(); panel.position.set(1.0, 1.06, front + .02); panel.rotation.x = -.42; printer.add(panel);
    panel.add(rounded(1.15, .44, .07, .07, M.graphite));
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(.5, .31), screenMaterial(panelScreen.texture)); ps.position.set(-.22, 0, .037); panel.add(ps);
    const power = cylinder(.055, .03, M.orangeGlow, 20); power.rotation.x = PI / 2; power.position.set(.38, 0, .04); panel.add(power);
    const btn = cylinder(.045, .025, M.aluminiumDark, 20); btn.rotation.x = PI / 2; btn.position.set(.18, 0, .04); panel.add(btn);
    const status = box(.16, .03, .01, M.greenGlow, -1.4, 1.06, front + .002); status.castShadow = false; printer.add(status);
    // Output tray.
    const tray = slab(2.5, 1.1, .035, .08, M.whiteMatte, .01); tray.position.set(-.2, .3, front + .5); tray.rotation.x = -PI / 2 + .04; printer.add(tray);
    printer.add(box(2.5, .1, .035, M.whiteMatte, -.2, .34, front + 1.04));
    // The printed page slides out of the slot.
    const pageMat = new THREE.MeshStandardMaterial({ map: pageTexture.texture, roughness: .9 });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.12), pageMat); sheet.name = 'sheet'; sheet.castShadow = true; sheet.receiveShadow = true;
    sheet.rotation.x = -PI / 2 + .04; sheet.userData.y0 = .64; sheet.userData.zIn = front - 1.0; sheet.userData.zOut = front + .45;
    sheet.position.set(-.2, .64, sheet.userData.zIn); printer.add(sheet);
    // Rear paper feeder.
    const feeder = new THREE.Group(); feeder.name = 'paper-feed'; feeder.position.set(-.2, .12 + bodyH + .1, -D / 2 + .25); feeder.rotation.x = -.42; printer.add(feeder);
    feeder.add(box(2.3, 1.15, .04, M.whiteMatte, 0, .5, -.03));
    for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), M.paper); p.position.set(0, .5, .005 + i * .006); p.castShadow = true; feeder.add(p); }
  }

  // Redraw canvas art once the brand fonts are available.
  (document.fonts?.ready || Promise.resolve()).then(() => Promise.all([
    document.fonts?.load?.(`600 64px Outfit`), document.fonts?.load?.(`600 24px Manrope`), document.fonts?.load?.(`700 24px Manrope`)
  ].filter(Boolean))).catch(() => {}).then(() => { textures.forEach(t => t.redraw()); onReady(); });

  return { laptop, router, printer };
}
