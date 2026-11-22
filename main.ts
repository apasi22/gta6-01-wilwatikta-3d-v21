// Wilwatikta 3D — build the hand-in: copy the playable game and its
// screenshots into /output, then write the dossier the scorer checks.
//
// Run from the repository root with Node 22: `node main.ts`.
// The output directory is created when missing and never deleted, so a
// second build only replaces the files it writes.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = process.cwd();
const outDir = process.env.OUTPUT_DIR ?? '/output';

// The page is the one file a game must hold; fail loudly without it.
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing: a game is a directory of static files, its index.html at its root');
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier: ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
