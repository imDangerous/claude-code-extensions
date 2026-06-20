#!/usr/bin/env node
// Managed by ccx — 직접 수정 금지(ccx update로 갱신).
// 검수 기록 헬퍼: 평가자(qa-reviewer / web-inspector / /code-review)의 검수 결과를 기록한다.
//   node .claude/hooks/srs-review.mjs PASS|FAIL "evidence 문자열"
//   현재 활성 SRS(specs/.active)·현재 브랜치 기준으로 specs/.reviews/<basename>.json 작성.
//   review-gate(Stop hook)는 이 기록이 PASS 일 때만 'status: done' SRS 의 세션 종료를 허용한다.
//   주의: verdict 는 생성자 자기채점이 아니라 별도 평가자의 결과여야 한다(생성자≠평가자, agent-workflow.md 규칙 8).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, isAbsolute, join, resolve } from 'node:path';

const die = (m) => { process.stderr.write(`[✗] ${m}\n`); process.exit(1); };

const verdict = process.argv[2];
const evidence = process.argv[3] || '';

if (verdict !== 'PASS' && verdict !== 'FAIL') {
  die('usage: node .claude/hooks/srs-review.mjs PASS|FAIL "evidence"  — verdict 는 PASS 또는 FAIL.');
}

const cwd = process.cwd();
const activeFile = join(cwd, 'specs', '.active');
if (!existsSync(activeFile)) die('specs/.active 가 없습니다 — 활성 SRS 가 없습니다.');
const activeRel = readFileSync(activeFile, 'utf8').trim();
if (!activeRel) die('specs/.active 가 비어 있습니다.');

const srsPath = isAbsolute(activeRel) ? activeRel : resolve(cwd, activeRel);
if (!existsSync(srsPath)) die(`활성 SRS 파일이 없습니다: ${activeRel}`);
const srsBase = basename(srsPath, '.md');

let branch = '';
try { branch = execFileSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch {}

const reviewsDir = join(cwd, 'specs', '.reviews');
if (!existsSync(reviewsDir)) mkdirSync(reviewsDir, { recursive: true });

const record = { srs: activeRel, branch, verdict, evidence, at: new Date().toISOString() };
const out = join(reviewsDir, `${srsBase}.json`);
writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`);

process.stdout.write(`[✓] 검수 기록: specs/.reviews/${srsBase}.json  (verdict: ${verdict}, branch: ${branch || '?'})\n`);
if (verdict === 'FAIL') {
  process.stdout.write('    FAIL 기록 — SRS status 를 done 에서 되돌리고 수정하세요. (검수 게이트는 PASS 만 통과)\n');
}
