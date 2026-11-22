// Wilwatikta 3D — characters, hero car, helicopter, shots, HUD (round 17, fresh).
// Car + characters imitate top 1-2's visual style (low wide red wedge car,
// small simple blocky figures, simple flat 2D portraits). Layout/camera/HUD
// return to round 15. Written fresh from the design brief; no old file read.
import * as THREE from 'three';
import { buildCity } from './city.js';

// --- palette -----------------------------------------------------------------
const SKIN = 0xd89a68;
const SKIN2 = 0xc98e5e;
const HAIR = 0x1c1a18;
const GREEN_SHIRT = 0x2fbf4a;
const DENIM = 0x2e4a7a;
const RED_ENEMY = 0xe03131;
const CAR_RED = 0xef3a1a; // vivid red-orange, like top 1-2's hero cars
const CAR_DARK = 0x14181f; // near-black cabin glass
const HELI_WHITE = 0xd8dee8;
const HELI_BLUE = 0x2456e0;

// --- small simple people (top-2 style: small figures, small heads) ------------
function makePerson({ shirt = GREEN_SHIRT, pants = DENIM, skin = SKIN, hair = HAIR, belt = null, scale = 1 } = {}) {
  const g = new THREE.Group();
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  // legs (short)
  for (const dx of [-0.11, 0.11]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.5, 0.19), mat(pants));
    leg.position.set(dx, 0.25, 0);
    g.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.09, 0.3), mat(0x22201e));
    shoe.position.set(dx, 0.045, 0.04);
    g.add(shoe);
  }
  // torso (simple rectangular body)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.3), mat(shirt));
  torso.position.y = 0.79;
  g.add(torso);
  if (belt) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.32), mat(belt));
    b.position.y = 0.55;
    g.add(b);
  }
  // arms
  for (const dx of [-0.36, 0.36]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.15), mat(shirt));
    arm.position.set(dx, 0.78, 0);
    g.add(arm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.15), mat(skin));
    hand.position.set(dx, 0.48, 0);
    g.add(hand);
  }
  // head — SMALL (top-2 proportion: ~22% of height), simple
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.3), mat(skin));
  head.position.y = 1.26;
  g.add(head);
  // hair cap (simple dark slab on top + back)
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.32), mat(hair));
  hairTop.position.y = 1.44;
  g.add(hairTop);
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.08), mat(hair));
  hairBack.position.set(0, 1.34, -0.15);
  g.add(hairBack);
  // face: two tiny dark eyes on the +Z side
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  for (const dx of [-0.07, 0.07]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.02), eyeMat);
    eye.position.set(dx, 1.28, 0.16);
    g.add(eye);
  }
  g.scale.setScalar(scale);
  return g;
}

function makeSugeng() {
  const s = makePerson({ shirt: GREEN_SHIRT, pants: DENIM, skin: SKIN, belt: 0xffd23e });
  // a simple smile (front face) so the title shot reads friendly
  const smile = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x7a3b1e })
  );
  smile.position.set(0, 1.18, 0.16);
  s.add(smile);
  return s;
}

function makeEnemy() {
  return makePerson({ shirt: RED_ENEMY, pants: 0x23283a, skin: SKIN2 });
}

function makeWalker(color) {
  return makePerson({ shirt: color, pants: 0x2c3440, skin: Math.random() > 0.5 ? SKIN : SKIN2 });
}

