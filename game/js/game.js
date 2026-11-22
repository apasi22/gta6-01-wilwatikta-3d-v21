// Wilwatikta 3D — the game: Sugeng, the Garuda GT, the WPD helicopter,
// and the four shots the screenshots show. Three.js r160, ES module.
//
// The page is opened with ?shot=chase | title | night | map. Each shot sets
// the camera, the hero's place and the HUD; the street itself never moves.
import * as THREE from 'three';
import { buildSky, buildCity, buildParkedCars, buildPoliceCar } from './city.js';

// ------------------------------------------------------------------ setup

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || 'chase';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(1280, 720, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1280 / 720, 0.1, 300);

// Bright flat daylight: a warm sky dome of light plus a hard noon sun.
scene.add(new THREE.HemisphereLight(0xdff1ff, 0x8a9a7a, 2.1));
const sun = new THREE.DirectionalLight(0xfff4d6, 2.6);
sun.position.set(18, 30, 10);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbfe0ff, 0.7);
fill.position.set(-12, 14, 18);
scene.add(fill);

// ------------------------------------------------------------------ helpers

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function glow(color) {
  return new THREE.MeshBasicMaterial({ color });
}

/** A box mesh, placed and added to a parent. */
function box(parent, w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}

/** A cylinder mesh, placed and added to a parent. */
function cyl(parent, rTop, rBottom, h, mat, x, y, z, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// ------------------------------------------------------------------ people

/**
 * A blocky low-poly person, built to read at a glance: a BIG head with full
 * hair (top slab, side slabs, back slab), WIDE shoulders, a bright belt, BIG
 * shoes, and a face with large eyes (white + pupil + shine), firm brows,
 * nose and blushing cheeks. Faces +Z; rotate the group to turn them.
 */
function makePerson(o) {
  const skin = lambert(o.skin ?? 0xd89a68);
  const shirt = lambert(o.shirt ?? 0x2fbf4a);
  const pants = lambert(o.pants ?? 0x2e4a7a);
  const shoes = lambert(o.shoes ?? 0x3a2e22);
  const hair = lambert(o.hair ?? 0x1a1a1a);
  const g = new THREE.Group();

  // Legs and BIG shoes.
  box(g, 0.17, 0.5, 0.19, pants, -0.11, 0.25, 0);
  box(g, 0.17, 0.5, 0.19, pants, 0.11, 0.25, 0);
  box(g, 0.21, 0.13, 0.36, shoes, -0.11, 0.065, 0.05);
  box(g, 0.21, 0.13, 0.36, shoes, 0.11, 0.065, 0.05);

  // Torso, WIDE shoulder bar, arms, hands.
  box(g, 0.5, 0.6, 0.3, shirt, 0, 0.82, 0);
  box(g, 0.6, 0.17, 0.33, shirt, 0, 1.08, 0);
  box(g, 0.14, 0.52, 0.16, shirt, -0.35, 0.82, 0);
  box(g, 0.14, 0.52, 0.16, shirt, 0.35, 0.82, 0);
  box(g, 0.13, 0.12, 0.14, skin, -0.35, 0.52, 0);
  box(g, 0.13, 0.12, 0.14, skin, 0.35, 0.52, 0);

  // Bright belt.
  box(g, 0.52, 0.1, 0.32, lambert(o.belt ?? 0xffd23f), 0, 0.54, 0);
  box(g, 0.1, 0.08, 0.02, glow(0xfff6c0), 0, 0.54, 0.17);

  // BIG head.
  box(g, 0.36, 0.38, 0.33, skin, 0, 1.34, 0);
  // FULL hair: top slab, side slabs, back slab.
  box(g, 0.4, 0.11, 0.37, hair, 0, 1.56, 0);
  box(g, 0.06, 0.3, 0.31, hair, -0.2, 1.4, 0);
  box(g, 0.06, 0.3, 0.31, hair, 0.2, 1.4, 0);
  box(g, 0.4, 0.32, 0.07, hair, 0, 1.38, -0.19);

  // Face: BIG eyes with shine, firm brows, nose, cheeks, mouth.
  const white = lambert(0xffffff);
  const dark = lambert(0x1a1a1a);
  for (const s of [-1, 1]) {
    box(g, 0.075, 0.1, 0.02, white, s * 0.085, 1.38, 0.17);
    box(g, 0.038, 0.055, 0.025, dark, s * 0.085, 1.375, 0.175);
    box(g, 0.015, 0.015, 0.03, glow(0xffffff), s * 0.075, 1.4, 0.18);
    box(g, 0.085, 0.028, 0.02, hair, s * 0.085, 1.47, 0.17);
    box(g, 0.06, 0.045, 0.02, lambert(0xff9a8a), s * 0.13, 1.29, 0.17);
  }
  box(g, 0.05, 0.09, 0.05, lambert(0xc98e5e), 0, 1.32, 0.18);
  box(g, 0.1, 0.025, 0.02, lambert(0x7a3b2e), 0, 1.22, 0.17);
  return g;
}

/** Sugeng Wibowo, the hero: vivid green shirt, blue denim, yellow belt. */
function makeSugeng() {
  return makePerson({
    skin: 0xd89a68,
    shirt: 0x2fbf4a,
    pants: 0x2e4a7a,
    shoes: 0x4a3220,
    hair: 0x1a1a1a,
    belt: 0xffd23f,
  });
}

/** A red gang enemy: vivid red shirt, dark trousers, readable eyes. */
function makeEnemy() {
  return makePerson({
    skin: 0xd89a68,
    shirt: 0xe03131,
    pants: 0x2a2f3a,
    shoes: 0x1a1a1a,
    hair: 0x241a12,
    belt: 0x222222,
  });
}

/** A colourful sidewalk walker, one of the boulevard's crowd. */
function makeWalker(shirt, pants = 0x3a4a6b) {
  return makePerson({
    skin: 0xd89a68,
    shirt,
    pants,
    shoes: 0x3a2e22,
    hair: 0x2a1a0e,
    belt: 0x8a8f96,
  });
}

// ------------------------------------------------------------------ Garuda GT

/**
 * The Garuda GT, hero car: vivid red-orange paint, white racing stripe,
 * rear spoiler, side skirts, chrome strip, big bright lights, chrome hubs.
 * The rear glass is TWO slim panels with a centre pillar — never one big
 * flat blue box from behind.
 */
function makeGarudaGT() {
  const paint = lambert(0xff4d0a, { emissive: 0x902500, emissiveIntensity: 0.35 });
  const glass = lambert(0x7ec3f2, { emissive: 0x3f96e8, emissiveIntensity: 0.35 });
  const chrome = lambert(0xdfe6ee, { emissive: 0x8a8f96, emissiveIntensity: 0.4 });
  const dark = lambert(0x1a1a1a);
  const g = new THREE.Group();

  // Lower body, hood, trunk.
  box(g, 1.9, 0.5, 4.2, paint, 0, 0.48, 0);
  box(g, 1.86, 0.2, 1.15, paint, 0, 0.62, -1.45);
  box(g, 1.86, 0.2, 0.95, paint, 0, 0.62, 1.55);
  // Cabin block and roof, orange like the body.
  box(g, 1.7, 0.55, 2.0, paint, 0, 0.98, 0.15);
  box(g, 1.74, 0.09, 2.05, paint, 0, 1.3, 0.15);

  // Windshield: one bright blue panel, raked.
  const shield = box(g, 1.5, 0.48, 0.06, glass, 0, 1.0, -0.88);
  shield.rotation.x = -0.18;
  // Rear glass: TWO slim panels with a centre pillar between them.
  box(g, 0.6, 0.4, 0.05, glass, -0.45, 1.0, 1.18);
  box(g, 0.6, 0.4, 0.05, glass, 0.45, 1.0, 1.18);
  box(g, 0.22, 0.48, 0.07, paint, 0, 1.0, 1.18);
  box(g, 0.14, 0.48, 0.07, paint, -0.8, 1.0, 1.18);
  box(g, 0.14, 0.48, 0.07, paint, 0.8, 1.0, 1.18);
  // Side glass, left and right.
  box(g, 0.05, 0.42, 1.7, glass, -0.86, 1.0, 0.15);
  box(g, 0.05, 0.42, 1.7, glass, 0.86, 1.0, 0.15);

  // White racing stripe: hood, roof, trunk.
  box(g, 0.5, 0.02, 1.1, lambert(0xffffff), 0, 0.73, -1.45);
  box(g, 0.5, 0.02, 2.0, lambert(0xffffff), 0, 1.35, 0.15);
  box(g, 0.5, 0.02, 0.9, lambert(0xffffff), 0, 0.73, 1.55);

  // Rear spoiler on two supports, side skirts, chrome strip.
  box(g, 1.75, 0.07, 0.4, dark, 0, 1.42, 1.85);
  box(g, 0.1, 0.22, 0.1, dark, -0.6, 1.28, 1.85);
  box(g, 0.1, 0.22, 0.1, dark, 0.6, 1.28, 1.85);
  box(g, 0.08, 0.14, 3.9, dark, -0.97, 0.3, 0);
  box(g, 0.08, 0.14, 3.9, dark, 0.97, 0.3, 0);
  box(g, 0.04, 0.07, 3.6, chrome, -0.98, 0.62, 0);
  box(g, 0.04, 0.07, 3.6, chrome, 0.98, 0.62, 0);

  // Bumpers, BIG bright headlights and taillights.
  box(g, 1.92, 0.16, 0.18, dark, 0, 0.32, -2.12);
  box(g, 1.92, 0.16, 0.18, dark, 0, 0.32, 2.12);
  box(g, 0.42, 0.16, 0.06, glow(0xfff6c0), -0.55, 0.62, -2.13);
  box(g, 0.42, 0.16, 0.06, glow(0xfff6c0), 0.55, 0.62, -2.13);
  box(g, 0.45, 0.18, 0.06, glow(0xff2a1a), -0.58, 0.62, 2.13);
  box(g, 0.45, 0.18, 0.06, glow(0xff2a1a), 0.58, 0.62, 2.13);

  // Wheels with bright chrome hubs.
  for (const [wx, wz] of [[-0.9, 1.35], [0.9, 1.35], [-0.9, -1.35], [0.9, -1.35]]) {
    const wheel = cyl(g, 0.37, 0.37, 0.24, dark, wx, 0.37, wz, 14);
    wheel.rotation.z = Math.PI / 2;
    const hub = cyl(g, 0.2, 0.2, 0.26, chrome, wx, 0.37, wz, 14);
    hub.rotation.z = Math.PI / 2;
  }
  return g;
}

// ------------------------------------------------------------------ helicopter

/**
 * The WPD helicopter, 1.2x scale: bright white-grey body, chunky belly,
 * vivid blue stripe, bright blue cockpit glass, stabiliser, rotors with
 * glowing red/green tips, and a bright spotlight cone sweeping the street.
 */
function makeHelicopter() {
  const body = lambert(0xd8dee8);
  const blue = lambert(0x2f7fe0);
  const glass = lambert(0x7ec3f2, { emissive: 0x3f96e8, emissiveIntensity: 0.4 });
  const dark = lambert(0x2a2f3a);
  const g = new THREE.Group();

  // Body and chunky belly.
  box(g, 2.2, 1.4, 3.4, body, 0, 0.7, 0);
  box(g, 1.8, 0.7, 2.6, body, 0, -0.2, 0.1);
  // Nose and bright blue cockpit glass.
  box(g, 1.9, 1.0, 0.7, body, 0, 0.55, -1.9);
  box(g, 1.6, 0.7, 0.1, glass, 0, 0.75, -2.26);
  box(g, 0.08, 0.6, 0.5, glass, -1.06, 0.75, -1.7);
  box(g, 0.08, 0.6, 0.5, glass, 1.06, 0.75, -1.7);
  // Vivid blue stripe along the flanks.
  box(g, 0.06, 0.28, 3.3, blue, -1.12, 0.7, 0);
  box(g, 0.06, 0.28, 3.3, blue, 1.12, 0.7, 0);
  // Tail boom, fin and stabiliser.
  box(g, 0.55, 0.55, 3.2, body, 0, 0.85, 3.1);
  box(g, 0.12, 1.3, 0.8, blue, 0, 1.3, 4.5);
  box(g, 2.6, 0.09, 0.45, body, 0, 0.9, 3.9);
  // Tail rotor.
  const tailRotor = new THREE.Group();
  box(tailRotor, 0.08, 1.1, 0.08, dark, 0, 0, 0);
  box(tailRotor, 0.08, 0.08, 1.1, dark, 0, 0, 0);
  tailRotor.position.set(0.35, 1.1, 4.55);
  g.add(tailRotor);
  // Skids.
  box(g, 0.12, 0.12, 2.6, dark, -0.8, -0.65, 0);
  box(g, 0.12, 0.12, 2.6, dark, 0.8, -0.65, 0);
  box(g, 0.1, 0.3, 0.1, dark, -0.8, -0.45, 0.8);
  box(g, 0.1, 0.3, 0.1, dark, 0.8, -0.45, 0.8);
  box(g, 0.1, 0.3, 0.1, dark, -0.8, -0.45, -0.8);
  box(g, 0.1, 0.3, 0.1, dark, 0.8, -0.45, -0.8);

  // Main rotor mast and blades with glowing red/green tips.
  cyl(g, 0.14, 0.18, 0.5, dark, 0, 1.6, 0);
  const rotor = new THREE.Group();
  box(rotor, 7.6, 0.07, 0.36, dark, 0, 0, 0);
  box(rotor, 0.7, 0.08, 0.38, glow(0xff2a1a), -3.55, 0, 0);
  box(rotor, 0.7, 0.08, 0.38, glow(0x2fbf4a), 3.55, 0, 0);
  rotor.position.set(0, 1.9, 0);
  rotor.rotation.y = 0.5;
  g.add(rotor);

  // Spotlight housing, bright lens and wide cone.
  cyl(g, 0.3, 0.34, 0.3, dark, 0, -0.7, -0.6);
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 20),
    glow(0xfffbe8)
  );
  lens.position.set(0, -0.86, -0.6);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 9.5, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff6c0, transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  cone.position.set(0, -5.5, -0.6);
  cone.rotation.x = Math.PI;
  g.add(cone);

  g.scale.setScalar(1.2);
  return g;
}

