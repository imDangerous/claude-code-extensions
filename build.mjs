// 빌드: modules/<name>/{module.json, files/**} 를 cli.mjs 에 인라인 → dist/bundle.mjs (외부 의존 없음).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const modulesDir = join(root, 'modules');

function readFiles(dir) {
  const out = {};
  function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p).split(sep).join('/')] = readFileSync(p, 'utf8');
    }
  }
  walk(dir);
  return out;
}

const MODULES = {};
for (const name of readdirSync(modulesDir)) {
  const mdir = join(modulesDir, name);
  if (!statSync(mdir).isDirectory()) continue;
  const manifest = JSON.parse(readFileSync(join(mdir, 'module.json'), 'utf8'));
  MODULES[name] = { manifest, files: readFiles(join(mdir, 'files')) };
}

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

let cli = readFileSync(join(root, 'src', 'cli.mjs'), 'utf8');
cli = cli.replace('__MODULES__', () => JSON.stringify(MODULES)).replaceAll('__VERSION__', version);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'bundle.mjs'), cli);
writeFileSync(join(root, 'dist', 'install.mjs'), readFileSync(join(root, 'src', 'install.mjs'), 'utf8'));

const counts = Object.entries(MODULES).map(([n, m]) => `${n}(${Object.keys(m.files).length})`);
console.log(`built: dist/bundle.mjs — modules: ${counts.join(', ')} — v${version}`);
