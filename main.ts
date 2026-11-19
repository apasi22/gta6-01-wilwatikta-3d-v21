// WILWATIKTA 3D v21 — entrypoint (Node 22, stdlib only + playwright for capture).
// Serves game/ on localhost, captures 4 screenshots (1280x720) with headless
// Chromium, writes dossier.json + screenshots/*.jpg, runs 14 playtest checks.
// Deterministic: fixed seed in game.js, fixed shot clock, fixed JSON key order.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/shotcap/node_modules/playwright');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8933;
const OUT = process.env.MAKEFUN_OUTPUT_DIR || __dirname;

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.css': 'text/css',
};

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function serve(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = urlPath === '/' ? 'game/index.html' : urlPath.replace(/^\//, '');
      const file = path.join(__dirname, rel);
      if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, () => resolve(server));
  });
}

interface Shot { name: string; file: string; }
const SHOTS: Shot[] = [
  { name: 'chase', file: '1-chase.jpg' },
  { name: 'title', file: '2-title.jpg' },
  { name: 'night', file: '3-night.jpg' },
  { name: 'map', file: '4-map.jpg' },
];

function proxyOpt(): { server: string; username: string; password: string; bypass: string } | undefined {
  const raw = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  try {
    const u = new URL(raw);
    return {
      server: `${u.protocol}//${u.hostname}:${u.port}`,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      bypass: 'localhost,127.0.0.1',
    };
  } catch { return undefined; }
}

// Capture-only: the egress proxy refuses Chromium's CONNECT tunnel to the
// CDN, so the three.js module request is fulfilled from a local copy
// downloaded once via curl (same file, sha256 76dea815...). The page itself
// still references the CDN, so GitHub Pages play is unchanged.
const THREE_LOCAL = '/home/hatch/workspace/makefun/three-0.160.0.module.js';

async function main(): Promise<number> {
  const server = await serve();
  const shotsDir = path.join(OUT, 'screenshots');
  fs.mkdirSync(shotsDir, { recursive: true });

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  let http200 = true;
  let dossier: Record<string, unknown> = {};
  let playtest: Record<string, unknown> = {};

  const browser = await chromium.launch({
    headless: true,
    proxy: proxyOpt(),
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-gpu-sandbox', '--no-sandbox'],
  });
  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      await page.route('**/three.module.js', (route) =>
        route.fulfill({ path: THREE_LOCAL, contentType: 'text/javascript' }));
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`${shot.name}: ${msg.text()}`); });
      page.on('pageerror', (err) => consoleErrors.push(`${shot.name}: ${String(err)}`));
      page.on('requestfailed', (req) => failedRequests.push(`${shot.name}: ${req.url()}`));
      const resp = await page.goto(`http://127.0.0.1:${PORT}/game/index.html?shot=${shot.name}`, { waitUntil: 'load', timeout: 60000 });
      if (!resp || resp.status() !== 200) http200 = false;
      await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, { timeout: 60000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(shotsDir, shot.file), type: 'jpeg', quality: 88 });
      if (shot.name === 'chase') {
        dossier = await page.evaluate(() => (window as unknown as { __dossier: Record<string, unknown> }).__dossier);
        playtest = await page.evaluate(() => (window as unknown as { __playtest: Record<string, unknown> }).__playtest);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  // dossier.json (deterministic key order comes from game.js)
  const dossierPath = path.join(OUT, 'dossier.json');
  fs.writeFileSync(dossierPath, JSON.stringify(dossier, null, 2) + '\n');

  // 14 playtest checks
  const checks: [string, boolean][] = [
    ['index.html HTTP 200', http200],
    ['game.js served', fs.existsSync(path.join(__dirname, 'game/js/game.js'))],
    ['city.js served', fs.existsSync(path.join(__dirname, 'game/js/city.js'))],
    ['no console errors', consoleErrors.length === 0],
    ['no failed requests', failedRequests.length === 0],
    ['WebGL context', playtest.webgl === true],
    ['buildings >= 10', (playtest.buildings as number) >= 10],
    ['windows >= 100', (playtest.windows as number) >= 100],
    ['car present', playtest.car === true],
    ['hero present', playtest.hero === true],
    ['heli present', playtest.heli === true],
    ['HUD money $12,480', playtest.hudMoney === '$12,480'],
    ['crew 6 members', playtest.crew === 6],
    ['map 6 districts', playtest.mapDistricts === 6],
  ];
  let passed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (ok) passed++;
  }
  if (consoleErrors.length) console.log('console errors:', consoleErrors.slice(0, 5).join(' | '));
  if (failedRequests.length) console.log('failed requests:', failedRequests.slice(0, 5).join(' | '));

  console.log(`\nplaytest: ${passed}/14`);
  console.log(`dossier: ${dossierPath} sha256 ${sha256(dossierPath)} ${fs.statSync(dossierPath).size} B`);
  for (const shot of SHOTS) {
    const f = path.join(shotsDir, shot.file);
    console.log(`shot ${shot.file}: sha256 ${sha256(f).slice(0, 12)} ${fs.statSync(f).size} B`);
  }
  console.log(`city: ${JSON.stringify((dossier as { city?: unknown }).city)}`);
  return passed === 14 ? 0 : 1;
}

process.exit(await main());
