// WILWATIKTA 3D v21 — game (fresh composition for v21).
// Same game as v20 (hero, Garuda GT, HUD, missions, map) — ONLY the city is
// more realistic (see city.js). Deterministic: fixed seed, fixed shot clock.

import * as THREE from 'three';
import { buildCity } from './city.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || '';
const CAPTURE = ['chase', 'title', 'night', 'map'].includes(SHOT);
const SEED = 19981118;
const T = 0.8; // fixed simulated time for deterministic captures

const $ = (id) => document.getElementById(id);
const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));

// ---------- renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(1);
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a1848);
scene.fog = new THREE.Fog(0x3a2350, 55, 215);

const camera = new THREE.PerspectiveCamera(58, 1280 / 720, 0.1, 600);

scene.add(new THREE.HemisphereLight(0x8a6ab0, 0x1e1428, 0.85));
const sun = new THREE.DirectionalLight(0xff9a5c, 1.1);
sun.position.set(-30, 38, -60);
scene.add(sun);
const moon = new THREE.DirectionalLight(0x7a8ac0, 0.35);
moon.position.set(20, 40, 30);
scene.add(moon);

// ---------- city (v21: realistic) ----------
const { stats } = buildCity(THREE, scene, SEED);

// ---------- shared helpers ----------
const lam = (c, e, ei) => new THREE.MeshLambertMaterial(
  e ? { color: c, emissive: e, emissiveIntensity: ei || 0.7 } : { color: c });
const box = (w, h, d, mat, x, y, z, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  (parent || scene).add(m);
  return m;
};
const cyl = (rt, rb, h, mat, x, y, z, parent, seg) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
  m.position.set(x, y, z);
  (parent || scene).add(m);
  return m;
};

// ---------- Garuda GT (v17 style, unchanged) ----------
function buildCar() {
  const g = new THREE.Group();
  const red = lam(0xb01e24);
  const darkGlass = lam(0x12161f, 0x2a3a55, 0.4);
  box(1.9, 0.55, 4.4, red, 0, 0.55, 0, g);                    // body
  const hood = box(1.85, 0.22, 1.3, red, 0, 0.82, -1.55, g); // sloped hood
  hood.rotation.x = 0.1;
  box(1.7, 0.52, 2.1, darkGlass, 0, 1.05, 0.35, g);           // cabin
  const shield = box(1.65, 0.06, 0.9, darkGlass, 0, 1.28, -0.75, g);
  shield.rotation.x = -0.5;                                    // windshield
  box(1.92, 0.18, 0.3, lam(0x1a1a22), 0, 0.42, -2.2, g);      // rear bumper
  box(1.92, 0.18, 0.3, lam(0x1a1a22), 0, 0.42, 2.2, g);       // front bumper
  box(1.7, 0.14, 0.08, lam(0x2a2a2e), 0, 0.62, -2.22, g);     // grille strip rear
  // headlights + taillights
  for (const s of [-1, 1]) {
    box(0.42, 0.16, 0.06, lam(0xfff2c0, 0xffedb0, 0.9), s * 0.62, 0.62, -2.24, g);
    box(0.42, 0.16, 0.06, lam(0xd02020, 0xff2020, 0.9), s * 0.62, 0.62, 2.24, g);
    box(0.12, 0.1, 0.3, lam(0x1a1a22), s * 0.98, 0.95, -0.6, g); // mirrors
  }
  // wheels with hubs
  for (const [wx, wz] of [[-0.92, 1.35], [0.92, 1.35], [-0.92, -1.35], [0.92, -1.35]]) {
    const w = cyl(0.36, 0.36, 0.24, lam(0x14141a), wx, 0.36, wz, g, 14);
    w.rotation.z = Math.PI / 2;
    const hub = cyl(0.17, 0.17, 0.26, lam(0xb8bcc8), wx, 0.36, wz, g, 10);
    hub.rotation.z = Math.PI / 2;
  }
  return g;
}

