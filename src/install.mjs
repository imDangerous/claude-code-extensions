#!/usr/bin/env node
// claude-rules 설치기 — 공개·무인증.
//   curl -fsSL https://github.com/imDangerous/claude-rules/releases/latest/download/install.mjs | node
//   curl -fsSL .../releases/download/v0.1.0/install.mjs | node      # 버전 핀(--ref= 도 가능)
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

const REPO = 'imDangerous/claude-rules';
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
urls.push(`https://raw.githubusercontent.com/${REPO}/main/dist/bundle.mjs`); // 릴리스 전/폴백

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

const dataDir = join(homedir(), '.local', 'share', 'claude-rules');
const binDir = isWin ? dataDir : join(homedir(), '.local', 'bin');
mkdirSync(dataDir, { recursive: true });
mkdirSync(binDir, { recursive: true });
const bundlePath = join(dataDir, 'bundle.mjs');
writeFileSync(bundlePath, src);

if (isWin) {
  writeFileSync(join(binDir, 'claude-rules.cmd'), `@node "${bundlePath}" %*\r\n`);
} else {
  const launcher = join(binDir, 'claude-rules');
  writeFileSync(launcher, `#!/bin/sh\nexec node "${bundlePath}" "$@"\n`);
  chmodSync(launcher, 0o755);
}
ok(`설치 완료: ${join(binDir, 'claude-rules')}`);
info('PATH 에 ~/.local/bin 이 없으면 추가하세요.  사용: claude-rules <module> init');
