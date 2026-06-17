#!/usr/bin/env node
// Managed by link-rules-git. Do not edit — change .link/rules-git.json instead.
//
// prepare-commit-msg: `type: 제목`(conventional) → `[PREFIX-n] gitmoji 제목`.
//   - ticketPrefix 설정 시: 헤더에 있으면 보존, 없으면 브랜치명에서 추출. 미설정 시 티켓 생략.
//   - 이미 최종형식/merge/revert/squash 면 변환 안 함(idempotent).
const fs = require('node:fs');
const { execSync } = require('node:child_process');
const { GITMOJI, EMOJIS, TICKET_PREFIX } = require('./gitmoji-map.cjs');

const [msgPath, source] = process.argv.slice(2);
if (!msgPath) process.exit(0);
if (source === 'merge' || source === 'squash') process.exit(0);

const raw = fs.readFileSync(msgPath, 'utf8');
const lines = raw.split('\n');
const i = lines.findIndex((l) => l.trim() && !l.startsWith('#'));
if (i === -1) process.exit(0);

const header = lines[i];
if (/^(Merge|Revert|fixup!|squash!|amend!)/.test(header)) process.exit(0);

const emojiAlt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

let work = header;
let ticket = '';
if (TICKET_PREFIX) {
  const headRe = new RegExp(`^\\[(${TICKET_PREFIX}-\\d+)\\]\\s+`, 'i');
  const m = work.match(headRe);
  if (m) {
    ticket = `[${m[1].toUpperCase()}] `;
    work = work.slice(m[0].length);
  }
}

if (new RegExp(`^(?:${emojiAlt}) `, 'u').test(work)) process.exit(0);

const cm = work.match(/^(\w+)(?:\([^)]*\))?!?:\s+(.+)$/);
if (!cm) process.exit(0);
const [, type, subject] = cm;
const emoji = GITMOJI[type.toLowerCase()];
if (!emoji) process.exit(0);

if (TICKET_PREFIX && !ticket) {
  try {
    const branch = execSync('git symbolic-ref --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    const t = branch.match(new RegExp(`${TICKET_PREFIX}-\\d+`, 'i'));
    if (t) ticket = `[${t[0].toUpperCase()}] `;
  } catch {
    // 브랜치 확인 실패 시 티켓 없이 진행
  }
}

lines[i] = `${ticket}${emoji} ${subject}`;
fs.writeFileSync(msgPath, lines.join('\n'));
