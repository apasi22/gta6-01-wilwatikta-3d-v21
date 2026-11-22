// Wilwatikta 3D — city builder (round 17, fresh).
// Bright-blue daytime coastal city: sky, road, buildings, palms, traffic.
// Written fresh from the design brief; no old file was read.
import * as THREE from 'three';

export const ROAD_LENGTH = 230;
export const ROAD_WIDTH = 14;
export const SIDEWALK = 4;

// Bright daytime palette (clean facades, vivid green, warm road furniture).
const C = {
  asphalt: 0x33363d,
  asphaltEdge: 0x2a2d33,
  sidewalk: 0x9aa0a8,
  sidewalkEdge: 0x7d838c,
  lineYellow: 0xf7c948,
  lineWhite: 0xe8ecf1,
  trunk: 0x7a5230,
  palmLeaf: 0x2fae4e,
  palmLeaf2: 0x37c25a,
  treeLeaf: 0x2e9e4f,
  treeLeaf2: 0x35b45a,
  lampPole: 0x3a4048,
  glass: 0x274b6d,
  glassHi: 0x4d7ea8,
};

function canvasTexture(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}

// --- sky -----------------------------------------------------------------
function skyDome(scene) {
  const tex = canvasTexture(4, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#1e6fd9');
    grad.addColorStop(0.35, '#3f96e8');
    grad.addColorStop(0.65, '#7ec3f2');
    grad.addColorStop(1.0, '#cfeaff');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
}

// True night sky: near-black navy dome, stars, a pale moon + glow.
function nightSky(scene) {
  const tex = canvasTexture(4, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#040917');
    grad.addColorStop(0.4, '#0a1a3a');
    grad.addColorStop(0.75, '#16294d');
    grad.addColorStop(1.0, '#2a3f66');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(320, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
  // stars: small white points on a sphere well INSIDE the sky dome (radius
  // 250 < dome 320) so the dome can never occlude them; bigger so they
  // survive the JPEG at 1280x720.
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = 0.18 + Math.random() * 1.1; // elevation above the horizon
    const r = 250;
    pts.push(
      Math.cos(a) * Math.cos(e) * r,
      Math.sin(e) * r,
      Math.sin(a) * Math.cos(e) * r
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 3.5, sizeAttenuation: false, transparent: true, opacity: 1, fog: false,
  }));
  scene.add(stars);
  // pale moon as a glowing SPHERE. Placed top-CENTER (0,45,-120): the
  // diagnostic red sphere at (0,15,-60) rendered clearly, so this central
  // sky spot is proven visible; the earlier left/right spots were occluded.
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xe8eef7, fog: false })
  );
  moon.position.set(0, 45, -120);
  scene.add(moon);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(19, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xcdd9ee, transparent: true, opacity: 0.25, fog: false, depthWrite: false })
  );
  glow.position.set(0, 45, -120);
  scene.add(glow);
}

function sunDisc(scene) {
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(14, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff6bf, fog: false })
  );
  sun.position.set(-70, 150, -190);
  sun.lookAt(0, 0, 0);
  scene.add(sun);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(26, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff9d6, transparent: true, opacity: 0.35, fog: false })
  );
  glow.position.set(-70, 150, -191);
  glow.lookAt(0, 0, 0);
  scene.add(glow);
}

function clouds(scene, night = false) {
  const mat = new THREE.MeshBasicMaterial({ color: night ? 0x2a3a55 : 0xffffff, transparent: night, opacity: night ? 0.85 : 1, fog: false });
  const spots = [
    [-38, 46, -70, 16], [24, 52, -95, 20], [58, 44, -55, 13],
    [-62, 55, -120, 18], [8, 48, -140, 22], [44, 58, -160, 15],
    [-18, 60, -60, 11], [72, 50, -110, 14], [-48, 42, -30, 12],
  ];
  for (const [x, y, z, s] of spots) {
    const puff = new THREE.Group();
    const n = 3 + (Math.abs(x) % 3);
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(s * (0.45 + 0.2 * i), 12, 8), mat);
      b.position.set((i - n / 2) * s * 0.55, (i % 2) * s * 0.12, 0);
      b.scale.y = 0.38;
      puff.add(b);
    }
    puff.position.set(x, y, z);
    scene.add(puff);
  }
}

