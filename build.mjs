// 빌드: templates/** 를 cli.mjs 에 인라인해 dist/bundle.mjs 생성 (외부 의존 없음).
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const tplDir = join(root, 'templates');

const map = {};
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else map[relative(tplDir, p).split(sep).join('/')] = readFileSync(p, 'utf8');
  }
}
walk(tplDir);

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

let cli = readFileSync(join(root, 'src', 'cli.mjs'), 'utf8');
// 함수형 치환: 템플릿 JSON 에 $ 가 있어도 안전
cli = cli.replace('__TEMPLATES__', () => JSON.stringify(map)).replaceAll('__VERSION__', version);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'bundle.mjs'), cli);
writeFileSync(join(root, 'dist', 'install.mjs'), readFileSync(join(root, 'src', 'install.mjs'), 'utf8'));

console.log(`built: dist/bundle.mjs (${Object.keys(map).length} templates) + dist/install.mjs — v${version}`);