// ---------- Hero (realistic head-to-toe, unchanged from v20) ----------
function buildHero() {
  const g = new THREE.Group();
  const skin = lam(0xc98e5e);
  const shirt = lam(0x2e7a3a);
  const pants = lam(0x23283a);
  const shoe = lam(0x6e4a26);
  const hairM = lam(0x1a1210);
  // legs with knees + shoes
  for (const s of [-1, 1]) {
    box(0.16, 0.42, 0.18, pants, s * 0.11, 0.62, 0, g);      // thigh
    box(0.14, 0.42, 0.15, pants, s * 0.11, 0.22, 0, g);      // shin
    box(0.15, 0.09, 0.3, shoe, s * 0.11, 0.045, 0.05, g);    // shoe
  }
  box(0.52, 0.55, 0.3, shirt, 0, 1.12, 0, g);                 // torso
  box(0.56, 0.14, 0.32, shirt, 0, 1.44, 0, g);                // shoulders
  box(0.12, 0.12, 0.14, skin, 0, 1.5, 0, g);                  // neck
  // arms: upper + forearm + hands, reaching forward (two-handed grip)
  for (const s of [-1, 1]) {
    const upper = box(0.13, 0.34, 0.14, shirt, s * 0.3, 1.28, 0.05, g);
    upper.rotation.x = -0.9; upper.rotation.z = s * 0.25;
    const fore = box(0.11, 0.32, 0.12, skin, s * 0.26, 1.18, 0.3, g);
    fore.rotation.x = -1.15;
    const hand = box(0.1, 0.12, 0.14, skin, s * 0.12, 1.14, 0.52, g);
    hand.rotation.x = -1.2;
  }
  // head with face
  const head = box(0.3, 0.34, 0.28, skin, 0, 1.78, 0, g);
  head.name = 'head';
  box(0.32, 0.1, 0.3, hairM, 0, 1.97, -0.01, g);              // hair top
  box(0.32, 0.2, 0.08, hairM, 0, 1.86, -0.13, g);             // hair back
  for (const s of [-1, 1]) {                                  // eyes
    box(0.05, 0.03, 0.02, lam(0xffffff), s * 0.07, 1.82, 0.145, g);
    box(0.025, 0.03, 0.015, lam(0x1a1210), s * 0.07, 1.82, 0.155, g);
    box(0.07, 0.02, 0.015, hairM, s * 0.07, 1.885, 0.148, g); // brows
    box(0.03, 0.07, 0.03, skin, s * 0.16, 1.79, 0.1, g);     // ears
  }
  box(0.04, 0.09, 0.04, lam(0xb57a4a), 0, 1.77, 0.15, g);     // nose
  box(0.1, 0.02, 0.015, lam(0x7a2a20), 0, 1.68, 0.148, g);    // mouth
  box(0.06, 0.02, 0.01, lam(0xa06a42), -0.09, 1.72, 0.148, g); // cheek L
  box(0.06, 0.02, 0.01, lam(0xa06a42), 0.09, 1.72, 0.148, g);  // cheek R
  // pistol: two-handed, low-ready at chest, index finger straight
  const gun = new THREE.Group();
  gun.position.set(0.05, 1.12, 0.56);
  gun.rotation.x = -0.15;
  g.add(gun);
  box(0.07, 0.1, 0.24, lam(0x3a3f4a), 0, 0, 0, gun);          // grip
  box(0.05, 0.06, 0.3, lam(0x8a909c), 0, 0.06, 0.02, gun);    // slide (lighter gunmetal)
  box(0.02, 0.02, 0.1, skin, 0.05, 0.02, 0.08, gun);          // trigger finger
  return g;
}

// ---------- Helicopter ----------
function buildHeli() {
  const g = new THREE.Group();
  const body = lam(0x9aa0ac);
  box(2.0, 1.1, 3.2, body, 0, 0, 0, g);
  box(2.05, 0.3, 1.2, lam(0x2a6ea8), 0, 0.15, 0.4, g);        // blue stripe
  box(1.7, 0.5, 0.8, lam(0x12161f, 0x2a3a55, 0.4), 0, 0.2, -1.5, g); // cockpit
  box(0.35, 0.35, 3.4, body, 0, 0.25, 3.0, g);                // tail boom
  box(0.1, 1.0, 0.8, body, 0, 0.7, 4.6, g);                   // tail fin
  const rotor = new THREE.Group(); rotor.position.y = 0.75; g.add(rotor);
  box(7.2, 0.06, 0.4, lam(0x22222a), 0, 0, 0, rotor);
  box(0.4, 0.06, 7.2, lam(0x22222a), 0, 0, 0, rotor);
  rotor.rotation.y = 0.5;
  const tailRotor = new THREE.Group(); tailRotor.position.set(0.25, 0.7, 4.5); g.add(tailRotor);
  box(0.06, 1.6, 0.3, lam(0x22222a), 0, 0, 0, tailRotor);
  for (const s of [-1, 1]) box(0.08, 0.08, 2.6, lam(0x22222a), s * 0.8, -0.75, 0.4, g); // skids
  // searchlight cone
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 9, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  cone.position.set(0, -4.6, -1.2); cone.rotation.x = 0.5; g.add(cone);
  return g;
}