// --- ground ----------------------------------------------------------------
function road(scene) {
  const mat = new THREE.MeshLambertMaterial({ color: C.asphalt });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH), mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -60);
  scene.add(ground);
  // yellow double centre line
  const lineMat = new THREE.MeshBasicMaterial({ color: C.lineYellow });
  for (const dx of [-0.35, 0.35]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.28, ROAD_LENGTH), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(dx, 0.02, -60);
    scene.add(line);
  }
  // white lane dashes
  const dashMat = new THREE.MeshBasicMaterial({ color: C.lineWhite });
  for (const dx of [-4.2, 4.2]) {
    for (let z = -165; z < 45; z += 9) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.4), dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(dx, 0.02, z);
      scene.add(d);
    }
  }
  // sidewalks
  const walkMat = new THREE.MeshLambertMaterial({ color: C.sidewalk });
  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(SIDEWALK, ROAD_LENGTH), walkMat);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(side * (ROAD_WIDTH / 2 + SIDEWALK / 2), 0.06, -60);
    scene.add(walk);
    const kerb = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.22, ROAD_LENGTH),
      new THREE.MeshLambertMaterial({ color: C.sidewalkEdge })
    );
    kerb.position.set(side * (ROAD_WIDTH / 2 + 0.15), 0.11, -60);
    scene.add(kerb);
  }
}

// --- buildings -------------------------------------------------------------
const FACADE_COLORS = [
  '#f4efe4', '#fbf7ee', '#ffe9c4', '#ffd9a0', '#f7d9c8',
  '#e8f1f6', '#d9ecf7', '#fff3d6', '#f2e3d5', '#e6f0e2',
];
const ROOF_COLORS = [0x8a6f5c, 0x6b7a89, 0x9a8a76, 0x7a6a58, 0x5f7080];

function facadeTexture(base, floors, cols, night = false) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // subtle top light
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(0, 0, w, 14);
    // ground-floor shop band
    g.fillStyle = 'rgba(0,0,0,0.10)';
    g.fillRect(0, h - 42, w, 42);
    // windows: bright blue glass with a shine (day) — warm lit windows at night
    const ww = 20, wh = 26, gx = (w - cols * ww) / (cols + 1);
    const gy = 26;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const x = gx + c * (ww + gx);
        const y = gy + f * ((h - 70 - gy) / Math.max(1, floors - 1 || 1));
        const lit = night && ((f * 7 + c * 3) % 3 === 0); // ~1 in 3 windows lit warm
        g.fillStyle = lit ? '#ffca5a' : (night ? '#1a2a3a' : '#274b6d');
        g.fillRect(x, y, ww, wh);
        g.fillStyle = lit ? '#ffe9a8' : '#6fa8d8';
        g.fillRect(x + 3, y + 3, ww - 6, 7);
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.fillRect(x + 2, y + 2, 4, wh - 4);
      }
    }
  });
}

function building(scene, x, z, w, h, d, color, floors, night = false) {
  const group = new THREE.Group();
  const tex = facadeTexture(color, floors, 3, night);
  const side = new THREE.MeshLambertMaterial({ map: tex });
  const roof = new THREE.MeshLambertMaterial({ color: ROOF_COLORS[Math.abs(Math.floor(x + z)) % ROOF_COLORS.length] });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, roof, roof, side, side]);
  box.position.y = h / 2;
  group.add(box);
  // parapet cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.35, d + 0.4), roof);
  cap.position.y = h + 0.17;
  group.add(cap);
  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function buildings(scene, night = false) {
  const spots = [];
  for (let z = -100; z <= 42; z += 15) {
    spots.push([-13.5 - (Math.abs(z) % 3), z, 9 + (Math.abs(z * 7) % 4)]);
    spots.push([13.5 + (Math.abs(z * 5) % 3), z + 7, 9 + (Math.abs(z * 3) % 4)]);
  }
  spots.forEach(([x, z, w], i) => {
    const floors = 2 + (i % 3); // 2–4 floors
    const h = floors * 3.4 + 0.6;
    const color = FACADE_COLORS[i % FACADE_COLORS.length];
    building(scene, x, z, w, h, 9, color, floors, night);
  });
}