// ------------------------------------------------------------------ the world

buildSky(scene);
buildCity(scene);
buildParkedCars(scene);
buildPoliceCar(scene, 3.4, -24);

const heroCar = makeGarudaGT();
scene.add(heroCar);

const heli = makeHelicopter();
scene.add(heli);

const sugeng = makeSugeng();
scene.add(sugeng);

const enemies = [];
for (let i = 0; i < 5; i++) enemies.push(makeEnemy());
enemies.forEach((e) => scene.add(e));

const walkers = [
  makeWalker(0xffd23f), // yellow
  makeWalker(0x2fd4c4), // teal
  makeWalker(0xff7fb0), // pink
  makeWalker(0x2f7fe0), // blue
  makeWalker(0x2fbf4a), // green
];
walkers.forEach((w) => scene.add(w));

// ------------------------------------------------------------------ HUD

const $ = (id) => document.getElementById(id);

function setHudText() {
  if (SHOT === 'night') {
    $('mission-line').textContent = 'MISSION 7/12 —';
    $('mission-name').textContent = 'GUDANG SEGARA';
    $('mission-objective').textContent = 'Bersihkan area gudang: 4 musuh tersisa di Pelabuhan Segara.';
    $('mission-next').textContent = 'NEXT: KABUR DARI WPD';
    $('mission-dispatch').textContent = 'WPD DISPATCH: 1 unit mengejar —';
    $('mission-heli').textContent = 'HELI 2 — SPOTLIGHT — PELABUHAN SEGARA';
    $('dialog-name').innerHTML = 'WANTO <span>KOMISARIS · WPD</span>';
    $('dialog-text').textContent = 'WPD datang dari utara. Bersihkan gudang, cepat!';
    $('speed-value').textContent = '0';
    $('gear-value').textContent = 'G0';
    $('hit-marker').style.display = 'block';
  }
}