// ---------- Enemies / pedestrians ----------
function buildPerson(shirtColor, withGun) {
  const g = new THREE.Group();
  const skin = lam(0xc98e5e);
  const shirt = lam(shirtColor);
  const pants = lam(0x23283a);
  for (const s of [-1, 1]) {
    box(0.15, 0.4, 0.17, pants, s * 0.1, 0.6, 0, g);
    box(0.13, 0.4, 0.14, pants, s * 0.1, 0.2, 0, g);
    box(0.14, 0.08, 0.26, lam(0x3a2a1a), s * 0.1, 0.04, 0.04, g);
  }
  box(0.48, 0.52, 0.28, shirt, 0, 1.08, 0, g);
  box(0.11, 0.11, 0.13, skin, 0, 1.45, 0, g);
  const head = box(0.28, 0.3, 0.26, skin, 0, 1.7, 0, g);
  box(0.3, 0.09, 0.28, lam(0x1a1210), 0, 1.88, 0, g);
  for (const s of [-1, 1]) {
    box(0.05, 0.025, 0.015, lam(0x1a1210), s * 0.06, 1.72, 0.135, g);
  }
  for (const s of [-1, 1]) {
    const arm = box(0.12, 0.32, 0.13, withGun ? shirt : skin, s * 0.28, 1.22, 0.02, g);
    arm.rotation.x = withGun ? -1.1 : 0.1;
    arm.rotation.z = s * 0.15;
  }
  if (withGun) box(0.06, 0.09, 0.26, lam(0x2a2e36), 0, 1.18, 0.42, g);
  return g;
}

// ---------- actors ----------
const car = buildCar();
const hero = buildHero();
const heli = buildHeli();
const enemies = [];
const walkers = [];

function placeActors() {
  if (SHOT === 'title') {
    hero.position.set(3.6, 0, 3.2); hero.rotation.y = -0.5;
    car.position.set(-2.8, 0, 2.2); car.rotation.y = Math.PI / 2; // side profile, nose left
    heli.position.set(-3, 13, -20); heli.rotation.y = 0.4;
    const w1 = buildPerson(0x3a6ea8, false); w1.position.set(7.8, 0, -6); w1.rotation.y = Math.PI; scene.add(w1);
    const w2 = buildPerson(0x7a3a6e, false); w2.position.set(-7.5, 0, -14); w2.rotation.y = 0.3; scene.add(w2);
    walkers.push(w1, w2);
  } else if (SHOT === 'night') {
    hero.position.set(0, 0, 4.5); hero.rotation.y = Math.PI;
    car.position.set(-40, -5, -60); // parked off-scene
    heli.position.set(3, 14, -16); heli.rotation.y = -0.3;
    const spots = [[-3.6, -6.5, 0.2], [-1.1, -8.5, -0.1], [1.8, -10.5, 0.15], [4.6, -7.5, -0.2], [6.8, -4.5, 0.4]];
    for (const [x, z, ry] of spots) {
      const e = buildPerson(0xb02020, true);
      e.position.set(x, 0, z); e.rotation.y = ry; scene.add(e); enemies.push(e);
    }
    const w1 = buildPerson(0x3a6ea8, false); w1.position.set(-5.5, 0, -18); scene.add(w1); walkers.push(w1);
  } else { // chase / map / interactive default
    car.position.set(0, 0, 6); car.rotation.y = 0; // rear toward camera
    hero.position.set(-40, -5, -60);
    heli.position.set(4, 15, -14); heli.rotation.y = -0.5;
    const w1 = buildPerson(0x3a6ea8, false); w1.position.set(-8.2, 0, -10); w1.rotation.y = 0.2; scene.add(w1);
    const w2 = buildPerson(0x7a3a6e, false); w2.position.set(8.4, 0, -22); w2.rotation.y = Math.PI - 0.3; scene.add(w2);
    walkers.push(w1, w2);
  }
  scene.add(car); scene.add(hero); scene.add(heli);
}
placeActors();

