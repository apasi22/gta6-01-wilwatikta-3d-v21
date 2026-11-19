// WILWATIKTA 3D v21 — city builder (fresh composition for v21).
// ONLY the city is new here: more realistic buildings, streets, trees, lamps
// and street furniture than v20, same avenue layout, same districts, same mood.
// Deterministic: every random choice comes from mulberry32(seed).

import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function signTexture(text, bg, fg, sub) {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 52px Arial, sans-serif';
    g.fillText(text, w / 2, sub ? h / 2 - 16 : h / 2);
    if (sub) { g.font = '28px Arial, sans-serif'; g.fillText(sub, w / 2, h / 2 + 34); }
  });
}

function awningTexture(c1, c2) {
  return canvasTexture(256, 64, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(i * 32, 0, 32, h); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 10, w, 10);
  });
}

function skyTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#241448');
    grad.addColorStop(0.35, '#4a2364');
    grad.addColorStop(0.62, '#8a2f6d');
    grad.addColorStop(0.8, '#e85d6a');
    grad.addColorStop(0.92, '#ff9a5c');
    grad.addColorStop(1.0, '#ffc27a');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // sun disc low on the horizon
    g.fillStyle = '#ffe9b0';
    g.beginPath(); g.arc(w * 0.5, h * 0.86, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,233,176,0.35)';
    g.beginPath(); g.arc(w * 0.5, h * 0.86, 70, 0, Math.PI * 2); g.fill();
    // stars up high
    g.fillStyle = 'rgba(255,255,255,0.85)';
    const starRng = mulberry32(7);
    for (let i = 0; i < 90; i++) {
      const x = starRng() * w, y = starRng() * h * 0.3, r = starRng() * 1.6 + 0.4;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // faint clouds
    g.fillStyle = 'rgba(255,150,170,0.16)';
    for (let i = 0; i < 8; i++) {
      const x = mulberry32(100 + i)() * w, y = h * (0.3 + mulberry32(200 + i)() * 0.3);
      g.beginPath(); g.ellipse(x, y, 90 + mulberry32(300 + i)() * 80, 12, 0, 0, Math.PI * 2); g.fill();
    }
  });
}

function glowTexture() {
  return canvasTexture(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,220,140,0.95)');
    grad.addColorStop(0.4, 'rgba(255,200,110,0.35)');
    grad.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

function pavingTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#6b6480'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 24; i++) {
      g.fillRect(mulberry32(500 + i)() * w, mulberry32(600 + i)() * h, 20, 14);
    }
  });
}