// --- palms & trees -----------------------------------------------------------
function palm(scene, x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 4.6 * s, 8),
    new THREE.MeshLambertMaterial({ color: C.trunk })
  );
  trunk.position.y = 2.3 * s;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: C.palmLeaf });
  const leafMat2 = new THREE.MeshLambertMaterial({ color: C.palmLeaf2 });
  const n = 7;
  for (let i = 0; i < n; i++) {
    const holder = new THREE.Group();
    holder.position.y = 4.6 * s;
    holder.rotation.y = (i / n) * Math.PI * 2 + (i % 2) * 0.25;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(2.3 * s, 0.09 * s, 0.55 * s), i % 2 ? leafMat : leafMat2);
    frond.position.x = 1.1 * s;
    frond.rotation.z = -0.85; // steep droop down, not a flat propeller
    holder.add(frond);
    // second drooping tip
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.1 * s, 0.07 * s, 0.4 * s), i % 2 ? leafMat2 : leafMat);
    tip.position.set(2.4 * s, -0.55 * s, 0);
    tip.rotation.z = -1.05;
    holder.add(tip);
    g.add(holder);
  }
  // coconut cluster
  const nuts = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 8, 6), new THREE.MeshLambertMaterial({ color: 0x8a6d3b }));
  nuts.position.y = 4.4 * s;
  g.add(nuts);
  g.position.set(x, 0, z);
  scene.add(g);
}

function palms(scene) {
  const spots = [
    [-9.6, -8], [9.6, -18], [-9.6, -30], [9.6, -42], [-9.6, -55],
    [9.6, -66], [-9.6, -78], [9.6, -90], [-9.6, -102], [9.6, -112], [-9.6, 8],
  ];
  spots.forEach(([x, z], i) => palm(scene, x, z, 0.95 + (i % 3) * 0.12));
}

function roundTree(scene, x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 1.6 * s, 8),
    new THREE.MeshLambertMaterial({ color: C.trunk })
  );
  trunk.position.y = 0.8 * s;
  g.add(trunk);
  const leaf = new THREE.MeshLambertMaterial({ color: C.treeLeaf });
  const leaf2 = new THREE.MeshLambertMaterial({ color: C.treeLeaf2 });
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.25 * s, 12, 9), leaf);
  c1.position.y = 2.3 * s;
  c1.scale.y = 0.85;
  g.add(c1);
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.85 * s, 10, 8), leaf2);
  c2.position.set(0.55 * s, 2.9 * s, 0.2 * s);
  g.add(c2);
  g.position.set(x, 0, z);
  scene.add(g);
}

function trees(scene) {
  const spots = [[-9.8, -22], [9.8, -34], [-9.8, -48], [9.8, -58], [-9.8, -70], [9.8, -84], [-9.8, -96], [9.8, -6], [-9.8, 16], [9.8, 26]];
  spots.forEach(([x, z], i) => roundTree(scene, x, z, 0.9 + (i % 3) * 0.15));
}

// --- lamps & signs -----------------------------------------------------------
function lamps(scene, night = false) {
  const poleMat = new THREE.MeshLambertMaterial({ color: C.lampPole });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.3, depthWrite: false });
  const poolMat = new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.16, depthWrite: false });
  for (const [x, z] of [[-8.6, -14], [8.6, -26], [-8.6, -38], [8.6, -52], [-8.6, -64], [8.6, -76], [-8.6, -88], [8.6, -100]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 8), poleMat);
    pole.position.set(x, 2.2, z);
    scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), poleMat);
    arm.position.set(x + (x < 0 ? 0.5 : -0.5), 4.35, z);
    scene.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.24), lampMat);
    head.position.set(x + (x < 0 ? 1.0 : -1.0), 4.3, z);
    scene.add(head);
    if (night) {
      // glowing halo around the lamp head + warm light pool on the road
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), glowMat);
      halo.position.set(x + (x < 0 ? 1.0 : -1.0), 4.3, z);
      scene.add(halo);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.7, 20), poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x + (x < 0 ? 1.0 : -1.0), 0.04, z);
      scene.add(pool);
    }
  }
}

function signBoard(scene, text, sub, x, y, z, ry, w = 4.4) {
  const tex = canvasTexture(512, 128, (g, cw, ch) => {
    g.fillStyle = '#7a4a12';
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#ffd23e';
    g.fillRect(0, 0, cw, 10);
    g.fillRect(0, ch - 10, cw, 10);
    g.fillStyle = '#fff6d8';
    g.font = 'bold 52px sans-serif';
    g.textAlign = 'center';
    g.fillText(text, cw / 2, 62);
    g.font = '28px sans-serif';
    g.fillStyle = '#ffe9a8';
    g.fillText(sub, cw / 2, 102);
  });
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(w, w * 0.25),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.position.set(x, y, z);
  board.rotation.y = ry;
  scene.add(board);
}

