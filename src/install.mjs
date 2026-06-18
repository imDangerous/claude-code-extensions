#!/usr/bin/env node
// ccx (claude-code-extensions) 설치기 — 공개·무인증.
//   curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node
//   curl -fsSL .../releases/download/v2.0.1/install.mjs | node      # 버전 핀(--ref= 도 가능)
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

const REPO = 'imDangerous/claude-code-extensions';
const isWin = platform() === 'win32';
const argRef = process.argv.find((a) => a.startsWith('--ref='))?.split('=')[1];

const die = (m) => {
  console.error(`[✗] ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`[✓] ${m}`);
const info = (m) => console.log(`[i] ${m}`);

async function fetchText(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}

const urls = argRef
  ? [`https://github.com/${REPO}/releases/download/${argRef}/bundle.mjs`]
  : [`https://github.com/${REPO}/releases/latest/download/bundle.mjs`];
// 버전 핀(--ref=) 시엔 main HEAD 폴백을 쓰지 않는다 — 핀이 조용히 우회되면 안 됨.
if (!argRef) urls.push(`https://raw.githubusercontent.com/${REPO}/main/dist/bundle.mjs`); // 릴리스 전/폴백

let src;
for (const u of urls) {
  try {
    info(`fetch ${u}`);
    src = await fetchText(u);
    ok('downloaded');
    break;
  } catch (e) {
    info(`skip (${e.message})`);
  }
}
if (!src) die('bundle.mjs 다운로드 실패');

const dataDir = join(homedir(), '.local', 'share', 'ccx');
const binDir = isWin ? dataDir : join(homedir(), '.local', 'bin');
mkdirSync(dataDir, { recursive: true });
mkdirSync(binDir, { recursive: true });
const bundlePath = join(dataDir, 'bundle.mjs');
writeFileSync(bundlePath, src);

if (isWin) {
  writeFileSync(join(binDir, 'ccx.cmd'), `@node "${bundlePath}" %*\r\n`);
} else {
  const launcher = join(binDir, 'ccx');
  writeFileSync(launcher, `#!/bin/sh\nexec node "${bundlePath}" "$@"\n`);
  chmodSync(launcher, 0o755);
}
ok(`설치 완료: ${join(binDir, isWin ? 'ccx.cmd' : 'ccx')}`);
info(`PATH 에 ${binDir} 가 없으면 추가하세요.  사용: ccx <pack> init  (예: ccx web init / ccx app init)`);