// --- Garuda GT hero car (top-2 style: LOW, WIDE wedge, red, dark cabin) -----
function makeGarudaGT() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: CAR_RED });
  const darkMat = new THREE.MeshLambertMaterial({ color: CAR_DARK });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0x1c1f24 });
  // low wide main body — the wedge
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.5, 4.6), bodyMat);
  body.position.y = 0.45;
  g.add(body);
  // front nose (slightly lower, tapered look via a shorter front box)
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.38, 1.1), bodyMat);
  nose.position.set(0, 0.4, -2.15);
  g.add(nose);
  // dark lower skirt
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.18, 4.62), trimMat);
  skirt.position.y = 0.18;
  g.add(skirt);
  // cabin: red roof panel + DARK glass band (top-2: dark cabin, red roof)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 2.0), bodyMat);
  cabin.position.set(0, 0.88, 0.35);
  g.add(cabin);
  // dark side glass (both sides of the cabin)
  for (const dx of [-0.86, 0.86]) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 1.8), darkMat);
    glass.position.set(dx, 0.88, 0.35);
    g.add(glass);
  }
  // dark rear window band (wide, flat, across the back of the cabin)
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.05), darkMat);
  rearGlass.position.set(0, 0.88, 1.38);
  g.add(rearGlass);
  // dark windshield band (front of the cabin)
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.05), darkMat);
  shield.position.set(0, 0.88, -0.68);
  g.add(shield);
  // low sleek rear spoiler lip + two small supports
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.34), trimMat);
  spoiler.position.set(0, 0.82, 2.28);
  g.add(spoiler);
  for (const dx of [-0.6, 0.6]) {
    const sup = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.1), trimMat);
    sup.position.set(dx, 0.72, 2.22);
    g.add(sup);
  }
  // bright white taillights (rear corners) + red lower strip
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xffe9e6 });
  const tailRed = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
  for (const dx of [-0.72, 0.72]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.07), tailMat);
    t.position.set(dx, 0.52, 2.32);
    g.add(t);
  }
  const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.09, 0.06), tailRed);
  tailStrip.position.set(0, 0.36, 2.32);
  g.add(tailStrip);
  // bright headlights (front corners)
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c8 });
  for (const dx of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.07), headMat);
    h.position.set(dx, 0.48, -2.72);
    g.add(h);
  }
  // dark wheels with light hubs, flared fenders cover their tops
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const hubMat = new THREE.MeshBasicMaterial({ color: 0xc9d2dc });
  for (const [dx, dz] of [[-1.0, -1.45], [1.0, -1.45], [-1.0, 1.45], [1.0, 1.45]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(dx, 0.36, dz);
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 10), hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(dx, 0.36, dz);
    g.add(hub);
  }
  return g;
}

// --- helicopter (top-2 style: dark body, bright spotlight cone) ---------------
function makeHeli() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x22303f });
  const bellyMat = new THREE.MeshLambertMaterial({ color: 0xcfd8e2 });
  const blueMat = new THREE.MeshLambertMaterial({ color: HELI_BLUE });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x0e1a26 });
  // main body (dark navy, like top 1-2) + light belly
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 3.1), bodyMat);
  body.position.y = 0.4;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 2.7), bellyMat);
  belly.position.y = -0.3;
  g.add(belly);
  // blue side stripe
  for (const dx of [-0.96, 0.96]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 2.9), blueMat);
    stripe.position.set(dx, 0.45, 0);
    g.add(stripe);
  }
  // cockpit glass (front, dark)
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.5), glassMat);
  cockpit.position.set(0, 0.35, -1.55);
  g.add(cockpit);
  // tail boom + fin
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 2.6), bodyMat);
  boom.position.set(0, 0.55, 2.7);
  g.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.7), bodyMat);
  fin.position.set(0, 0.9, 3.9);
  g.add(fin);
  // landing skids
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x1a1e24 });
  for (const dx of [-0.7, 0.7]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 2.4), skidMat);
    skid.position.set(dx, -0.62, -0.2);
    g.add(skid);
  }
  // main rotor (long thin blades, red + green tips that glow)
  const rotorMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.07, 0.3), rotorMat);
  blade.position.y = 1.25;
  g.add(blade);
  const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.32), new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
  tipR.position.set(3.6, 1.25, 0);
  g.add(tipR);
  const tipG = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.32), new THREE.MeshBasicMaterial({ color: 0x2aff66 }));
  tipG.position.set(-3.6, 1.25, 0);
  g.add(tipG);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), rotorMat);
  mast.position.y = 1.0;
  g.add(mast);
  // spotlight housing + bright lens + wide cone
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 12), skidMat);
  housing.position.set(0, -0.55, -0.9);
  g.add(housing);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), new THREE.MeshBasicMaterial({ color: 0xfffbe0 }));
  lens.position.set(0, -0.71, -0.9);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 11, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false })
  );
  cone.position.set(0, -6.2, -0.9);
  cone.rotation.x = Math.PI; // apex up at the housing
  g.add(cone);
  g.scale.setScalar(1.2);
  return g;
}