function signs(scene) {
  signBoard(scene, 'KOPI WILWATIKTA', 'kopi tubruk · sejak 1998', -10.6, 4.6, -20, Math.PI / 2);
  signBoard(scene, 'BENGKEL BAMBANG', 'ban · rem · tune-up', 10.6, 4.2, -48, -Math.PI / 2);
  signBoard(scene, 'PASAR SENJA', 'oleh-oleh · batik', -10.6, 4.4, -72, Math.PI / 2, 4.0);
}

// --- vehicles on the street --------------------------------------------------
// Simple blocky street car (top-2 style: low, wide, dark glass band).
export function simpleCar(color, opts = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.52, 4.1),
    new THREE.MeshLambertMaterial({ color })
  );
  body.position.y = 0.46;
  g.add(body);
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 0.2, 4.14),
    new THREE.MeshLambertMaterial({ color: 0x1c1f24 })
  );
  skirt.position.y = 0.2;
  g.add(skirt);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.66, 0.44, 2.1),
    new THREE.MeshLambertMaterial({ color: 0x181d24 })
  );
  cabin.position.set(0, 0.92, 0.25);
  g.add(cabin);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 0.08, 2.0),
    new THREE.MeshLambertMaterial({ color })
  );
  roof.position.set(0, 1.16, 0.25);
  g.add(roof);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  for (const dx of [-0.62, 0.62]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), lightMat);
    head.position.set(dx, 0.5, -2.06);
    g.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), tailMat);
    tail.position.set(dx, 0.5, 2.06);
    g.add(tail);
  }
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const hubMat = new THREE.MeshBasicMaterial({ color: 0xb9c2cc });
  for (const [dx, dz] of [[-0.95, -1.35], [0.95, -1.35], [-0.95, 1.35], [0.95, 1.35]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(dx, 0.34, dz);
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 10), hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(dx, 0.34, dz);
    g.add(hub);
  }
  if (opts.police) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 0.14, 4.12),
      new THREE.MeshBasicMaterial({ color: 0x2456e0 })
    );
    stripe.position.y = 0.62;
    g.add(stripe);
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.3), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    barBase.position.set(0, 1.26, 0.25);
    g.add(barBase);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.28), new THREE.MeshBasicMaterial({ color: 0xff2020 }));
    red.position.set(-0.26, 1.34, 0.25);
    g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.28), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    blue.position.set(0.26, 1.34, 0.25);
    g.add(blue);
  }
  return g;
}

function parkedCars(scene) {
  const colors = [0x2f7fe0, 0xf7c948, 0x37b24d, 0xdfe3e8, 0xe86ba8, 0xe86a1a, 0x37c2b2];
  const spots = [
    [-9.4, -12, 0.06], [9.4, -24, -0.05], [-9.4, -36, 0.04], [9.4, -58, -0.07],
    [-9.4, -68, 0.05], [9.4, -80, -0.04], [-9.4, -94, 0.06], [9.4, -108, -0.05],
  ];
  spots.forEach(([x, z, ry], i) => {
    const car = simpleCar(colors[i % colors.length]);
    car.position.set(x, 0, z);
    car.rotation.y = (x < 0 ? Math.PI : 0) + ry;
    scene.add(car);
  });
}

function policeCar(scene) {
  const car = simpleCar(0xf2f4f6, { police: true });
  car.position.set(5.4, 0, -30);
  car.rotation.y = Math.PI + 0.08;
  scene.add(car);
  const car2 = simpleCar(0xf2f4f6, { police: true });
  car2.position.set(-5.2, 0, -58);
  car2.rotation.y = -0.06;
  scene.add(car2);
}

function traffic(scene) {
  const cars = [];
  const defs = [
    [0x2f7fe0, -2.4, -16, 0], [0xf7c948, 2.6, -30, 0], [0xe86ba8, -2.2, -44, 0],
    [0xdfe3e8, 2.4, -58, 0], [0x37b24d, -2.6, -72, 0], [0xe86a1a, 2.2, -88, 0],
  ];
  for (const [color, x, z, ry] of defs) {
    const car = simpleCar(color);
    car.position.set(x, 0, z);
    car.rotation.y = ry;
    scene.add(car);
    cars.push(car);
  }
  return cars;
}

// --- build -------------------------------------------------------------------
export function buildCity(scene, opts = {}) {
  const night = !!opts.night;
  if (night) nightSky(scene);
  else {
    skyDome(scene);
    sunDisc(scene);
  }
  clouds(scene, night);
  road(scene);
  buildings(scene, night);
  palms(scene);
  trees(scene);
  lamps(scene, night);
  signs(scene);
  parkedCars(scene);
  policeCar(scene);
  const trafficCars = traffic(scene);
  return { traffic: trafficCars };
}