export function buildCity(THREE, scene, seed) {
  const rng = mulberry32(seed);
  const stats = { buildings: 0, windows: 0, litWindows: 0, trees: 0, lamps: 0, props: 0, meshes: 0 };
  const root = new THREE.Group();
  root.name = 'city';
  scene.add(root);
  const add = (m) => { root.add(m); stats.meshes++; return m; };

  // ---- shared materials ----
  const M = {
    asphalt: new THREE.MeshLambertMaterial({ color: 0x322b45 }),
    asphaltPatch: new THREE.MeshLambertMaterial({ color: 0x2a2338 }),
    sidewalk: new THREE.MeshLambertMaterial({ map: pavingTexture() }),
    curb: new THREE.MeshLambertMaterial({ color: 0x4a4360 }),
    lineYellow: new THREE.MeshLambertMaterial({ color: 0xf2c230 }),
    lineWhite: new THREE.MeshLambertMaterial({ color: 0xe8e4da }),
    lineWorn: new THREE.MeshLambertMaterial({ color: 0xcfc9ba }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x4a3220 }),
    leafA: new THREE.MeshLambertMaterial({ color: 0x2e6b34 }),
    leafB: new THREE.MeshLambertMaterial({ color: 0x3f8a3c }),
    leafC: new THREE.MeshLambertMaterial({ color: 0x1f4d2a }),
    pole: new THREE.MeshLambertMaterial({ color: 0x23202e }),
    lampHead: new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0xffc860, emissiveIntensity: 0.9 }),
    dark: new THREE.MeshLambertMaterial({ color: 0x1c1826 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x101826, emissive: 0x2a3a55, emissiveIntensity: 0.35 }),
    concrete: new THREE.MeshLambertMaterial({ color: 0x8a8494 }),
    steel: new THREE.MeshLambertMaterial({ color: 0x5a5f6e }),
    wood: new THREE.MeshLambertMaterial({ color: 0x6e4a26 }),
    hydrant: new THREE.MeshLambertMaterial({ color: 0xb02020 }),
    skyline: new THREE.MeshLambertMaterial({ color: 0x1d1533 }),
  };
  const facadePalette = [0x9c8a6e, 0x8a5a44, 0x7d7468, 0x5e7d7a, 0xa88a4e, 0x4a4a5e, 0xb09a7a, 0x6e5a6e];
  const shopSigns = [
    ['BENGKEL BAMBANG', '#20344e', '#ffd24a', 'SERVICE · SPAREPART'],
    ['WARUNG KOPI', '#4a2a1a', '#ffe9a8', 'KOPI · NASI · SATE'],
    ['TOKO BATIK', '#5e2a4a', '#ffd24a', 'BATIK TULIS SEGARA'],
    ['APOTEK SEHAT', '#1e4a3a', '#e8fff2', 'BUKA 24 JAM'],
    ['KANTOR WPD', '#1e2a4a', '#9ec2ff', 'WILWATIKTA POLICE'],
    ['TOKO KELONTONG', '#4a3a1a', '#ffe9a8', 'SEMBAKO · PULSA'],
    ['FOTOCOPY', '#2a2a3a', '#ffd24a', 'PRINT · JILID'],
    ['BAKSO PAK SLAMET', '#5e1a1a', '#ffe9a8', 'BAKSO · MIE AYAM'],
  ];

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || root).add(m); stats.meshes++;
    return m;
  };

  // ---- ground: road + sidewalks ----
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 260), M.asphalt);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -60);
  add(ground);
  // asphalt patches (repairs / wear)
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2 + rng() * 5, 3 + rng() * 6), M.asphaltPatch);
    p.rotation.x = -Math.PI / 2;
    p.position.set((rng() - 0.5) * 12, 0.01, 10 - rng() * 130);
    add(p);
  }
  // sidewalks (raised, paved) both sides
  for (const s of [-1, 1]) {
    const sw = box(7, 0.3, 260, M.sidewalk, s * 10.5, 0.15, -60);
    sw.material.map.repeat.set(3, 60);
    box(0.35, 0.42, 260, M.curb, s * 7.1, 0.21, -60);
    box(0.35, 0.42, 260, M.curb, s * 13.9, 0.21, -60);
  }
  // center dashed line + edge lines
  for (let z = 12; z > -140; z -= 6) box(0.35, 0.02, 3, M.lineYellow, 0, 0.02, z);
  for (const s of [-1, 1]) box(0.22, 0.02, 150, M.lineWhite, s * 6.4, 0.02, -62);
  // zebra crossings (worn, per-stripe offset)
  for (const zc of [4, -38]) {
    for (let i = -5; i <= 5; i++) {
      const worn = rng() > 0.75;
      const stripe = box(0.9, 0.02, 2.6, worn ? M.lineWorn : M.lineWhite, i * 1.15, 0.02, zc + (rng() - 0.5) * 0.12);
      stripe.scale.y = 1; stripe.rotation.y = (rng() - 0.5) * 0.02;
    }
  }
  // manholes + drains
  for (let i = 0; i < 8; i++) {
    const mh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), M.dark);
    mh.rotation.x = -Math.PI / 2; mh.position.set((rng() - 0.5) * 9, 0.025, 8 - rng() * 120);
    add(mh);
    box(1.4, 0.03, 0.4, M.dark, (rng() > 0.5 ? 6.9 : -6.9), 0.03, 6 - rng() * 110);
  }

  // ---- sky backdrop + distant skyline ----
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 190),
    new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false })
  );
  sky.position.set(0, 55, -195); add(sky);
  const skylineRng = mulberry32(4242);
  for (let i = 0; i < 30; i++) {
    const w = 10 + skylineRng() * 18, h = 14 + skylineRng() * 46;
    const x = -170 + i * 12 + skylineRng() * 6;
    box(w, h, 8, M.skyline, x, h / 2 - 1, -175 - skylineRng() * 25);
    // a few lit windows far away
    for (let k = 0; k < 4; k++) {
      if (skylineRng() > 0.5) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4),
          new THREE.MeshBasicMaterial({ color: 0xffd27a }));
        win.position.set(x + (skylineRng() - 0.5) * (w - 3), 2 + skylineRng() * (h - 4), -170 - skylineRng() * 20);
        add(win);
      }
    }
  }

  // ---- buildings (two rows flanking the avenue) ----
  const winFrames = [];
  const winPanes = [];
  const litWarm = new THREE.MeshLambertMaterial({ color: 0xffd27a, emissive: 0xffb84a, emissiveIntensity: 0.85 });
  const litCool = new THREE.MeshLambertMaterial({ color: 0xcfe4ff, emissive: 0x9ec2ff, emissiveIntensity: 0.5 });
  const winDark = new THREE.MeshLambertMaterial({ color: 0x232838 });
  const winFrameMat = new THREE.MeshLambertMaterial({ color: 0x14101e });

  function buildOne(x, z, w, d, floors, facadeColor, shop) {
    const h = floors * 3.1 + 1.2;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g); stats.meshes++;
    const facade = new THREE.MeshLambertMaterial({ color: facadeColor });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), facade);
    body.position.y = h / 2; g.add(body); stats.meshes++;
    // cornice bands between ground floor and roofline
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.28, d + 0.35),
      new THREE.MeshLambertMaterial({ color: 0x2e2838 }));
    cornice.position.y = 3.35; g.add(cornice); stats.meshes++;
    const corniceTop = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.22, d + 0.3),
      new THREE.MeshLambertMaterial({ color: 0x2e2838 }));
    corniceTop.position.y = h - 0.4; g.add(corniceTop); stats.meshes++;
    // parapet + rooftop clutter
    const pp = 0.5;
    for (const [px, pz, pw, pd] of [[0, d / 2 - 0.15, w, 0.3], [0, -d / 2 + 0.15, w, 0.3], [-w / 2 + 0.15, 0, 0.3, d], [w / 2 - 0.15, 0, 0.3, d]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw, pp, pd), facade);
      p.position.set(px, h + pp / 2, pz); g.add(p); stats.meshes++;
    }
    if (rng() > 0.35) { // AC unit
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.8), M.steel);
      ac.position.set((rng() - 0.5) * (w - 2), h + 0.35, (rng() - 0.5) * (d - 2)); g.add(ac); stats.meshes++;
    }
    if (rng() > 0.5) { // water tank
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 12),
        new THREE.MeshLambertMaterial({ color: 0x3a4a5e }));
      tank.position.set((rng() - 0.5) * (w - 2.5), h + 0.8, (rng() - 0.5) * (d - 2.5)); g.add(tank); stats.meshes++;
    }
    if (rng() > 0.45) { // antenna
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.4, 6), M.steel);
      ant.position.set((rng() - 0.5) * (w - 2), h + 1.7, (rng() - 0.5) * (d - 2)); g.add(ant); stats.meshes++;
      const cross = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), M.steel);
      cross.position.set(ant.position.x, h + 2.6, ant.position.z); g.add(cross); stats.meshes++;
    }
    // balconies on some upper floors
    if (rng() > 0.55) {
      const fl = 2 + Math.floor(rng() * (floors - 2));
      const bal = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 1.1), M.concrete);
      bal.position.set((rng() > 0.5 ? 1 : -1) * (w / 4), 3.1 * fl + 0.4, d / 2 + 0.55);
      g.add(bal); stats.meshes++;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.08), M.steel);
      rail.position.set(bal.position.x, 3.1 * fl + 0.85, d / 2 + 1.05);
      g.add(rail); stats.meshes++;
    }
    // windows on the street-facing facade
    const cols = Math.max(2, Math.floor((w - 1.5) / 1.9));
    const faceZ = d / 2 + 0.02;
    for (let f = 1; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const wx = -w / 2 + 1.1 + c * ((w - 2.2) / Math.max(1, cols - 1));
        const wy = 3.1 * f + 1.55;
        winFrames.push([x + wx, wy, z + faceZ]);
        const r = rng();
        const mat = r < 0.42 ? litWarm : r < 0.55 ? litCool : winDark;
        winPanes.push([x + wx, wy, z + faceZ + 0.05, mat]);
        stats.windows++;
        if (mat !== winDark) stats.litWindows++;
        // AC box under some windows
        if (rng() > 0.82) {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.3), M.steel);
          ac.position.set(wx, wy - 0.95, d / 2 + 0.18); g.add(ac); stats.meshes++;
        }
      }
    }
    // side windows (a few, darker)
    for (let f = 1; f < floors; f++) {
      for (const s of [-1, 1]) {
        if (rng() > 0.5) {
          const wy = 3.1 * f + 1.55;
          const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), rng() > 0.6 ? litWarm : winDark);
          pane.position.set(s * (w / 2 + 0.02), wy, (rng() - 0.5) * (d - 3));
          pane.rotation.y = s * Math.PI / 2;
          g.add(pane); stats.meshes++; stats.windows++;
        }
      }
    }
    // ground-floor shopfront (faces the avenue)
    if (shop) {
      const [name, bg, fg, sub] = pick(rng, shopSigns);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 2.4, 2.1), M.glass);
      glass.position.set(0, 1.55, d / 2 + 0.03); g.add(glass); stats.meshes++;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 1, 6.4), 1.6),
        new THREE.MeshBasicMaterial({ map: signTexture(name, bg, fg, sub) }));
      sign.position.set(0, 3.0, d / 2 + 0.06); g.add(sign); stats.meshes++;
      const awn = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.6, 1.0),
        new THREE.MeshLambertMaterial({ map: awningTexture(pick(rng, ['#c23a2e', '#2a6e8a', '#3a7a3a', '#8a6a2a']), '#f2ead8') }));
      awn.position.set(0, 2.55, d / 2 + 0.5); awn.rotation.x = -0.5; g.add(awn); stats.meshes++;
      // door
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2),
        new THREE.MeshLambertMaterial({ color: 0x2a1e14 }));
      door.position.set(w / 2 - 1.2, 1.15, d / 2 + 0.04); g.add(door); stats.meshes++;
    } else {
      // residential entrance: door + steps + small porch lamp
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3),
        new THREE.MeshLambertMaterial({ color: pick(rng, [0x3a2a1a, 0x1e3a2a, 0x2a1e3a]) }));
      door.position.set(0, 1.2, d / 2 + 0.03); g.add(door); stats.meshes++;
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.8), M.concrete);
      step.position.set(0, 0.09, d / 2 + 0.4); g.add(step); stats.meshes++;
    }
    stats.buildings++;
    return g;
  }

  const rows = [];
  for (const s of [-1, 1]) {
    let z = 14;
    while (z > -150) {
      const w = 9 + rng() * 5, d = 8 + rng() * 4;
      const floors = 3 + Math.floor(rng() * 6);
      const x = s * (17 + w / 2 + rng() * 3);
      buildOne(x, z - d / 2, w, d, floors, pick(rng, facadePalette), rng() > 0.35);
      z -= d + 2 + rng() * 4;
      rows.push([x, z]);
    }
  }
  // window instancing (frames + panes)
  const frameGeo = new THREE.BoxGeometry(1.15, 1.45, 0.1);
  const frames = new THREE.InstancedMesh(frameGeo, winFrameMat, winFrames.length);
  winFrames.forEach((p, i) => {
    const m = new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]);
    frames.setMatrixAt(i, m);
  });
  root.add(frames); stats.meshes++;
  const paneGeo = new THREE.BoxGeometry(0.95, 1.25, 0.06);
  const panes = new THREE.InstancedMesh(paneGeo, litWarm, winPanes.length);
  winPanes.forEach((p, i) => {
    const m = new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]);
    panes.setMatrixAt(i, m);
    panes.setColorAt(i, new THREE.Color(p[3] === litWarm ? 0xffd27a : p[3] === litCool ? 0xcfe4ff : 0x232838));
  });
  // instanced color needs material color white to show through
  panes.material = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 });
  root.add(panes); stats.meshes++;

  // ---- trees (layered canopies, planters, bushes) ----
  const treeSpots = [];
  for (let z = 10; z > -140; z -= 11 + rng() * 6) {
    treeSpots.push([-9.2, z + (rng() - 0.5) * 3]);
    treeSpots.push([9.2, z + 5 + (rng() - 0.5) * 3]);
  }
  for (const [x, z] of treeSpots) {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); stats.meshes++;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 8), M.trunk);
    trunk.position.y = 0.8; g.add(trunk); stats.meshes++;
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.3), M.concrete);
    planter.position.y = 0.25; g.add(planter); stats.meshes++;
    const blobs = 2 + Math.floor(rng() * 2);
    for (let b = 0; b < blobs; b++) {
      const r = 0.9 + rng() * 0.55;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), pick(rng, [M.leafA, M.leafB, M.leafC]));
      leaf.position.set((rng() - 0.5) * 0.9, 2.1 + b * 0.75, (rng() - 0.5) * 0.9);
      leaf.scale.y = 0.8; g.add(leaf); stats.meshes++;
    }
    stats.trees++;
  }
  // bushes near building fronts
  for (let i = 0; i < 12; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.5 + rng() * 0.4, 8, 6), pick(rng, [M.leafA, M.leafC]));
    b.position.set((rng() > 0.5 ? 1 : -1) * (8 + rng() * 4), 0.35, 10 - rng() * 120);
    b.scale.y = 0.7; add(b);
  }

  // ---- lamps (pole + curved arm + glow + ground pool) ----
  const glowTex = glowTexture();
  for (let z = 8; z > -140; z -= 15) {
    for (const s of [-1, 1]) {
      if ((Math.round(z / 15) + (s > 0 ? 1 : 0)) % 2 !== 0) continue;
      const x = s * 7.6;
      const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); stats.meshes++;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.2, 8), M.pole);
      pole.position.y = 2.6; g.add(pole); stats.meshes++;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), M.pole);
      arm.position.set(-s * 0.7, 5.15, 0); arm.rotation.z = s * 1.1; g.add(arm); stats.meshes++;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), M.lampHead);
      head.position.set(-s * 1.35, 5.0, 0); head.scale.y = 0.75; g.add(head); stats.meshes++;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.85, depthWrite: false }));
      glow.position.set(-s * 1.35, 5.0, 0); glow.scale.set(3.4, 3.4, 1); g.add(glow); stats.meshes++;
      const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20),
        new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.1, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.set(-s * 1.35, 0.32, 0); g.add(pool); stats.meshes++;
      stats.lamps++;
    }
  }

  // ---- street furniture ----
  function bench(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0.3, z); g.rotation.y = ry; root.add(g); stats.meshes++;
    box(1.8, 0.1, 0.55, M.wood, 0, 0.45, 0, g);
    box(1.8, 0.5, 0.08, M.wood, 0, 0.85, -0.24, g);
    box(0.08, 0.45, 0.5, M.pole, -0.8, 0.22, 0, g);
    box(0.08, 0.45, 0.5, M.pole, 0.8, 0.22, 0, g);
    stats.props++;
  }
  bench(-8.6, -12, 0); bench(8.6, -52, Math.PI); bench(-8.6, -88, 0);
  function hydrant(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0.3, z); root.add(g); stats.meshes++;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.8, 10), M.hydrant);
    body.position.y = 0.4; g.add(body); stats.meshes++;
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M.hydrant);
    top.position.y = 0.85; g.add(top); stats.meshes++;
    stats.props++;
  }
  hydrant(8.4, -20); hydrant(-8.4, -70);
  function sign(x, z, kind) {
    const g = new THREE.Group(); g.position.set(x, 0.3, z); root.add(g); stats.meshes++;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), M.pole);
    pole.position.y = 1.2; g.add(pole); stats.meshes++;
    if (kind === 'stop') {
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.45, 8),
        new THREE.MeshLambertMaterial({ color: 0xc02020 }));
      s.position.y = 2.5; g.add(s); stats.meshes++;
      const inner = new THREE.Mesh(new THREE.CircleGeometry(0.3, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      inner.position.set(0, 2.5, 0.01); g.add(inner); stats.meshes++;
    } else {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9),
        new THREE.MeshLambertMaterial({ color: 0x2050a0 }));
      s.position.y = 2.5; g.add(s); stats.meshes++;
    }
    stats.props++;
  }
  sign(7.0, -30, 'stop'); sign(-7.0, -60, 'info'); sign(7.0, -100, 'stop');
  // bus stop shelter
  {
    const g = new THREE.Group(); g.position.set(11.5, 0.3, -46); root.add(g); stats.meshes++;
    for (const dx of [-1.4, 1.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), M.steel);
      post.position.set(dx, 1.3, 0); g.add(post); stats.meshes++;
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.4),
      new THREE.MeshLambertMaterial({ color: 0x2a6e8a }));
    roof.position.y = 2.65; g.add(roof); stats.meshes++;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), M.glass);
    back.position.set(0, 1.5, -0.6); g.add(back); stats.meshes++;
    box(2.6, 0.1, 0.5, M.wood, 0, 0.5, -0.3, g);
    stats.props++;
  }
  // warung kiosk with striped awning
  {
    const g = new THREE.Group(); g.position.set(-11.8, 0.3, -26); root.add(g); stats.meshes++;
    box(2.6, 2.4, 2.0, new THREE.MeshLambertMaterial({ color: 0x7a5a34 }), 0, 1.2, 0, g);
    const awn = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.2),
      new THREE.MeshLambertMaterial({ map: awningTexture('#c23a2e', '#f2ead8') }));
    awn.position.set(0, 2.5, 1.1); awn.rotation.x = -0.45; g.add(awn); stats.meshes++;
    box(2.8, 0.12, 0.9, M.wood, 0, 1.0, 1.05, g);
    const signM = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({ map: signTexture('WARUNG', '#4a2a1a', '#ffe9a8', null) }));
    signM.position.set(0, 2.9, 1.02); g.add(signM); stats.meshes++;
    stats.props++;
  }
  // parked cars (varied colors, cabin + wheels + lights)
  const carColors = [0x3a6ea8, 0xc8b060, 0x4a7a4a, 0x8a8a92, 0x6a3a5e];
  const parkSpots = [[-5.2, -16, 0.05], [5.2, -58, -0.03], [-5.2, -96, 0.02], [5.2, -120, 0.0]];
  for (const [x, z, ry] of parkSpots) {
    const g = new THREE.Group(); g.position.set(x, 0.05, z); g.rotation.y = ry; root.add(g); stats.meshes++;
    const col = pick(rng, carColors);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 4.0),
      new THREE.MeshLambertMaterial({ color: col }));
    body.position.y = 0.45; g.add(body); stats.meshes++;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), M.glass);
    cab.position.set(0, 0.95, -0.2); g.add(cab); stats.meshes++;
    for (const [wx, wz] of [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 10), M.dark);
      wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, 0.32, wz); g.add(wheel); stats.meshes++;
    }
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xfff2c0, emissive: 0xffedb0, emissiveIntensity: 0.7 }));
    hl.position.set(0, 0.5, -2.02); g.add(hl); stats.meshes++;
    stats.props++;
  }
  // billboards
  const billboards = [
    ['KOPI WILWATIKTA', '#2a1a3a', '#ffd24a', 'SEDUH PAGI · 1998'],
    ['GARUDA GT', '#5e1a1a', '#ffffff', 'CEPAT · TANGGUH'],
  ];
  for (let i = 0; i < 2; i++) {
    const [t, bg, fg, sub] = billboards[i];
    const g = new THREE.Group();
    g.position.set(i === 0 ? -14 : 14, 0, -70 - i * 45);
    g.rotation.y = i === 0 ? 0.5 : -0.5;
    root.add(g); stats.meshes++;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7, 8), M.pole);
    pole.position.y = 3.5; g.add(pole); stats.meshes++;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.8),
      new THREE.MeshBasicMaterial({ map: signTexture(t, bg, fg, sub) }));
    board.position.set(0, 8.2, 0); g.add(board); stats.meshes++;
    stats.props++;
  }
  // power poles + sagging wires
  let prevTop = null;
  for (let z = 2; z > -140; z -= 24) {
    const g = new THREE.Group(); g.position.set(13.2, 0, z); root.add(g); stats.meshes++;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), M.wood);
    pole.position.y = 3.75; g.add(pole); stats.meshes++;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), M.wood);
    cross.position.y = 6.9; g.add(cross); stats.meshes++;
    const top = new THREE.Vector3(13.2, 6.9, z);
    if (prevTop) {
      const mid = prevTop.clone().lerp(top, 0.5); mid.y -= 0.9;
      const curve = new THREE.QuadraticBezierCurve3(prevTop, mid, top);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(12)),
        new THREE.LineBasicMaterial({ color: 0x0a0a12 }));
      root.add(line); stats.meshes++;
    }
    prevTop = top;
    stats.props++;
  }
  // trash bins
  for (const [x, z] of [[-7.4, -44], [7.4, -82], [-7.4, -116]]) {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.8, 10),
      new THREE.MeshLambertMaterial({ color: 0x2e4a2e }));
    bin.position.set(x, 0.7, z); add(bin); stats.props++;
  }

  return { root, stats };
}