// ---------- cameras per shot ----------
function setCamera() {
  if (SHOT === 'title') {
    camera.position.set(1.8, 2.3, 7.6);
    camera.lookAt(0.9, 1.3, -1.2);
  } else if (SHOT === 'night') {
    camera.position.set(0, 3.4, 10.5);
    camera.lookAt(0, 1.1, -8);
  } else { // chase / map / default
    camera.position.set(0, 4.5, 12.8);
    camera.lookAt(0, 1.2, -8);
  }
}
setCamera();

// ---------- HUD ----------
const MISSIONS = {
  chase: { n: 'MISSION 6/12 —', title: 'BALAPAN SENJA', desc: 'Checkpoint 1 of 4: Kalahkan 3 pembalap di Pantai Kidul.', time: '3:12', dist: '168m', next: 'GUDANG SEGARA', disp: '2 unit mengejar —', heli: 'HELI 2 — SPOTLIGHT — PANTAI KIDUL', who: 'BAMBANG', role: 'MECHANIC · BENGKEL', line: 'Your Garuda needs new brakes. Come by the bengkel.', speed: '97', gear: 'G5' },
  night: { n: 'MISSION 7/12 —', title: 'GUDANG SEGARA', desc: 'Bersihkan area gudang: 4 musuh tersisa di Pelabuhan Segara.', time: '3:13', dist: '168m', next: 'KABUR DARI WPD', disp: '1 unit mengejar —', heli: 'HELI 2 — SPOTLIGHT — PELABUHAN SEGARA', who: 'WANTO', role: 'KOMISARIS · WPD', line: 'WPD datang dari utara. Bersihkan gudang, cepat!', speed: '0', gear: 'G0' },
  map: { n: 'MISSION 6/12 —', title: 'BALAPAN SENJA', desc: 'Checkpoint 1 of 4: Kalahkan 3 pembalap di Pantai Kidul.', time: '3:12', dist: '168m', next: 'GUDANG SEGARA', disp: '2 unit mengejar —', heli: 'HELI 2 — SPOTLIGHT — PANTAI KIDUL', who: 'BAMBANG', role: 'MECHANIC · BENGKEL', line: 'Your Garuda needs new brakes. Come by the bengkel.', speed: '97', gear: 'G5' },
  title: { n: 'MISSION 6/12 —', title: 'BALAPAN SENJA', desc: 'Checkpoint 1 of 4: Kalahkan 3 pembalap di Pantai Kidul.', time: '3:12', dist: '168m', next: 'GUDANG SEGARA', disp: '2 unit mengejar —', heli: 'HELI 2 — SPOTLIGHT — PANTAI KIDUL', who: 'BAMBANG', role: 'MECHANIC · BENGKEL', line: 'Your Garuda needs new brakes. Come by the bengkel.', speed: '97', gear: 'G5' },
};
const M = MISSIONS[SHOT] || MISSIONS.chase;

