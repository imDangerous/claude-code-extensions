#!/usr/bin/env node
// Managed by ccx — 직접 수정 금지(ccx update로 갱신).
// ccx 검수 게이트 (Stop) — 개발 후 평가자 검수를 강제한다(srs-gate 의 대칭 짝).
//   active SRS 가 'status: done' 으로 완료 선언됐는데 검수 PASS 기록이 없으면 세션 종료를 차단한다.
//   완료 선언 전(draft/approved)·비작업 브랜치·검수 기록 존재 시엔 통과 — 구현 중 stop·사용자 질문은 막지 않는다.
//   긴급 우회(운영자 명시): CCX_SRS_OFF=1
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, isAbsolute, join, resolve } from 'node:path';

const allow = () => process.exit(0);
const deny = (m) => { process.stderr.write(`[검수 게이트 차단] ${m}\n`); process.exit(2); };

if (process.env.CCX_SRS_OFF === '1') allow();

let data = {};
try { data = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { allow(); } // 입력 파싱 불가 — 판단 불가, 통과(fail-open)

if (data.stop_hook_active === true) allow(); // Stop hook 재진입 — 무한 루프 방지

const cwd = data.cwd || process.cwd();

const activeFile = join(cwd, 'specs', '.active');
if (!existsSync(activeFile)) allow(); // 활성 작업 없음
const activeRel = readFileSync(activeFile, 'utf8').trim();
if (!activeRel) allow();

const srsPath = isAbsolute(activeRel) ? activeRel : resolve(cwd, activeRel);
if (!existsSync(srsPath)) allow();

const srsBase = basename(srsPath, '.md');

// 승인되지 않았으면 아직 구현 단계 아님 — PreToolUse(srs-gate)가 이미 편집을 막는다.
const approvedFile = join(cwd, 'specs', '.approvals', `${srsBase}.json`);
if (!existsSync(approvedFile)) allow();
let approved = {};
try { approved = JSON.parse(readFileSync(approvedFile, 'utf8')); } catch { allow(); }

// 작업 브랜치가 아니면 통과.
let branch = '';
try { branch = execFileSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch {}
if (approved.branch && branch && approved.branch !== branch) allow();

// 완료 선언 전이면 통과 — frontmatter(첫 --- 블록)의 status 만 본다(본문의 "status: done" 문구 오인 방지).
const srs = readFileSync(srsPath, 'utf8');
const fm = srs.match(/^---\n([\s\S]*?)\n---/);
const statusMatch = fm ? fm[1].match(/^status:\s*(\S+)/m) : null;
const status = statusMatch ? statusMatch[1] : '';
if (status !== 'done') allow();

// 검수 PASS 기록이 있으면 통과.
const reviewFile = join(cwd, 'specs', '.reviews', `${srsBase}.json`);
if (existsSync(reviewFile)) {
  let review = {};
  try { review = JSON.parse(readFileSync(reviewFile, 'utf8')); } catch {}
  const srsMatches = !review.srs || resolve(cwd, review.srs) === srsPath;
  if (review.verdict === 'PASS' && srsMatches) allow();
}

deny(
  [
    `'${srsBase}' 가 status: done 인데 평가자 검수 PASS 기록이 없습니다.`,
    '마무리 전, 변경분을 생성자가 아닌 별도 평가자로 검수하세요:',
    '  - qa-reviewer (객관 Hard Threshold) — 필수',
    '  - web-inspector (a11y · CWV · RSC 경계) — UI 변경 시',
    '검수 PASS 후 기록(에이전트 호출 가능): node .claude/hooks/srs-review.mjs PASS "tsc:0 biome:0 qa-reviewer:PASS ..."',
    'FAIL 이면 SRS status 를 done 에서 되돌리고 수정한 뒤 다시 검수하세요.',
    '(긴급 우회: CCX_SRS_OFF=1)',
  ].join('\n'),
);
