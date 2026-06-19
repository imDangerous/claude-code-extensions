#!/usr/bin/env node
// ccx SRS 승인 — 사람이 직접 실행한다(에이전트가 대신 실행하지 말 것).
//   ! node .claude/hooks/srs-approve.mjs [브랜치]
// 현재 활성 SRS(specs/.active)를 검토 후, 현재(또는 인자) 브랜치를 대상으로 승인 마커(.approved)를 만든다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';

const root = process.cwd();
const die = (m) => { console.error(`[✗] ${m}`); process.exit(1); };

const activeFile = join(root, 'specs', '.active');
if (!existsSync(activeFile)) die('specs/.active 없음 — 먼저 SRS를 작성하고 그 경로를 기록하세요.');
const activeRel = readFileSync(activeFile, 'utf8').trim();
if (!activeRel) die('specs/.active 가 비어 있음.');

const srsPath = isAbsolute(activeRel) ? activeRel : resolve(root, activeRel);
if (!existsSync(srsPath)) die(`활성 SRS 파일 없음: ${activeRel}`);

const srs = readFileSync(srsPath, 'utf8');
if (/<[^>\n]{2,}>/.test(srs)) die('SRS에 템플릿 자리표시자(<...>)가 남아 있음 — 내용을 채운 뒤 승인하세요.');

let branch = process.argv[2];
if (!branch) {
  try { branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
}
if (!branch) die('대상 브랜치를 알 수 없습니다 — 인자로 지정하세요: node .claude/hooks/srs-approve.mjs <branch>');

const at = new Date().toISOString();
const rec = { srs: relative(root, srsPath).split(/[\\/]/).join('/'), branch, at };
const approvalsDir = join(root, 'specs', '.approvals');
mkdirSync(approvalsDir, { recursive: true });
writeFileSync(join(approvalsDir, `${basename(srsPath, '.md')}.json`), `${JSON.stringify(rec, null, 2)}\n`);

// 사람이 읽도록 SRS 본문에도 표시(있으면)
let body = srs;
if (body.includes('- [ ] 승인')) body = body.replace('- [ ] 승인', `- [x] 승인 (${at.slice(0, 10)}, 대상 브랜치: ${branch})`);
body = body.replace(/status:\s*draft/, 'status: approved');
if (body !== srs) writeFileSync(srsPath, body);

console.log(`[✓] 승인 완료: ${rec.srs}`);
console.log(`    대상 브랜치 '${branch}' 에서 소스 편집이 허용됩니다.`);