function drawMinimap() {
  const c = $('minimap');
  if (!c) return;
  const g = c.getContext('2d');
  const W = c.width, H = c.height, cx = W / 2, cy = H / 2;
  g.clearRect(0, 0, W, H);
  const districts = [
    ['#3a6ea8', -Math.PI * 0.95, -Math.PI * 0.55],
    ['#7a4a9a', -Math.PI * 0.55, -Math.PI * 0.15],
    ['#2e8a7a', -Math.PI * 0.15, Math.PI * 0.25],
    ['#8a6a3a', Math.PI * 0.25, Math.PI * 0.6],
    ['#2a3a6a', Math.PI * 0.6, Math.PI * 0.95],
    ['#4a6a8a', Math.PI * 0.95, Math.PI * 1.05],
  ];
  for (const [col, a0, a1] of districts) {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 78, a0, a1); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    g.beginPath(); g.moveTo(cx - 78, cy - 26 + i * 26); g.lineTo(cx + 78, cy - 26 + i * 26); g.stroke();
  }
  const dots = [[-30, -32, '#fff'], [28, -38, '#ffd24a'], [-12, 18, '#7dff8a'], [34, 22, '#ff6a5e'], [0, 0, '#fff']];
  for (const [x, y, col] of dots) {
    g.fillStyle = col; g.beginPath(); g.arc(cx + x, cy + y, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke();
  }
  g.fillStyle = '#ffd24a';
  g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx - 6, cy + 6); g.lineTo(cx + 6, cy + 6); g.closePath(); g.fill();
  g.strokeStyle = '#ffd24a'; g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cy, 82, 0, Math.PI * 2); g.stroke();
}

function applyHUD() {
  $('mission-num').textContent = M.n;
  $('mission-title').textContent = M.title;
  $('mission-desc').textContent = M.desc;
  $('mission-time').textContent = M.time;
  $('mission-dist').textContent = '▲ ' + M.dist;
  $('mission-next').textContent = 'NEXT: ' + M.next;
  $('mission-dispatch').textContent = 'WPD DISPATCH: ' + M.disp;
  $('mission-heli').textContent = 'HELI 2 — SPOTLIGHT — ' + (SHOT === 'night' ? 'PELABUHAN SEGARA' : 'PANTAI KIDUL');
  $('dlg-who').textContent = M.who;
  $('dlg-role').textContent = M.role;
  $('dlg-line').textContent = M.line;
  $('speed-num').textContent = M.speed;
  $('gear-num').textContent = M.gear;
  $('hit-text').style.display = SHOT === 'night' ? 'block' : 'none';
  $('title-screen').style.display = SHOT === 'title' ? 'flex' : 'none';
  $('map-screen').style.display = SHOT === 'map' ? 'block' : 'none';
  $('top-hud').style.display = SHOT === 'map' ? 'none' : 'block';
  $('bottom-right').style.display = (SHOT === 'title' || SHOT === 'map') ? 'none' : 'block';
  $('left-panel').style.display = (SHOT === 'title' || SHOT === 'map') ? 'none' : 'block';
  $('dlg-bar').style.display = (SHOT === 'title' || SHOT === 'map') ? 'none' : 'flex';
  $('crew-row').style.display = SHOT === 'title' ? 'none' : 'flex';
  drawMinimap();
}
applyHUD();

// ---------- interactive controls (playable game) ----------
const keys = {};
let inCar = true, speed = 0, heading = Math.PI, weaponIdx = 2, ammo = [Infinity, 12, 32, 0, 0];
let heroPos = new THREE.Vector3(0, 0, 4.5), carPos = new THREE.Vector3(0, 0, 6);
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'e') { inCar = !inCar; }
  if (e.key.toLowerCase() === 'q') { weaponIdx = (weaponIdx + 1) % 5; updateWeapon(); }
  if (e.key.toLowerCase() === 'm') { $('map-screen').style.display = $('map-screen').style.display === 'block' ? 'none' : 'block'; }
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
renderer.domElement.addEventListener('mousedown', () => {
  if (ammo[weaponIdx] > 0) {
    if (ammo[weaponIdx] !== Infinity) ammo[weaponIdx]--;
    updateWeapon();
    const flash = $('muzzle');
    if (flash) { flash.style.opacity = '1'; setTimeout(() => { flash.style.opacity = '0'; }, 60); }
  }
});
function updateWeapon() {
  const names = ['FIST', 'PISTOL', 'SMG TAWON', 'SHOTGUN', 'RIFLE'];
  const counts = ['∞', '12/60', '32/160', 'LOCKED', 'LOCKED'];
  document.querySelectorAll('.wslot').forEach((el, i) => {
    el.classList.toggle('active', i === weaponIdx);
  });
  $('weapon-name').textContent = names[weaponIdx];
  $('weapon-count').textContent = counts[weaponIdx];
}
updateWeapon();

