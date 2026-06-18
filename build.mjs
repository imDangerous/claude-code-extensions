// 빌드: packs/<pack>/{pack.json, <module>/{module.json, files/**}} → dist/bundle.mjs (외부 의존 없음).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const packsDir = join(root, 'packs');

function readFiles(dir) {
  const out = {};
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p).split(sep).join('/')] = readFileSync(p, 'utf8');
    }
  })(dir);
  return out;
}

const CATALOG = {};
for (const pack of readdirSync(packsDir)) {
  const pd = join(packsDir, pack);
  if (!statSync(pd).isDirectory()) continue;
  const meta = JSON.parse(readFileSync(join(pd, 'pack.json'), 'utf8'));
  const modules = {};
  for (const mod of readdirSync(pd)) {
    const md = join(pd, mod);
    if (!statSync(md).isDirectory()) continue;
    const manifest = JSON.parse(readFileSync(join(md, 'module.json'), 'utf8'));
    modules[mod] = { manifest, files: readFiles(join(md, 'files')) };
  }
  CATALOG[pack] = { meta, modules };
}

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
let cli = readFileSync(join(root, 'src', 'cli.mjs'), 'utf8');
cli = cli.replace('__CATALOG__', () => JSON.stringify(CATALOG)).replaceAll('__VERSION__', version);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'bundle.mjs'), cli);
writeFileSync(join(root, 'dist', 'install.mjs'), readFileSync(join(root, 'src', 'install.mjs'), 'utf8'));

const sum = Object.entries(CATALOG).map(([p, v]) => `${p}[${Object.keys(v.modules).join(',')}]`).join(' ');
console.log(`built: dist/bundle.mjs — ${sum} — v${version}`);