// --- pink scooter + rider (like top 1's beach scooter) ------------------------
function makeScooter() {
  const g = new THREE.Group();
  const pink = new THREE.MeshLambertMaterial({ color: 0xe86ba8 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x22201e });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.7), pink);
  body.position.y = 0.45;
  g.add(body);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.7), dark);
  seat.position.set(0, 0.75, 0.45);
  g.add(seat);
  for (const dz of [-0.7, 0.7]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), dark);
    w.rotation.z = Math.PI / 2;
    w.position.set(0, 0.28, dz);
    g.add(w);
  }
  const rider = makePerson({ shirt: 0xe86ba8, pants: 0x2c3440, skin: SKIN2, scale: 0.92 });
  rider.position.set(0, 0.55, 0.35);
  g.add(rider);
  return g;
}

// --- 2D portraits: VERY simple flat cartoon faces (top-2 style) -------------
// A rounded-square bold background, a plain face, two dot eyes, a small smile.
function faceSVG(bg, { hair = '#1c1a18', cap = null, bun = false, stache = false } = {}) {
  return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
<rect x="1" y="1" width="62" height="62" rx="12" fill="${bg}"/>
<rect x="16" y="18" width="32" height="34" rx="12" fill="#d89a68"/>
<path d="M16 30 Q16 14 32 14 Q48 14 48 30 L48 26 Q40 18 32 18 Q24 18 16 26 Z" fill="${hair}"/>
${bun ? '<circle cx="32" cy="12" r="7" fill="' + hair + '"/>' : ''}
${cap ? `<path d="M14 26 Q14 12 32 12 Q50 12 50 26 L46 24 Q46 16 32 16 Q18 16 18 24 Z" fill="${cap}"/><rect x="12" y="24" width="40" height="5" rx="2.5" fill="${cap}"/>` : ''}
<circle cx="25" cy="36" r="2.6" fill="#1a1a1a"/><circle cx="39" cy="36" r="2.6" fill="#1a1a1a"/>
<circle cx="26" cy="35" r="0.9" fill="#fff"/><circle cx="40" cy="35" r="0.9" fill="#fff"/>
${stache ? '<rect x="26" y="43" width="12" height="3" rx="1.5" fill="#1c1a18"/>' : '<path d="M27 44 Q32 48 37 44" stroke="#7a3b1e" stroke-width="2" fill="none" stroke-linecap="round"/>'}
<circle cx="20" cy="42" r="2.5" fill="#e8907a" opacity="0.55"/><circle cx="44" cy="42" r="2.5" fill="#e8907a" opacity="0.55"/>
</svg>`;
}

const CREW = [
  { name: 'SUGENG', tag: 'YOU', bg: '#2fbf4a', price: null, face: {} },
  { name: 'AGUS', tag: '$200 HIRE [Z]', bg: '#e03131', price: '$200', face: {} },
  { name: 'WANTO', tag: '$500 HIRE [X]', bg: '#2f6fe0', price: '$500', face: { cap: '#1d4fd7' } },
  { name: 'BAMBANG', tag: '$300 HIRE [H]', bg: '#ffd23e', price: '$300', face: { stache: true } },
  { name: 'RATNA', tag: '$300 HIRE [C]', bg: '#17a398', price: '$300', face: { bun: true } },
  { name: 'SLAMET', tag: '$400 HIRE [V]', bg: '#e86ba8', price: '$400', face: {} },
];

function buildCrewBar() {
  const bar = document.getElementById('crew');
  if (!bar) return;
  bar.innerHTML = CREW.map((c) => `
    <div class="crew-card">
      <div class="crew-face">${faceSVG(c.bg, c.face)}</div>
      <div class="crew-name">${c.name}</div>
      <div class="crew-tag">${c.tag}</div>
    </div>`).join('');
}

function setDialog(idx, name, role, text) {
  const p = document.getElementById('dlg-face');
  const n = document.getElementById('dlg-name');
  const r = document.getElementById('dlg-role');
  const t = document.getElementById('dlg-text');
  if (p) p.innerHTML = faceSVG(CREW[idx].bg, CREW[idx].face);
  if (n) n.textContent = name;
  if (r) r.textContent = role;
  if (t) t.textContent = text;
}

// --- round minimap (top-2 style: round, streets, district blobs) -------------
function buildMinimap() {
  const el = document.getElementById('minimap');
  if (!el) return;
  el.innerHTML = `<svg viewBox="0 0 150 150" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
<circle cx="75" cy="75" r="72" fill="#14263a" stroke="#f7c948" stroke-width="3"/>
<path d="M18 58 Q45 32 75 40 Q105 46 132 28 L132 76 Q100 68 75 76 Q45 84 18 76 Z" fill="#3fae8a" opacity="0.95"/>
<path d="M26 96 Q60 88 85 96 Q115 104 130 92 L130 130 Q80 140 28 130 Z" fill="#c9a13b" opacity="0.95"/>
<circle cx="105" cy="55" r="17" fill="#e86ba8" opacity="0.95"/>
<circle cx="45" cy="106" r="15" fill="#2fbf4a" opacity="0.95"/>
<g stroke="#ffffff" stroke-width="4" opacity="0.9">
<path d="M75 6 L75 144" fill="none"/><path d="M8 78 L142 78" fill="none"/>
<path d="M20 45 L130 55" fill="none"/><path d="M35 112 L122 102" fill="none"/>
</g>
<path d="M75 6 L142 78" stroke="#f7c948" stroke-width="4" fill="none"/>
<circle cx="98" cy="40" r="5" fill="#2f6fe0"/><circle cx="52" cy="92" r="5" fill="#e03131"/>
<circle cx="118" cy="105" r="5" fill="#f7c948"/>
<path d="M75 110 L68 96 L82 96 Z" fill="#fff"/>
<text x="75" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">N</text>
</svg>`;
}

// --- map screen: top-1 style GRID city map -----------------------------------
// A dense street grid with coloured district zones, a purple route line and
// markers — like KARIMBU's map (grid blocks, not six big panels).
function buildMapGrid() {
  const el = document.getElementById('map-grid');
  if (!el) return;
  const W = 660, H = 430, BS = 30, GAP = 7;
  let blocks = '';
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 17; c++) {
      const x = 14 + c * (BS + GAP), y = 12 + r * (BS + GAP);
      const shade = (r + c) % 3 === 0 ? '#1b2a3d' : (r + c) % 3 === 1 ? '#16222f' : '#1e2f42';
      blocks += `<rect x="${x}" y="${y}" width="${BS}" height="${BS}" rx="3" fill="${shade}"/>`;
    }
  }
  // district zones (translucent colour over the grid)
  const zones = [
    { x: 14, y: 12, w: 232, h: 142, c: '#2f6fe0', n: 'PELABUHAN SEGARA', s: 'Gudang & dermaga' },
    { x: 262, y: 12, w: 196, h: 142, c: '#2fbf4a', n: 'KAMPUNG BATIK', s: 'Batik & tenun' },
    { x: 474, y: 12, w: 172, h: 142, c: '#f7c948', n: 'LORONG EMAS', s: 'Toko emas' },
    { x: 14, y: 288, w: 232, h: 130, c: '#17a398', n: 'PANTAI KIDUL', s: 'Pantai & boulevard' },
    { x: 262, y: 168, w: 196, h: 120, c: '#e86ba8', n: 'ALUN-ALUN', s: 'Pusat kota' },
    { x: 474, y: 168, w: 172, h: 250, c: '#e86a1a', n: 'PASAR SENJA', s: 'Pasar malam' },
  ];
  let zoneSvg = '';
  for (const z of zones) {
    zoneSvg += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="8" fill="${z.c}" opacity="0.34" stroke="${z.c}" stroke-width="2"/>
<text x="${z.x + 12}" y="${z.y + 26}" font-size="14" font-weight="bold" fill="#fff">${z.n}</text>
<text x="${z.x + 12}" y="${z.y + 44}" font-size="11" fill="#e8ecf1">${z.s}</text>`;
  }
  // purple objective route + markers
  const route = `<polyline points="60,400 120,330 200,330 260,250 360,250 430,180 560,180 600,90" fill="none" stroke="#a55eea" stroke-width="4" stroke-linejoin="round" stroke-dasharray="10 6"/>
<circle cx="60" cy="400" r="8" fill="#fff" stroke="#a55eea" stroke-width="3"/>
<circle cx="600" cy="90" r="9" fill="#f7c948" stroke="#fff" stroke-width="2"/>
<circle cx="360" cy="250" r="6" fill="#2f6fe0"/><circle cx="200" cy="330" r="6" fill="#e03131"/>
<circle cx="430" cy="180" r="6" fill="#2fbf4a"/>
<path d="M60 392 L54 404 L66 404 Z" fill="#fff"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="${W}" height="${H}" fill="#0e1622"/>${blocks}${zoneSvg}${route}
<text x="20" y="418" font-size="11" fill="#9aa0a8">WILWATIKTA · GPS AKTIF · skala 1:12.000</text>
</svg>`;
}

