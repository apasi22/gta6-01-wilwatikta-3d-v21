// Wilwatikta 3D — the city: bright blue daytime coast, clean facades, palms.
// A fresh build of the street the game plays on: sky, road, buildings, palms,
// lamps, parked cars and the WPD police car. Three.js r160, ES module.
import * as THREE from 'three';

// ------------------------------------------------------------------ helpers

/** A box mesh with a flat Lambert material, placed and added to a parent. */
function box(parent, w, h, d, color, x, y, z, ry = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}

/** A cylinder mesh (trunks, poles, wheels), placed and added to a parent. */
function cyl(parent, rTop, rBottom, h, color, x, y, z, seg = 10) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, seg),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** A sphere mesh (canopies, coconuts), placed and added to a parent. */
function ball(parent, r, color, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 12, 10),
    new THREE.MeshLambertMaterial({ color })
  );
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}

/** A canvas texture with text on it, for shop signs. */
function signTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = fg;
  g.font = 'bold 64px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ------------------------------------------------------------------ sky

/** Bright blue daytime sky: gradient background, high sun, white clouds. */
export function buildSky(scene) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#1e6fd9');
  grad.addColorStop(0.38, '#3f96e8');
  grad.addColorStop(0.72, '#7ec3f2');
  grad.addColorStop(1.0, '#cfeaff');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 512);
  const sky = new THREE.CanvasTexture(c);
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;

  // High sun: a pale disc with a soft halo, upper right of the frame.
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 32),
    new THREE.MeshBasicMaterial({ color: 0xfffbe8, fog: false })
  );
  sun.position.set(20, 30, -48);
  sun.lookAt(0, 3, 12);
  scene.add(sun);
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(5.2, 32),
    new THREE.MeshBasicMaterial({ color: 0xfffbe8, transparent: true, opacity: 0.28, fog: false })
  );
  halo.position.set(20, 30, -48.2);
  halo.lookAt(0, 3, 12);
  scene.add(halo);

  // White clouds: flattened puffs drifting high over the boulevard.
  const cloudSpots = [
    [-16, 22, -38, 3.2], [6, 24, -44, 4.0], [18, 21, -30, 2.6],
    [-8, 25, -18, 3.6], [14, 23, -52, 3.0], [-22, 20, -12, 2.4],
  ];
  for (const [x, y, z, s] of cloudSpots) {
    const cloud = new THREE.Group();
    ball(cloud, 1.0 * s, 0xffffff, 0, 0, 0, 1.6, 0.55, 1.0);
    ball(cloud, 0.7 * s, 0xffffff, -1.1 * s, -0.15 * s, 0, 1.2, 0.5, 0.9);
    ball(cloud, 0.75 * s, 0xffffff, 1.1 * s, -0.1 * s, 0, 1.3, 0.5, 0.9);
    cloud.position.set(x, y, z);
    // Clouds stay paper-white: unlit, so the sun never greys them.
    cloud.traverse((m) => {
      if (m.isMesh) m.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    });
    scene.add(cloud);
  }
}

// ------------------------------------------------------------------ street

/** The boulevard: asphalt, sidewalks, curbs, crosswalks and lane dashes. */
function buildStreet(scene) {
  // Ground base: pale green that frames the road.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 110),
    new THREE.MeshLambertMaterial({ color: 0x9fc98a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, -25);
  scene.add(ground);

  // Asphalt road, running away from the camera down -Z.
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 95),
    new THREE.MeshLambertMaterial({ color: 0x3a3f4a })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -28);
  scene.add(road);

  // Sidewalks, bright pale concrete on both sides of the road.
  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 95),
      new THREE.MeshLambertMaterial({ color: 0xcfd4da })
    );
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(side * 6.7, 0.06, -28);
    scene.add(walk);
    // Curb edge.
    box(scene, 0.18, 0.14, 95, 0x9aa0a8, side * 5.05, 0.07, -28);
  }

  // Yellow centre dashes.
  for (let z = 14; z > -70; z -= 3.4) {
    box(scene, 0.28, 0.02, 1.5, 0xffd23f, 0, 0.02, z);
  }
  // White edge lines.
  for (const side of [-1, 1]) {
    box(scene, 0.16, 0.02, 95, 0xf2f5f7, side * 4.7, 0.02, -28);
  }

  // Crosswalks: broad white stripes across the road.
  for (const cz of [3.5, -22]) {
    for (let x = -4.4; x <= 4.4; x += 1.25) {
      box(scene, 0.7, 0.02, 1.1, 0xf2f5f7, x, 0.02, cz);
    }
  }
}

