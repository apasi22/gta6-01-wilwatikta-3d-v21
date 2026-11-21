import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Repo root: ESM equivalent of __dirname (this file uses ESM imports,
// so bare __dirname is not defined; import.meta.dirname is Node 20.11+).
const REPO_DIR: string = import.meta.dirname;
const OUT: string = process.env.MAKEFUN_OUTPUT_DIR || REPO_DIR;

const SHOTS: string[] = ['1-chase.jpg', '2-title.jpg', '3-night.jpg', '4-map.jpg'];

function sha256File(filePath: string): string {
  const data: Buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function copyIfDifferent(src: string, dest: string): void {
  // Never truncate a file by copying it onto itself (happens when OUT is
  // the repo dir itself). If source and destination are the same file,
  // the file is already where it needs to be.
  if (path.resolve(src) === path.resolve(dest)) return;
  fs.copyFileSync(src, dest);
}

function isJpeg(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const buf: Buffer = fs.readFileSync(filePath);
  return buf.length > 0 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

async function main(): Promise<number> {
  try {
    // Prepare output dirs. Never delete anything, never remove OUT.
    fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

    // Copy the 4 screenshots and the dossier into OUT.
    for (const shot of SHOTS) {
      copyIfDifferent(
        path.join(REPO_DIR, 'screenshots', shot),
        path.join(OUT, 'screenshots', shot),
      );
    }
    copyIfDifferent(
      path.join(REPO_DIR, 'dossier.json'),
      path.join(OUT, 'dossier.json'),
    );

    // Read + parse the dossier.
    const dossierPath: string = path.join(OUT, 'dossier.json');
    const dossier: any = JSON.parse(fs.readFileSync(dossierPath, 'utf8'));

    // Run the checks.
    const checks: Array<[string, boolean]> = [];
    checks.push(['dossier game WILWATIKTA 3D', dossier.game === 'WILWATIKTA 3D']);
    checks.push(['dossier version v21', dossier.version === 'v21']);
    checks.push(['dossier competition gta6-01', dossier.competition === 'gta6-01']);
    checks.push([
      'city buildings >= 10',
      typeof dossier.city?.buildings === 'number' && dossier.city.buildings >= 10,
    ]);
    checks.push([
      'city windows >= 100',
      typeof dossier.city?.windows === 'number' && dossier.city.windows >= 100,
    ]);
    checks.push([
      'districts 6',
      Array.isArray(dossier.districts) && dossier.districts.length === 6,
    ]);
    checks.push(['missions 12', String(dossier.missions) === '12']);
    checks.push([
      'crew 6 members',
      Array.isArray(dossier.crew) && dossier.crew.length === 6,
    ]);
    checks.push([
      'weapons 5',
      Array.isArray(dossier.weapons) && dossier.weapons.length === 5,
    ]);
    checks.push([
      'shots 4',
      Array.isArray(dossier.shots) && dossier.shots.length === 4,
    ]);
    checks.push([
      'size 1280x720',
      Array.isArray(dossier.size) && dossier.size[0] === 1280 && dossier.size[1] === 720,
    ]);
    checks.push([
      'game files exist',
      fs.existsSync(path.join(REPO_DIR, 'game', 'index.html')) &&
        fs.existsSync(path.join(REPO_DIR, 'game', 'js', 'game.js')) &&
        fs.existsSync(path.join(REPO_DIR, 'game', 'js', 'city.js')),
    ]);
    checks.push([
      'screenshots valid JPEG',
      SHOTS.every((shot) => isJpeg(path.join(OUT, 'screenshots', shot))),
    ]);
    checks.push([
      'dossier copied',
      fs.existsSync(dossierPath) && fs.statSync(dossierPath).size > 0,
    ]);

    // Print every check, then the summary.
    let passed = 0;
    for (const [name, ok] of checks) {
      console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`);
      if (ok) passed++;
    }
    console.log(`playtest: ${passed}/${checks.length}`);

    // Print dossier hash + size, then each screenshot hash (12 chars) + size.
    const dossierHash: string = sha256File(dossierPath);
    const dossierSize: number = fs.statSync(dossierPath).size;
    console.log(`dossier.json sha256=${dossierHash} size=${dossierSize}`);
    for (const shot of SHOTS) {
      const p: string = path.join(OUT, 'screenshots', shot);
      if (fs.existsSync(p)) {
        const h: string = sha256File(p).slice(0, 12);
        const s: number = fs.statSync(p).size;
        console.log(`${shot} sha256=${h} size=${s}`);
      } else {
        console.log(`${shot} MISSING`);
      }
    }

    return passed === checks.length ? 0 : 1;
  } catch (err) {
    console.error('ERROR:', err instanceof Error ? err.message : String(err));
    return 1;
  }
}

process.exit(await main());