// --- HUD text ------------------------------------------------------------------
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
// show/hide an overlay: 'block' wins over the CSS display:none, 'flex' for the crew bar
function show(id, on, disp) {
  const e = document.getElementById(id);
  if (e) e.style.display = on ? (disp || 'block') : 'none';
}

const MISSIONS = [
  ['Selamat Datang', '$300', true], ['Hot Wheels', '$450', true], ['Antar Paket', '$400', true],
  ['Tagihan Pasar', '$550', true], ['Mata-Mata', '$500', true], ['Balapan Siang', '$700', 'active'],
  ['Gudang Segara', '$650', false], ['Kabur dari WPD', '$600', false], ['Heat Wave', '$750', false],
  ['Kencana Hilang', '$700', false], ['Double Cross', '$900', false], ['The Last Ride', '$1,200', false],
];

function buildMissionList() {
  const el = document.getElementById('mission-list');
  if (!el) return;
  el.innerHTML = MISSIONS.map(([n, p, st], i) => `
    <div class="mrow ${st === 'active' ? 'active' : ''}">
      <span>${i + 1}. ${n} ${st === true ? '✓' : st === 'active' ? 'ACTIVE' : '—'}</span>
      <span class="mprice">${p}</span>
    </div>`).join('');
}

// --- boot ----------------------------------------------------------------------
export function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot') || 'chase';

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(1280, 720);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfeaff, 70, 240);
  const camera = new THREE.PerspectiveCamera(55, 1280 / 720, 0.1, 700);

  const hemi = new THREE.HemisphereLight(0xbfe0ff, 0x8a7a5a, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.5);
  sun.position.set(-40, 80, 30);
  scene.add(sun);

  buildCity(scene);
  buildCrewBar();
  buildMinimap();
  buildMissionList();
  buildMapGrid();

  // hero car + helicopter (shared by all shots)
  const car = makeGarudaGT();
  const heli = makeHeli();
  scene.add(car);
  scene.add(heli);

  // walkers on the sidewalks (colourful, like top 1-2)
  const walkerCols = [0xf7c948, 0x17a398, 0xe86ba8, 0x2f6fe0, 0x37b24d];
  const walkerSpots = [[-8.8, -14], [8.8, -26], [-8.8, -40], [8.8, -54], [-8.8, -66], [8.8, -80], [-8.8, -96], [8.8, -6]];
  walkerSpots.forEach(([x, z], i) => {
    const w = makeWalker(walkerCols[i % walkerCols.length]);
    w.position.set(x, 0, z);
    w.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(w);
  });

  // ---- per-shot staging ----
  if (shot === 'chase') {
    car.position.set(0.5, 0, 0);
    car.rotation.y = 0.15; // slight 3/4 rear angle so the wedge reads
    heli.position.set(6.0, 7.5, -11); // fully inside the top-right of the frame
    heli.rotation.y = -0.5;
    const scooter = makeScooter();
    scooter.position.set(4.6, 0, -9);
    scooter.rotation.y = Math.PI;
    scene.add(scooter);
    camera.position.set(0.5, 2.1, 9.2); // lower + further back: car hero, road ahead
    camera.lookAt(0.5, 1.0, -12);
    setText('mission-title', 'MISSION 6/12 — BALAPAN SIANG');
    setText('mission-obj', 'Checkpoint 1 of 4: Kalahkan 3 pembalap di Pantai Kidul.');
    setText('mission-time', '3:12');
    setText('mission-next', 'NEXT: GUDANG SEGARA');
    setDialog(3, 'BAMBANG', 'MECHANIC · BENGKEL', 'Your Garuda needs new brakes. Come by the bengkel.');
    setText('car-speed', '97');
    setText('car-cond', '100%');
    show('hud', true); show('hud-topright', true); show('crew', true, 'flex');
    show('title-screen', false); show('map-screen', false); show('hit', false);
  } else if (shot === 'title') {
    car.position.set(0.0, 0, 4.2); // profile view, low-center, clear of the menu buttons
    car.rotation.y = Math.PI / 2; // front pointing left
    heli.position.set(4.5, 7.5, -7);
    heli.rotation.y = -0.4;
    const sugeng = makeSugeng();
    sugeng.position.set(4.1, 0, 1.4);
    sugeng.rotation.y = 0; // facing the camera
    sugeng.scale.setScalar(1.35); // hero on the title screen
    scene.add(sugeng);
    camera.position.set(0.8, 2.2, 10.8);
    camera.lookAt(0.8, 0.8, -2);
    show('hud', false); show('crew', false); show('title-screen', true);
    show('map-screen', false); show('hit', false); show('hud-topright', true);
  } else if (shot === 'night') {
    // dusk: dim the day light, warm low sun, blue dusk tint over the canvas
    hemi.intensity = 0.55;
    sun.color.setHex(0xff9a3d);
    sun.intensity = 0.85;
    sun.position.set(-50, 22, 20);
    show('dusk', true);
    const sugeng = makeSugeng();
    sugeng.position.set(-2.2, 0, 2.5); // left of the dialog bar, fully visible
    sugeng.rotation.y = Math.PI; // back to camera
    scene.add(sugeng);
    const spots = [[-4.6, -3.5], [-2.2, -5.5], [0.4, -4.2], [2.6, -6.2], [4.4, -3.8]];
    spots.forEach(([x, z]) => {
      const e = makeEnemy();
      e.position.set(x, 0, z);
      e.rotation.y = 0; // facing Sugeng / camera
      scene.add(e);
    });
    car.position.set(3.4, 0, -0.5); // parked at the side, visible right of Sugeng
    car.rotation.y = 0.25;
    heli.position.set(-4.5, 7.0, -8); // fully inside the top-left of the frame
    heli.rotation.y = 0.5;
    camera.position.set(0, 2.1, 7.6);
    camera.lookAt(0, 1.0, -5);
    setText('mission-title', 'MISSION 7/12 — GUDANG SEGARA');
    setText('mission-obj', 'Bersihkan area gudang: 4 musuh tersisa di Pelabuhan Segara.');
    setText('mission-time', '3:13');
    setText('mission-next', 'NEXT: KABUR DARI WPD');
    setDialog(2, 'WANTO', 'KOMISARIS · WPD', 'WPD datang dari utara. Bersihkan gudang, cepat!');
    setText('car-speed', '0');
    setText('car-cond', '100%');
    show('hud', true); show('hud-topright', true); show('crew', true, 'flex');
    show('title-screen', false); show('map-screen', false); show('hit', true);
  } else { // map
    car.visible = false; // the map overlay is the star; hide the 3D car behind it
    heli.visible = false;
    camera.position.set(0, 10, 17);
    camera.lookAt(0, 0, -8);
    show('hud', false); show('hud-topright', false); show('crew', true, 'flex');
    show('title-screen', false); show('map-screen', true); show('hit', false);
  }

  // render loop (virtual-time budget advances it for the screenshot)
  function frame() {
    requestAnimationFrame(frame);
    renderer.render(scene, camera);
  }
  frame();
}

// auto-boot when loaded as a module
boot();