/** One building: bright clean facade, blue-glass windows, roof slab, awning. */
function building(scene, x, z, w, floors, facade, sign) {
  const h = floors * 1.9 + 0.4;
  const g = new THREE.Group();
  box(g, w, h, 5.5, facade, 0, h / 2, 0);
  // Roof slab, slightly wider, darker.
  box(g, w + 0.3, 0.22, 5.9, 0x6b7280, 0, h + 0.1, 0);
  // Blue-glass windows on the street face.
  const face = x < 0 ? 1 : -1; // which side looks at the road
  const winColor = 0x3f96e8;
  for (let f = 0; f < floors; f++) {
    const wy = 1.1 + f * 1.9;
    const count = Math.max(2, Math.floor(w / 2.2));
    for (let i = 0; i < count; i++) {
      const wx = -w / 2 + 1.1 + (i * (w - 2.2)) / Math.max(1, count - 1);
      const win = box(g, 0.95, 1.15, 0.08, winColor, wx, wy, face * 2.78);
      win.material = new THREE.MeshLambertMaterial({ color: winColor, emissive: 0x1e6fd9, emissiveIntensity: 0.25 });
    }
  }
  // Shop sign above the ground floor, when given.
  if (sign) {
    const tex = signTexture(sign.text, sign.bg, sign.fg);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 0.9),
      new THREE.MeshLambertMaterial({ map: tex })
    );
    board.position.set(0, 2.6, face * 2.82);
    board.rotation.y = face > 0 ? 0 : Math.PI;
    g.add(board);
  }
  // Awning stripe over the shopfront.
  box(g, w * 0.7, 0.12, 0.9, 0xe8501a, 0, 2.1, face * 2.9);
  g.position.set(x, 0, z);
  scene.add(g);
}

/** Rows of 2-4 storey buildings lining both sides of the boulevard. */
function buildBuildings(scene) {
  const facades = [0xffffff, 0xfff3d6, 0xffd9a0, 0xe8f4ff, 0xffe1c2, 0xf6f1e7];
  const signs = [
    { text: 'KOPI WILWATIKTA', bg: '#1e6fd9', fg: '#ffffff' },
    { text: 'BENGKEL BAMBANG', bg: '#e8501a', fg: '#ffffff' },
    { text: 'PASAR SENJA', bg: '#2fbf4a', fg: '#ffffff' },
    { text: 'BATIK LARAS', bg: '#7c4dff', fg: '#ffffff' },
  ];
  let s = 0;
  for (let z = 12; z > -62; z -= 9.5) {
    const floorsL = 2 + ((Math.abs(z) / 9.5 | 0) % 3);
    const floorsR = 2 + ((Math.abs(z + 4) / 9.5 | 0) % 3);
    building(scene, -11.5, z, 7.5, floorsL, facades[(s * 2) % facades.length], s % 3 === 0 ? signs[s % signs.length] : null);
    building(scene, 11.5, z - 4, 7.0, floorsR, facades[(s * 2 + 1) % facades.length], s % 4 === 1 ? signs[(s + 1) % signs.length] : null);
    s++;
  }
}

/** One coastal palm: leaning trunk, vivid fronds, coconuts. */
function palm(scene, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = cyl(g, 0.09, 0.15, 3.4, 0x8a6a3f, 0, 1.7, 0);
  trunk.rotation.z = 0.08;
  const frondGreen = [0x2fbf4a, 0x27a844, 0x37d65e];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const frond = box(g, 1.6, 0.05, 0.42, frondGreen[i % 3], 0, 3.45, 0);
    frond.position.x = Math.cos(a) * 0.72;
    frond.position.z = Math.sin(a) * 0.72;
    frond.rotation.y = -a;
    frond.rotation.z = 0.85;
    g.add(frond);
  }
  ball(g, 0.14, 0x6b4a1f, 0.2, 3.3, 0.1);
  ball(g, 0.14, 0x6b4a1f, -0.18, 3.28, -0.08);
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  scene.add(g);
}

/** One round street tree: trunk and two green canopy balls. */
function tree(scene, x, z) {
  const g = new THREE.Group();
  cyl(g, 0.11, 0.14, 1.4, 0x7a5a34, 0, 0.7, 0);
  ball(g, 1.05, 0x3fae5a, 0, 1.9, 0, 1.15, 0.9, 1.15);
  ball(g, 0.7, 0x57c96b, 0.6, 2.3, 0.2, 1, 0.8, 1);
  g.position.set(x, 0, z);
  scene.add(g);
}

/** One street lamp, dim in the daytime sun. */
function lamp(scene, x, z) {
  const g = new THREE.Group();
  cyl(g, 0.06, 0.08, 3.6, 0x4a4f57, 0, 1.8, 0);
  box(g, 1.1, 0.08, 0.08, 0x4a4f57, x < 0 ? 0.5 : -0.5, 3.55, 0);
  box(g, 0.42, 0.12, 0.22, 0x8a8f96, x < 0 ? 0.95 : -0.95, 3.5, 0);
  g.position.set(x, 0, z);
  scene.add(g);
}