// Show only the HUD pieces each shot needs.
function setHudVisibility() {
  const game = SHOT !== 'title' && SHOT !== 'map';
  $('hud-left').style.display = game ? 'block' : 'none';
  $('hud-wpd').style.display = game ? 'block' : 'none';
  $('hud-crew').style.display = SHOT === 'title' ? 'none' : 'flex';
  // On the map screen the crew row sits over the map: dim it like the reference.
  $('hud-crew').style.opacity = SHOT === 'map' ? '0.55' : '1';
  $('hud-dialog').style.display = game ? 'flex' : 'none';
  $('hud-vehicle').style.display = game ? 'block' : 'none';
  $('hud-topright').style.display = SHOT === 'map' ? 'none' : 'block';
  $('hud-weapons').style.display = SHOT === 'map' ? 'none' : 'block';
  $('screen-title').style.display = SHOT === 'title' ? 'flex' : 'none';
  $('screen-map').style.display = SHOT === 'map' ? 'flex' : 'none';
  $('hud-hints').style.display = SHOT === 'title' ? 'block' : 'none';
  $('hit-marker').style.display = 'none';
}

// ------------------------------------------------------------------ shots

/** Place the camera, the hero and the crowd for the requested shot. */
function setupShot() {
  if (SHOT === 'chase') {
    heroCar.position.set(0, 0, 2);
    heroCar.rotation.y = 0;
    heroCar.visible = true;
    sugeng.visible = false;
    enemies.forEach((e) => { e.visible = false; });
    heli.position.set(4.2, 10.2, -10);
    heli.rotation.y = 0.4;
    camera.position.set(0, 3.1, 9.5);
    camera.lookAt(0, 2.4, -26);
    placeWalkers('chase');
  } else if (SHOT === 'title') {
    heroCar.position.set(-3.8, 0, 2.0);
    heroCar.rotation.y = Math.PI / 2; // profile, nose to the right
    heroCar.visible = true;
    sugeng.position.set(3.4, 0, -1.2);
    sugeng.rotation.y = 0.35;
    sugeng.visible = true;
    enemies.forEach((e) => { e.visible = false; });
    heli.position.set(0.5, 10.8, -8);
    heli.rotation.y = -0.3;
    camera.position.set(0, 2.6, 8.5);
    camera.lookAt(-0.4, 1.7, -2);
    placeWalkers('title');
  } else if (SHOT === 'night') {
    heroCar.visible = false;
    sugeng.position.set(0, 0, 4.5);
    sugeng.rotation.y = Math.PI; // back to the camera
    sugeng.visible = true;
    const spots = [[0, -4], [-2.2, -7], [2.2, -7], [-3.6, -10.5], [3.6, -10.5]];
    enemies.forEach((e, i) => {
      e.position.set(spots[i][0], 0, spots[i][1]);
      e.rotation.y = 0; // facing the camera
      e.visible = true;
    });
    heli.position.set(3.2, 10.2, -9);
    heli.rotation.y = 0.2;
    camera.position.set(0, 3.0, 9);
    camera.lookAt(0, 1.9, -16);
    placeWalkers('night');
  } else {
    // map: the chase scene, dimmed behind the map overlay.
    heroCar.position.set(0, 0, 2);
    heroCar.rotation.y = 0;
    heroCar.visible = true;
    sugeng.visible = false;
    enemies.forEach((e) => { e.visible = false; });
    heli.position.set(4.2, 10.2, -10);
    heli.rotation.y = 0.4;
    camera.position.set(0, 3.1, 9.5);
    camera.lookAt(0, 2.4, -26);
    placeWalkers('chase');
  }
}

/** Walkers on the sidewalks, colours spread along the boulevard. */
function placeWalkers(shot) {
  const spots = [
    [-6.7, 6, 0], [6.7, -4, Math.PI], [-6.7, -12, 0],
    [6.7, -16, Math.PI], [-6.7, -30, 0],
  ];
  walkers.forEach((w, i) => {
    const s = spots[i];
    w.position.set(s[0], 0, s[1]);
    w.rotation.y = s[2] + (shot === 'night' && i === 2 ? Math.PI : 0);
    w.visible = true;
  });
  // The pink walker steps out on the right in the night shot.
  if (shot === 'night') {
    walkers[2].position.set(6.7, 0, -2);
    walkers[2].rotation.y = Math.PI;
  }
}

// ------------------------------------------------------------------ render

setHudVisibility();
setHudText();
setupShot();

function render() {
  renderer.render(scene, camera);
}
render();
window.addEventListener('resize', () => {
  camera.aspect = 1280 / 720;
  camera.updateProjectionMatrix();
  renderer.setSize(1280, 720, false);
  render();
});
// Keep drawing so the frame is there whenever the screenshot lands.
(function loop() {
  requestAnimationFrame(loop);
  render();
})();