let camYaw = 0;
renderer.domElement.addEventListener('mousemove', (e) => {
  if (e.buttons === 1) camYaw += e.movementX * 0.003;
});

function step(dt) {
  if (inCar) {
    if (keys['w']) speed = Math.min(speed + 30 * dt, 26);
    if (keys['s']) speed = Math.max(speed - 30 * dt, -8);
    if (keys['a']) heading += 1.6 * dt * (speed >= 0 ? 1 : -1);
    if (keys['d']) heading -= 1.6 * dt * (speed >= 0 ? 1 : -1);
    speed *= (1 - 0.4 * dt);
    carPos.x += Math.sin(heading) * speed * dt;
    carPos.z += Math.cos(heading) * speed * dt;
    car.position.copy(carPos); car.rotation.y = heading;
    camera.position.set(carPos.x - Math.sin(heading + camYaw) * 9, 4.4, carPos.z - Math.cos(heading + camYaw) * 9);
    camera.lookAt(carPos.x, 1.2, carPos.z - 8);
    $('speed-num').textContent = String(Math.max(0, Math.round(Math.abs(speed) * 3.7)));
  } else {
    const mv = new THREE.Vector3();
    if (keys['w']) mv.z -= 1; if (keys['s']) mv.z += 1;
    if (keys['a']) mv.x -= 1; if (keys['d']) mv.x += 1;
    if (mv.lengthSq() > 0) {
      mv.normalize().multiplyScalar(4 * dt);
      heroPos.add(mv); hero.position.copy(heroPos);
      hero.rotation.y = Math.atan2(mv.x, mv.z);
      hero.position.y = Math.abs(Math.sin(performance.now() / 140)) * 0.05;
    }
    camera.position.set(heroPos.x, 3.2, heroPos.z + 7);
    camera.lookAt(heroPos.x, 1.2, heroPos.z - 6);
    $('speed-num').textContent = '0';
  }
  heli.position.y = (SHOT === 'title' ? 13 : SHOT === 'night' ? 14 : 15) + Math.sin(T * 2) * 0.4;
  heli.rotation.y += dt * 0.05;
}

// ---------- render ----------
function renderFixed() {
  // capture mode: fixed camera + fixed actors, NO step() (step would move the
  // camera back to the chase view and reset the car/speed HUD)
  setCamera();
  renderer.render(scene, camera);
}

window.__dossier = {
  game: 'WILWATIKTA 3D',
  version: 'v21',
  competition: 'gta6-01',
  seed: SEED,
  city: {
    buildings: stats.buildings,
    windows: stats.windows,
    litWindows: stats.litWindows,
    trees: stats.trees,
    lamps: stats.lamps,
    props: stats.props,
    meshes: stats.meshes,
  },
  districts: ['PELABUHAN SEGARA', 'KAMPUNG BATIK', 'LORONG EMAS', 'PANTAI KIDUL', 'ALUN-ALUN', 'PASAR SENJA'],
  missions: 12,
  crew: ['SUGENG', 'AGUS', 'WANTO', 'BAMBANG', 'RATNA', 'SLAMET'],
  weapons: ['FIST', 'PISTOL', 'SMG TAWON', 'SHOTGUN', 'RIFLE'],
  shots: ['1-chase', '2-title', '3-night', '4-map'],
  size: [1280, 720],
  engine: 'three.js 0.160.0 (CDN)',
  renderer: 'WebGL',
};

window.__playtest = {
  webgl: !!renderer.getContext(),
  buildings: stats.buildings,
  windows: stats.windows,
  car: !!car,
  hero: !!hero,
  heli: !!heli,
  enemies: enemies.length,
  hudMoney: ($('money') || {}).textContent || '',
  hudSpeed: ($('speed-num') || {}).textContent || '',
  minimap: !!$('minimap'),
  mission: ($('mission-title') || {}).textContent || '',
  crew: document.querySelectorAll('.crew-member').length,
  mapDistricts: document.querySelectorAll('.district').length,
  consoleErrors: errors.length,
};

if (CAPTURE) {
  renderFixed();
  renderFixed();
  window.__ready = true;
} else {
  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    step(Math.min((now - last) / 1000, 0.05));
    last = now;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  renderFixed();
  window.__ready = true;
  loop();
}
