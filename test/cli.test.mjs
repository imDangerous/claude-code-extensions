// ccx 블랙박스 회귀 테스트 — 빌드된 dist/bundle.mjs를 임시 디렉터리에 실행해 검증.
// 의존성 없음(node:test). 실행: `npm test` 또는 `node --test`.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BUNDLE = join(ROOT, 'dist', 'bundle.mjs');
const tmps = [];

function mkproj(pkg = { name: 't', version: '0.0.0' }) {
  const d = mkdtempSync(join(tmpdir(), 'ccx-test-'));
  tmps.push(d);
  if (pkg) writeFileSync(join(d, 'package.json'), JSON.stringify(pkg));
  return d;
}
function ccx(args, { dir, expectFail = false } = {}) {
  const full = dir ? [...args, '--dir', dir] : args;
  try {
    const out = execFileSync('node', [BUNDLE, ...full], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    assert.ok(!expectFail, `expected failure but succeeded: ccx ${args.join(' ')}`);
    return out;
  } catch (e) {
    if (!expectFail) throw new Error(`ccx ${args.join(' ')} failed: ${e.stderr || e.message}`);
    return (e.stdout || '') + (e.stderr || '');
  }
}
const read = (d, p) => readFileSync(join(d, p), 'utf8');
const has = (d, p) => existsSync(join(d, p));

before(() => execFileSync('node', [join(ROOT, 'build.mjs')], { stdio: 'pipe' }));
process.on('exit', () => { for (const d of tmps) try { rmSync(d, { recursive: true, force: true }); } catch {} });

test('version = package.json', () => {
  const v = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  assert.equal(ccx(['version']).trim(), v);
});

test('list = 5 packs', () => {
  const out = ccx(['list']);
  for (const p of ['core', 'js', 'web', 'app', 'backend']) assert.match(out, new RegExp(`\\b${p}\\b`));
});

test('web init: core+js+web 자동 동반 + 핵심 산출물', () => {
  const d = mkproj();
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  assert.ok(has(d, 'biome.json'), 'biome.json');
  assert.ok(has(d, 'src/lib/cn.ts'), 'cn.ts');
  assert.ok(has(d, '.claude/rules/nextjs.md'), 'nextjs rule');
  assert.ok(has(d, '.claude/rules/agent-workflow.md'), 'core rule 상속');
  assert.ok(has(d, '.claude/agents/web-inspector.md'), 'web agent');
  assert.ok(has(d, '.claude/agents/qa-reviewer.md'), 'core agent 상속');
});

test('tailwind variant: v3 vs v4 상호배타', () => {
  const v3 = mkproj(); ccx(['web', 'init', '--yes', '--no-install', '--tailwind', 'v3'], { dir: v3 });
  assert.ok(has(v3, 'tailwind.config.ts'), 'v3 config');
  assert.ok(!has(v3, 'src/styles/tailwind.css'), 'v3엔 v4 css 없음');
  const v4 = mkproj(); ccx(['web', 'init', '--yes', '--no-install', '--tailwind', 'v4'], { dir: v4 });
  assert.ok(has(v4, 'src/styles/tailwind.css'), 'v4 css');
  assert.ok(!has(v4, 'tailwind.config.ts'), 'v4엔 v3 config 없음');
});

test('createOnly: 사용자 수정 biome.json 보존(KEEP)', () => {
  const d = mkproj();
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  writeFileSync(join(d, 'biome.json'), '{"USER":true}');
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  assert.equal(read(d, 'biome.json'), '{"USER":true}');
});

test('apply: always-on 5 @import + on-demand 색인 + 멱등', () => {
  const d = mkproj();
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  ccx(['apply'], { dir: d });
  const c1 = read(d, 'CLAUDE.md');
  const imports = (c1.match(/^@\.claude\/rules/gm) || []).length;
  assert.equal(imports, 5, 'always-on 5개');
  assert.match(c1, /상세 규약/, 'on-demand 색인 섹션');
  assert.match(c1, /`\.claude\/rules\/nextjs\.md`/, 'nextjs는 색인(@import 아님)');
  assert.doesNotMatch(c1, /^@\.claude\/rules\/nextjs\.md/m, 'nextjs @import 아님');
  ccx(['apply'], { dir: d });
  assert.equal(read(d, 'CLAUDE.md'), c1, 'apply 멱등');
});

test('module addressing: core git doctor OK / unknown 실패', () => {
  const d = mkproj();
  ccx(['core', 'init', '--yes', '--no-install'], { dir: d });
  ccx(['core', 'git', 'doctor'], { dir: d }); // 예외 없어야
  const err = ccx(['core', 'nope', 'doctor'], { dir: d, expectFail: true });
  assert.match(err, /알 수 없는 모듈/);
});

test('backend init: core+backend, Node 산출물 0, lang variant', () => {
  const k = mkproj(null); // package.json 없음(JVM 가정)
  ccx(['backend', 'init', '--yes', '--lang', 'kotlin'], { dir: k });
  assert.ok(has(k, '.claude/rules/spring.md'), 'spring rule');
  assert.ok(!has(k, '.husky'), 'husky 없음');
  assert.ok(!has(k, 'commitlint.config.cjs'), 'commitlint 없음');
  assert.match(read(k, '.claude/rules/spring-lang.md'), /Kotlin/);
  const j = mkproj(null);
  ccx(['backend', 'init', '--yes', '--lang', 'java'], { dir: j });
  assert.match(read(j, '.claude/rules/spring-lang.md'), /Java/);
});

test('git-branching: opt-in (기본 off)', () => {
  const off = mkproj(); ccx(['core', 'init', '--yes', '--no-install'], { dir: off });
  assert.ok(!has(off, '.claude/rules/git-branching.md'), '기본 미배포');
  const on = mkproj(); ccx(['core', 'init', '--yes', '--no-install', '--git-branching'], { dir: on });
  assert.ok(has(on, '.claude/rules/git-branching.md'), 'opt-in 배포');
});

test('blockId 마이그레이션: 레거시 ccx:core/git 훅 재init 시 중복 없음', () => {
  const d = mkproj();
  // v2.0.x 레거시 훅 블록을 미리 심는다
  mkdirSync(join(d, '.husky'), { recursive: true });
  writeFileSync(join(d, '.husky/commit-msg'),
    '#!/usr/bin/env sh\n# >>> ccx:core/git (managed: do not edit between markers) >>>\n./node_modules/.bin/commitlint --edit "$1"\n# <<< ccx <<<\n');
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  const hook = read(d, '.husky/commit-msg');
  assert.equal((hook.match(/ccx:core\/git/g) || []).length, 1, '블록 1개(중복 없음)');
  assert.equal((hook.match(/commitlint/g) || []).length, 1, 'commitlint 1회');
  assert.doesNotMatch(hook, /ccx:js\/git-hooks/, '새 id 블록 추가 안 됨(레거시 id 유지)');
});

test('soleOwner: v1 레거시 ccx:rules/git orphan 블록 init 시 제거(self-heal)', () => {
  const d = mkproj();
  mkdirSync(join(d, '.husky'), { recursive: true });
  // v1 레이아웃의 orphan 블록(삭제된 파일을 호출 — 커밋 깨짐의 원인)
  writeFileSync(join(d, '.husky/prepare-commit-msg'),
    '#!/usr/bin/env sh\n# >>> ccx:rules/git (managed: do not edit between markers) >>>\nnode .claude/extends/rules/git/gitmoji-commit.cjs "$1" "$2"\n# <<< ccx <<<\n');
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  const hook = read(d, '.husky/prepare-commit-msg');
  assert.doesNotMatch(hook, /ccx:rules\/git/, '레거시 orphan 제거됨');
  assert.doesNotMatch(hook, /extends\/rules\/git/, '삭제된 파일 호출 제거됨');
  assert.equal((hook.match(/>>> ccx:/g) || []).length, 1, 'ccx 블록 1개만');
  assert.match(hook, /ccx:core\/git/, '현재 블록 존재');
});

test('doctor: 레거시 orphan 훅 블록을 stale로 검출(정상으로 안 봄)', () => {
  const d = mkproj();
  ccx(['web', 'init', '--yes', '--no-install'], { dir: d });
  // 현재 블록 옆에 레거시 블록을 끼워넣어 orphan 상황 재현
  const hp = join(d, '.husky/commit-msg');
  writeFileSync(hp, `${read(d, '.husky/commit-msg')}\n# >>> ccx:rules/git (managed) >>>\nnode gone.cjs\n# <<< ccx <<<\n`);
  const out = ccx(['js', 'git-hooks', 'doctor'], { dir: d, expectFail: true });
  assert.match(out, /commit-msg/, 'doctor가 commit-msg 이슈로 보고');
});

test('srs-gate: opt-in (기본 off, --srs-gate 로 설치)', () => {
  const off = mkproj();
  ccx(['core', 'init', '--yes', '--no-install'], { dir: off });
  assert.ok(!has(off, '.claude/hooks/srs-gate.mjs'), '기본 init 엔 미설치');
  assert.ok(!has(off, '.claude/settings.json'), 'settings 미생성');

  const on = mkproj();
  ccx(['core', 'init', '--yes', '--no-install', '--srs-gate'], { dir: on });
  assert.ok(has(on, '.claude/hooks/srs-gate.mjs'), 'gate 훅');
  assert.ok(has(on, '.claude/hooks/srs-approve.mjs'), 'approve 스크립트');
  assert.ok(has(on, '.claude/skills/srs/SKILL.md'), 'srs 스킬');
  assert.ok(has(on, 'specs/_template/srs.md'), 'SRS 템플릿');
  const s = JSON.parse(read(on, '.claude/settings.json'));
  assert.match(s.hooks.PreToolUse[0].matcher, /Edit\|Write/, 'PreToolUse 매처');
  assert.equal(s.hooks.PreToolUse[0]._ccx, 'core/srs-gate', 'ccx 소유 마커');
  assert.ok(s.hooks.UserPromptSubmit?.length, 'UserPromptSubmit 등록');
});

test('settings kind: 멱등 + 사용자 키 보존 + remove 시 ccx만 제거', () => {
  const d = mkproj();
  ccx(['core', 'init', '--yes', '--no-install', '--srs-gate'], { dir: d });
  // 사용자가 직접 키/훅 추가
  const sp = join(d, '.claude/settings.json');
  const j = JSON.parse(read(d, '.claude/settings.json'));
  j.model = 'opus';
  j.hooks.PreToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo user' }] });
  writeFileSync(sp, JSON.stringify(j, null, 2));
  // update 후에도 사용자 키 보존 + ccx 항목 중복 없음
  ccx(['core', 'srs-gate', 'update'], { dir: d });
  const after = JSON.parse(read(d, '.claude/settings.json'));
  assert.equal(after.model, 'opus', '사용자 키 보존');
  assert.equal(after.hooks.PreToolUse.length, 2, 'ccx1 + 사용자1 (중복 없음)');
  assert.equal(JSON.stringify(after).split('"_ccx"').length - 1, 2, 'ccx 마커 2개(중복 없음)');
  // 멱등: 재설치해도 IDENTICAL
  const chk = ccx(['core', 'srs-gate', 'check'], { dir: d });
  assert.match(chk, /settings\.json\s+IDENTICAL/, '멱등');
  // remove: ccx 항목만 제거, 사용자 키 유지
  ccx(['core', 'srs-gate', 'remove'], { dir: d });
  const removed = JSON.parse(read(d, '.claude/settings.json'));
  assert.equal(removed.model, 'opus', 'remove 후 사용자 키 유지');
  assert.equal(removed.hooks.PreToolUse.length, 1, '사용자 훅만 남음');
  assert.doesNotMatch(JSON.stringify(removed), /_ccx/, 'ccx 마커 전부 제거');
});

test('srs-gate 런타임: 미승인 차단 → 승인 → 허용, specs/·미완성 처리', () => {
  const d = mkproj();
  ccx(['core', 'init', '--yes', '--no-install', '--srs-gate'], { dir: d });
  const hook = (script, payload, args = []) => {
    try {
      const out = execFileSync('node', [join(d, '.claude/hooks', script), ...args],
        { input: JSON.stringify(payload), cwd: d, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      return { code: 0, out };
    } catch (e) { return { code: e.status, out: (e.stdout || '') + (e.stderr || '') }; }
  };
  const editSrc = { cwd: d, tool_input: { file_path: join(d, 'src/app.js') } };

  // 활성 SRS 없음 → 차단
  assert.equal(hook('srs-gate.mjs', editSrc).code, 2, '활성 SRS 없으면 차단');

  // specs/ 편집(=SRS 작성)은 항상 허용
  assert.equal(hook('srs-gate.mjs', { cwd: d, tool_input: { file_path: join(d, 'specs/0001_x.md') } }).code, 0, 'specs/ 허용');

  // SRS 작성 + .active
  mkdirSync(join(d, 'specs'), { recursive: true });
  writeFileSync(join(d, 'specs/0001_feat.md'),
    '---\nid: 0001\ndate: 2026-06-19\nbranch: dev\nstatus: draft\n---\n# 기능\n## 요청 (원문)\n만들어줘\n## 목표\n달성\n## 수용 기준\n- [ ] 됨\n## 승인\n- [ ] 승인\n');
  writeFileSync(join(d, 'specs/.active'), 'specs/0001_feat.md');

  // 작성됐지만 미승인 → 차단
  let r = hook('srs-gate.mjs', editSrc);
  assert.equal(r.code, 2, '미승인 차단');
  assert.match(r.out, /승인/, '승인 필요 안내');

  // 사람이 승인(브랜치 인자 — 테스트 디렉터리는 git 아님)
  assert.equal(hook('srs-approve.mjs', {}, ['dev']).code, 0, '승인 실행 성공');
  assert.ok(has(d, 'specs/.approvals/0001_feat.json'), '승인 마커 생성');
  assert.match(read(d, 'specs/0001_feat.md'), /- \[x\] 승인/, '체크박스 표시');
  assert.match(read(d, 'specs/0001_feat.md'), /status: approved/, 'status 갱신');

  // 승인 후 → 허용 (git 아니라 브랜치 검사 스킵)
  assert.equal(hook('srs-gate.mjs', editSrc).code, 0, '승인 후 허용');

  // 미완성(<...>) SRS → 차단
  writeFileSync(join(d, 'specs/0002_bad.md'), '---\nid: 0002\n---\n# x\n## 요청 (원문)\n<채우세요>\n');
  writeFileSync(join(d, 'specs/.active'), 'specs/0002_bad.md');
  assert.equal(hook('srs-gate.mjs', editSrc).code, 2, '미완성 차단');
});
