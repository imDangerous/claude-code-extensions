#!/usr/bin/env node
// Managed by ccx — 직접 수정 금지(ccx update로 갱신).
// ccx SRS 게이트 (PreToolUse: Edit|Write|MultiEdit|NotebookEdit)
// 승인된 SRS 없이 소스 편집을 차단한다. specs/ 아래 편집(=SRS 작성)만 허용.
//   통과 조건: specs/.active 가 가리키는 SRS 가 존재 + 내용 채움 + 같은 디렉토리에 .approved + 대상 브랜치 일치.
//   긴급 우회(운영자 명시): CCX_SRS_OFF=1
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';

const allow = () => process.exit(0);
const deny = (m) => { process.stderr.write(`[SRS 게이트 차단] ${m}\n`); process.exit(2); };

if (process.env.CCX_SRS_OFF === '1') allow();

let data = {};
try { data = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const cwd = data.cwd || process.cwd();
const ti = data.tool_input || {};
const target = ti.file_path || ti.notebook_path || ti.path;
if (!target) allow(); // 편집 경로를 못 읽으면 판단 불가 — 통과

const abs = isAbsolute(target) ? target : resolve(cwd, target);
const rel = relative(cwd, abs).split(sep).join('/');
if (rel.startsWith('../') || rel === 'specs' || rel.startsWith('specs/')) allow(); // 프로젝트 밖 + SRS 작성은 허용

const activeFile = join(cwd, 'specs', '.active');
if (!existsSync(activeFile)) {
  deny('활성 SRS가 없습니다. 작업 전 SRS를 먼저 작성하세요(skill: /srs): specs/NNNN_<slug>.md(일련번호) 작성 후 그 경로를 specs/.active 에 기록하고 사용자 승인을 받으세요.');
}
const activeRel = readFileSync(activeFile, 'utf8').trim();
if (!activeRel) deny('specs/.active 가 비어 있습니다. 현재 작업 중인 SRS 파일 경로를 한 줄로 기록하세요.');

const srsPath = isAbsolute(activeRel) ? activeRel : resolve(cwd, activeRel);
if (!existsSync(srsPath)) deny(`활성 SRS 파일이 없습니다: ${activeRel}`);

const srs = readFileSync(srsPath, 'utf8');
if (/<[^>\n]{2,}>/.test(srs)) deny('SRS가 미완성입니다 — 템플릿 자리표시자(<...>)가 남아 있습니다. 요청 원문·목표·수용기준·대상 브랜치를 채우세요.');

const approvedFile = join(cwd, 'specs', '.approvals', `${basename(srsPath, '.md')}.json`);
if (!existsSync(approvedFile)) {
  deny('SRS가 아직 승인되지 않았습니다. 승인은 사람이 직접 해야 합니다(에이전트가 대신 실행 금지):  ! node .claude/hooks/srs-approve.mjs');
}
let approved = {};
try { approved = JSON.parse(readFileSync(approvedFile, 'utf8')); } catch { deny('.approved 파싱 실패 — 다시 승인하세요: ! node .claude/hooks/srs-approve.mjs'); }

if (approved.srs && resolve(cwd, approved.srs) !== srsPath) {
  deny('승인 기록이 현재 활성 SRS와 일치하지 않습니다. 현재 SRS를 승인하세요.');
}

let branch = '';
try { branch = execFileSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).trim(); } catch {}
if (approved.branch && branch && approved.branch !== branch) {
  deny(`승인된 대상 브랜치는 '${approved.branch}' 인데 현재 브랜치는 '${branch}' 입니다. 대상 브랜치로 전환한 뒤 진행하세요.`);
}

allow();
