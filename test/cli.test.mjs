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