/** The green edges of the boulevard: 11 palms and trees, lamps between them. */
function buildGreenery(scene) {
  const palmSpots = [
    [-6.6, 8, 1.0], [6.6, -2, 1.1], [-6.6, -10, 0.9], [6.6, -14, 1.0],
    [-6.6, -24, 1.05], [6.6, -28, 0.95], [-6.6, -36, 1.1], [6.6, -40, 1.0],
    [-6.6, -48, 0.9], [6.6, -52, 1.05], [-6.6, -58, 1.0],
  ];
  for (const [x, z, s] of palmSpots) palm(scene, x, z, s);
  tree(scene, -6.6, -4);
  tree(scene, 6.6, -8);
  tree(scene, -6.6, -18);
  tree(scene, 6.6, -34);
  tree(scene, -6.6, -44);
  tree(scene, 6.6, -56);
  lamp(scene, -5.4, 6);
  lamp(scene, 5.4, -6);
  lamp(scene, -5.4, -20);
  lamp(scene, 5.4, -32);
  lamp(scene, -5.4, -46);
  lamp(scene, 5.4, -58);
}

// ------------------------------------------------------------------ vehicles

/** A simple parked car: body, cabin, wheels, bumpers, in a vivid colour. */
function parkedCar(scene, x, z, color, ry) {
  const g = new THREE.Group();
  box(g, 1.8, 0.55, 3.6, color, 0, 0.5, 0);
  box(g, 1.55, 0.5, 1.9, 0x7ec3f2, 0, 1.0, 0.1);
  box(g, 1.82, 0.1, 3.65, 0x222222, 0, 0.26, 0);
  for (const [wx, wz] of [[-0.85, 1.15], [0.85, 1.15], [-0.85, -1.15], [0.85, -1.15]]) {
    const wheel = cyl(g, 0.34, 0.34, 0.22, 0x1a1a1a, wx, 0.34, wz, 12);
    wheel.rotation.z = Math.PI / 2;
  }
  box(g, 0.4, 0.14, 0.06, 0xfff6c0, -0.55, 0.55, -1.82);
  box(g, 0.4, 0.14, 0.06, 0xfff6c0, 0.55, 0.55, -1.82);
  box(g, 0.4, 0.14, 0.06, 0xff2a1a, -0.55, 0.55, 1.82);
  box(g, 0.4, 0.14, 0.06, 0xff2a1a, 0.55, 0.55, 1.82);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
}

/** Parked cars in vivid colours along both curbs. */
export function buildParkedCars(scene) {
  const spots = [
    [-3.6, -6, 0x2f7fe0, 0], [3.6, -12, 0xffd23f, Math.PI],
    [-3.6, -18, 0x2fbf4a, 0], [3.6, -26, 0xe8ecf0, Math.PI],
    [-3.6, -32, 0xff7fb0, 0], [3.6, -38, 0xff7a1a, Math.PI],
    [-3.6, -44, 0x2f7fe0, 0], [3.6, -50, 0xffd23f, Math.PI],
  ];
  for (const [x, z, color, ry] of spots) parkedCar(scene, x, z, color, ry);
}

/** The WPD police car: white body, vivid blue stripe, red/blue light bar. */
export function buildPoliceCar(scene, x = 3.4, z = -24) {
  const g = new THREE.Group();
  box(g, 1.9, 0.55, 3.8, 0xf2f5f7, 0, 0.52, 0);
  box(g, 1.65, 0.5, 2.0, 0x7ec3f2, 0, 1.02, 0.1);
  // Vivid blue stripe along both flanks and the hood.
  box(g, 0.06, 0.16, 3.7, 0x2f7fe0, -0.96, 0.55, 0);
  box(g, 0.06, 0.16, 3.7, 0x2f7fe0, 0.96, 0.55, 0);
  box(g, 1.9, 0.06, 0.5, 0x2f7fe0, 0, 0.82, -1.7);
  // Light bar on the roof: red left, blue right, glowing.
  const redBar = box(g, 0.55, 0.16, 0.3, 0xff2a1a, -0.35, 1.32, 0.1);
  redBar.material = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  const blueBar = box(g, 0.55, 0.16, 0.3, 0x2f7fe0, 0.35, 1.32, 0.1);
  blueBar.material = new THREE.MeshBasicMaterial({ color: 0x2f7fe0 });
  box(g, 1.3, 0.08, 0.34, 0x222222, 0, 1.24, 0.1);
  for (const [wx, wz] of [[-0.88, 1.2], [0.88, 1.2], [-0.88, -1.2], [0.88, -1.2]]) {
    const wheel = cyl(g, 0.36, 0.36, 0.22, 0x1a1a1a, wx, 0.36, wz, 12);
    wheel.rotation.z = Math.PI / 2;
  }
  box(g, 0.42, 0.14, 0.06, 0xfff6c0, -0.55, 0.58, -1.92);
  box(g, 0.42, 0.14, 0.06, 0xfff6c0, 0.55, 0.58, -1.92);
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

// ------------------------------------------------------------------ entry

/** Build the whole city into a scene: street, buildings, greenery. */
export function buildCity(scene) {
  buildStreet(scene);
  buildBuildings(scene);
  buildGreenery(scene);
}
