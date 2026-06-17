#!/usr/bin/env node
// claude-rules — Claude Code 룰셋을 모듈 단위로 설치/관리하는 제너릭 CLI.
//   claude-rules <module> <init|check|doctor|update|remove>
// 빌드 시 build.mjs 가 아래 placeholder 를 {module: {manifest, files}} 로 치환한다.
import { execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const MODULES = {"git":{"manifest":{"name":"git","description":"Conventional Commits + gitmoji + optional ticket prefix (husky/commitlint/PR CI)","deps":["@commitlint/cli","@commitlint/config-conventional","husky"],"husky":true,"questions":[{"key":"ticketPrefix","type":"string","default":"","prompt":"티켓 prefix (없으면 Enter)","flag":"ticket"},{"key":"ticketRequired","type":"bool","default":false,"prompt":"티켓 필수?","flag":"ticket-required"},{"key":"packageManager","type":"string","default":"auto","prompt":"패키지 매니저 (auto/pnpm/npm/yarn/bun)","flag":"pm"},{"key":"prTitleCheck","type":"bool","default":true,"prompt":"PR 제목 CI 켤까?","flag":"no-pr-title","flagInverts":true},{"key":"commitMsgCiCheck","type":"bool","default":false,"prompt":"CI에서 커밋 메시지도 검사?","flag":"commit-ci"}],"targets":[{"src":"scripts/git/gitmoji-map.cjs","dest":"scripts/git/gitmoji-map.cjs","kind":"static"},{"src":"scripts/git/gitmoji-commit.cjs","dest":"scripts/git/gitmoji-commit.cjs","kind":"static","exec":true},{"src":"commitlint.config.cjs","dest":"commitlint.config.cjs","kind":"static"},{"src":"husky/prepare-commit-msg","dest":".husky/prepare-commit-msg","kind":"hook"},{"src":"husky/commit-msg","dest":".husky/commit-msg","kind":"hook"},{"src":"workflows/commit-standards.yml","dest":".github/workflows/commit-standards.yml","kind":"static","enabledIf":"prTitleCheck","placeholders":{"__INSTALL_CMD__":"@ciInstall"},"blocks":[{"name":"commit-messages","enabledIf":"commitMsgCiCheck"}]},{"src":"rules/git.md","dest":".claude/rules/git.md","kind":"doc"}]},"files":{"commitlint.config.cjs":"// Managed by claude-rules. Do not edit — change .claude-rules/git.json instead.\n//\n// 표준 Conventional Commits 룰(config-conventional)을 상속하고,\n// 헤더 형식만 `[PREFIX-n] gitmoji 제목`으로 재정의한다.\nconst { EMOJIS, TICKET_PREFIX, TICKET_REQUIRED } = require('./scripts/git/gitmoji-map.cjs');\n\nconst alt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|');\n\n// 티켓 prefix 설정 여부/필수 여부에 따라 헤더패턴 구성\nlet ticketPart = '';\nlet hasTicketGroup = false;\nif (TICKET_PREFIX) {\n  const group = `\\\\[(${TICKET_PREFIX}-\\\\d+)\\\\] `;\n  ticketPart = TICKET_REQUIRED ? group : `(?:${group})?`;\n  hasTicketGroup = true;\n}\n\nconst headerPattern = new RegExp(`^${ticketPart}(${alt}) (.+)$`, 'u');\nconst headerCorrespondence = hasTicketGroup\n  ? ['ticket', 'type', 'subject']\n  : ['type', 'subject'];\n\nmodule.exports = {\n  extends: ['@commitlint/config-conventional'],\n  parserPreset: { parserOpts: { headerPattern, headerCorrespondence } },\n  rules: {\n    'type-enum': [2, 'always', EMOJIS],\n    'type-case': [0], // 이모지는 대소문자 개념 없음\n  },\n};\n","husky/commit-msg":"#!/usr/bin/env sh\n# >>> claude-rules (managed: do not edit between markers) >>>\n./node_modules/.bin/commitlint --edit \"$1\"\n# <<< claude-rules <<<\n","husky/prepare-commit-msg":"#!/usr/bin/env sh\n# >>> claude-rules (managed: do not edit between markers) >>>\nnode scripts/git/gitmoji-commit.cjs \"$1\" \"$2\"\n# <<< claude-rules <<<\n","rules/git.md":"<!-- Managed by claude-rules -->\n# Git 커밋/PR 규약 (claude-rules 관리)\n\n> 이 파일과 `scripts/git/*`, `commitlint.config.cjs`, `.husky/*`, 커밋 관련 워크플로는\n> **`claude-rules`이 관리**한다. 직접 수정하지 말 것 — 값은 `.claude-rules/git.json`을 바꾸고\n> `claude-rules git update` / `claude-rules git doctor`로 갱신·점검한다.\n\n## 커밋 메시지\n\n입력은 **표준 conventional `type: 제목`**으로만. 훅이 자동으로 `[<TICKET>-n] gitmoji 제목`으로 변환한다\n(티켓 prefix 미설정 시 `gitmoji 제목`).\n\n```\n입력:  feat: 로그인 화면 추가        → 변환:  ✨ 로그인 화면 추가\n티켓 prefix 설정 시(브랜치 …/ABC-12-…):  → [ABC-12] ✨ 로그인 화면 추가\n```\n\n## type → gitmoji (표준 11개)\n\n| type | gitmoji | | type | gitmoji |\n|------|---------|-|------|---------|\n| feat | ✨ | | test | ✅ |\n| fix | 🐛 | | build | 📦 |\n| refactor | ♻️ | | ci | 👷 |\n| perf | ⚡ | | chore | 🔧 |\n| style | 💄 | | revert | ⏪ |\n| docs | 📝 | | | |\n\n표준 밖 type/이모지는 commit-msg 훅에서 차단된다.\n\n## PR 제목\n\n커밋과 동일 형식 `[<TICKET>-n] gitmoji 제목`. CI(`commit-standards.yml`)가 같은 commitlint 규칙으로 강제.\n\n## 설정 (`.claude-rules/git.json`)\n\n```jsonc\n{ \"ticketPrefix\": \"\", \"ticketRequired\": false, \"packageManager\": \"auto\",\n  \"prTitleCheck\": true, \"commitMsgCiCheck\": false }\n```\n","scripts/git/gitmoji-commit.cjs":"#!/usr/bin/env node\n// Managed by claude-rules. Do not edit — change .claude-rules/git.json instead.\n//\n// prepare-commit-msg: `type: 제목`(conventional) → `[PREFIX-n] gitmoji 제목`.\n//   - ticketPrefix 설정 시: 헤더에 있으면 보존, 없으면 브랜치명에서 추출. 미설정 시 티켓 생략.\n//   - 이미 최종형식/merge/revert/squash 면 변환 안 함(idempotent).\nconst fs = require('node:fs');\nconst { execSync } = require('node:child_process');\nconst { GITMOJI, EMOJIS, TICKET_PREFIX } = require('./gitmoji-map.cjs');\n\nconst [msgPath, source] = process.argv.slice(2);\nif (!msgPath) process.exit(0);\nif (source === 'merge' || source === 'squash') process.exit(0);\n\nconst raw = fs.readFileSync(msgPath, 'utf8');\nconst lines = raw.split('\\n');\nconst i = lines.findIndex((l) => l.trim() && !l.startsWith('#'));\nif (i === -1) process.exit(0);\n\nconst header = lines[i];\nif (/^(Merge|Revert|fixup!|squash!|amend!)/.test(header)) process.exit(0);\n\nconst emojiAlt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|');\n\nlet work = header;\nlet ticket = '';\nif (TICKET_PREFIX) {\n  const headRe = new RegExp(`^\\\\[(${TICKET_PREFIX}-\\\\d+)\\\\]\\\\s+`, 'i');\n  const m = work.match(headRe);\n  if (m) {\n    ticket = `[${m[1].toUpperCase()}] `;\n    work = work.slice(m[0].length);\n  }\n}\n\nif (new RegExp(`^(?:${emojiAlt}) `, 'u').test(work)) process.exit(0);\n\nconst cm = work.match(/^(\\w+)(?:\\([^)]*\\))?!?:\\s+(.+)$/);\nif (!cm) process.exit(0);\nconst [, type, subject] = cm;\nconst emoji = GITMOJI[type.toLowerCase()];\nif (!emoji) process.exit(0);\n\nif (TICKET_PREFIX && !ticket) {\n  try {\n    const branch = execSync('git symbolic-ref --short HEAD', {\n      encoding: 'utf8',\n      stdio: ['pipe', 'pipe', 'ignore'],\n    }).trim();\n    const t = branch.match(new RegExp(`${TICKET_PREFIX}-\\\\d+`, 'i'));\n    if (t) ticket = `[${t[0].toUpperCase()}] `;\n  } catch {\n    // 브랜치 확인 실패 시 티켓 없이 진행\n  }\n}\n\nlines[i] = `${ticket}${emoji} ${subject}`;\nfs.writeFileSync(msgPath, lines.join('\\n'));\n","scripts/git/gitmoji-map.cjs":"// Managed by claude-rules. Do not edit — change .claude-rules/git.json instead.\n//\n// 유효 커밋 타입의 SoT = @commitlint/config-conventional 표준 11개.\n// ticketPrefix / ticketRequired 는 .claude-rules/git.json 에서 런타임에 읽는다\n// (이 파일은 모든 프로젝트에서 바이트-동일).\nconst fs = require('node:fs');\nconst path = require('node:path');\n\nfunction loadConfig() {\n  try {\n    const p = path.resolve(process.cwd(), '.claude-rules', 'git.json');\n    return JSON.parse(fs.readFileSync(p, 'utf8'));\n  } catch {\n    return {};\n  }\n}\n\nconst conventional = require('@commitlint/config-conventional');\nconst cc = conventional.default || conventional;\nconst STANDARD_TYPES = cc.rules['type-enum'][2];\n\nconst EMOJI_BY_TYPE = {\n  feat: '✨',\n  fix: '🐛',\n  docs: '📝',\n  style: '💄',\n  refactor: '♻️',\n  perf: '⚡',\n  test: '✅',\n  build: '📦',\n  ci: '👷',\n  chore: '🔧',\n  revert: '⏪',\n};\n\nconst GITMOJI = {};\nfor (const type of STANDARD_TYPES) {\n  const emoji = EMOJI_BY_TYPE[type];\n  if (!emoji) {\n    throw new Error(\n      `gitmoji-map: no gitmoji for standard type '${type}'. Add it to EMOJI_BY_TYPE.`,\n    );\n  }\n  GITMOJI[type] = emoji;\n}\n\nconst EMOJIS = [...new Set(Object.values(GITMOJI))];\n\nconst cfg = loadConfig();\nconst TICKET_PREFIX = cfg.ticketPrefix || '';\nconst TICKET_REQUIRED = !!cfg.ticketRequired;\n\nmodule.exports = { GITMOJI, EMOJIS, STANDARD_TYPES, TICKET_PREFIX, TICKET_REQUIRED };\n","workflows/commit-standards.yml":"name: Commit Standards\n\n# Managed by claude-rules.\non:\n  pull_request:\n    types: [opened, edited, reopened, synchronize]\n\npermissions:\n  contents: read\n  pull-requests: read\n\njobs:\n  pr-title:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: __INSTALL_CMD__\n      - name: Lint PR title\n        env:\n          PR_TITLE: ${{ github.event.pull_request.title }}\n        run: printf '%s' \"$PR_TITLE\" | ./node_modules/.bin/commitlint\n  # >>> claude-rules: commit-messages (optional) >>>\n  commit-messages:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: __INSTALL_CMD__\n      - name: Lint commit messages in PR range\n        run: >-\n          ./node_modules/.bin/commitlint\n          --from=${{ github.event.pull_request.base.sha }}\n          --to=${{ github.event.pull_request.head.sha }}\n  # <<< claude-rules <<<\n"}}};
const VERSION = '0.1.0';
const REPO = 'imDangerous/claude-rules';

const MARK_START = '# >>> claude-rules';
const MARK_END = '# <<< claude-rules <<<';
const SENTINEL = 'Managed by claude-rules';
const configRel = (mod) => join('.claude-rules', `${mod}.json`);

const c = {
  ok: (m) => console.log(`\x1b[32m[✓]\x1b[0m ${m}`),
  warn: (m) => console.log(`\x1b[33m[⚠]\x1b[0m ${m}`),
  err: (m) => console.error(`\x1b[31m[✗]\x1b[0m ${m}`),
  info: (m) => console.log(`\x1b[36m[i]\x1b[0m ${m}`),
  plain: (m) => console.log(m),
};

const sha = (s) => createHash('sha256').update(s).digest('hex');
const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, s);
};

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out.flags[key] = next;
        i++;
      } else out.flags[key] = true;
    } else out._.push(a);
  }
  return out;
}

function detectPM(root) {
  if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(root, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(root, 'bun.lockb'))) return 'bun';
  if (existsSync(join(root, 'package-lock.json'))) return 'npm';
  return 'npm';
}
const installCmd = (pm, deps) =>
  ({
    pnpm: `pnpm add -D ${deps.join(' ')}`,
    npm: `npm install -D ${deps.join(' ')}`,
    yarn: `yarn add -D ${deps.join(' ')}`,
    bun: `bun add -d ${deps.join(' ')}`,
  })[pm];
const ciInstall = (pm) =>
  ({
    pnpm: 'pnpm install --frozen-lockfile',
    npm: 'npm ci',
    yarn: 'yarn install --frozen-lockfile',
    bun: 'bun install --frozen-lockfile',
  })[pm];
const execPrefix = (pm) => ({ pnpm: 'pnpm exec', npm: 'npm exec', yarn: 'yarn', bun: 'bunx' })[pm];

const defaults = (manifest) => Object.fromEntries(manifest.questions.map((q) => [q.key, q.default]));

function readConfig(root, mod) {
  const p = join(root, configRel(mod));
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(read(p));
  } catch {
    return null;
  }
}

const resolvePM = (cfg, root) =>
  cfg.packageManager && cfg.packageManager !== 'auto' ? cfg.packageManager : detectPM(root);

function render(t, files, cfg, pm) {
  let s = files[t.src];
  if (t.placeholders) {
    for (const [ph, val] of Object.entries(t.placeholders)) {
      s = s.replaceAll(ph, val === '@ciInstall' ? ciInstall(pm) : val);
    }
  }
  if (t.blocks) {
    for (const b of t.blocks) {
      if (cfg[b.enabledIf]) continue;
      const lines = s.split('\n');
      const start = lines.findIndex((l) => l.includes(`claude-rules: ${b.name}`));
      const end = lines.findIndex((l, i) => i > start && l.trim() === MARK_END);
      if (start !== -1 && end !== -1) lines.splice(start, end - start + 1);
      s = lines.join('\n');
    }
  }
  return s;
}

function extractBlock(content) {
  const lines = content.split('\n');
  const s = lines.findIndex((l) => l.startsWith(MARK_START));
  const e = lines.findIndex((l, i) => i >= s && l.trim() === MARK_END);
  if (s === -1 || e === -1) return null;
  return lines.slice(s, e + 1).join('\n');
}

function classify(root, t, rendered) {
  const p = join(root, t.dest);
  if (!existsSync(p)) return 'CREATE';
  const cur = read(p);
  if (t.kind === 'hook') {
    if (cur.includes(MARK_START)) return extractBlock(cur) === extractBlock(rendered) ? 'IDENTICAL' : 'UPDATE';
    return 'MERGE';
  }
  if (sha(cur) === sha(rendered)) return 'IDENTICAL';
  if (cur.includes(SENTINEL)) return 'UPDATE';
  return 'FOREIGN';
}

const activeTargets = (manifest, cfg) =>
  manifest.targets.filter((t) => !t.enabledIf || cfg[t.enabledIf]);

function hookManagerConflict(root) {
  let hooksPath = '';
  try {
    hooksPath = execSync('git config --get core.hooksPath', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {}
  const competing = [];
  if (hooksPath && !hooksPath.startsWith('.husky')) competing.push(`core.hooksPath=${hooksPath}`);
  if (existsSync(join(root, 'lefthook.yml')) || existsSync(join(root, '.lefthook.yml'))) competing.push('lefthook');
  if (existsSync(join(root, '.pre-commit-config.yaml'))) competing.push('pre-commit framework');
  return competing;
}

function cmdCheck(root, mod, cfg, pm, quiet) {
  const { manifest, files } = mod;
  if (!quiet) c.info(`대상: ${root}  모듈: ${manifest.name}`);
  let conflicts = 0;
  let hard = 0;
  if (manifest.husky) {
    const competing = hookManagerConflict(root);
    if (competing.length) {
      c.err(`다른 훅 매니저와 충돌: ${competing.join(', ')} — git hooksPath는 하나만 가능`);
      hard++;
    }
  }
  for (const t of activeTargets(manifest, cfg)) {
    const status = classify(root, t, render(t, files, cfg, pm));
    const line = `${t.dest.padEnd(40)} ${status}`;
    if (status === 'FOREIGN') {
      c.err(`${line} — 외부 내용(백업 후 채택 필요)`);
      conflicts++;
    } else if (status === 'MERGE') c.warn(`${line} — 기존 훅에 관리 블록 추가(보존)`);
    else if (status === 'UPDATE') c.warn(`${line} — 갱신 예정`);
    else c.ok(line);
  }
  if (!quiet) c.plain(`요약: 충돌 ${conflicts} · 하드충돌 ${hard}`);
  return hard ? 2 : conflicts ? 1 : 0;
}

async function resolveConfig(manifest, args, existing) {
  const flags = args.flags;
  const yes = !!flags.yes;
  const cfg = {};
  let rl;
  if (!yes) rl = createInterface({ input: process.stdin, output: process.stdout });
  for (const q of manifest.questions) {
    const cur = existing && q.key in existing ? existing[q.key] : q.default;
    let val = cur;
    if (q.flag && q.flag in flags) {
      val = q.type === 'bool' ? !q.flagInverts : String(flags[q.flag]);
    } else if (!yes) {
      if (q.type === 'bool') {
        const a = (await rl.question(`? ${q.prompt} ${cur ? 'Y/n' : 'y/N'} `)).trim().toLowerCase();
        val = a ? a === 'y' : cur;
      } else {
        const a = (await rl.question(`? ${q.prompt} (${cur || ''}) `)).trim();
        val = a || cur;
      }
    }
    cfg[q.key] = val;
  }
  if (rl) rl.close();
  return cfg;
}

function ensurePrepareScript(root) {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(read(pkgPath));
  pkg.scripts ||= {};
  if (!(pkg.scripts.prepare || '').includes('husky')) {
    pkg.scripts.prepare = pkg.scripts.prepare ? `${pkg.scripts.prepare} && husky` : 'husky';
    write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

function writeTarget(root, t, rendered, status) {
  const p = join(root, t.dest);
  if (t.kind === 'hook') {
    if (!existsSync(p)) write(p, rendered);
    else if (status === 'MERGE') write(p, `${read(p).replace(/\s*$/, '')}\n\n${extractBlock(rendered)}\n`);
    else if (status === 'UPDATE') {
      const cur = read(p).split('\n');
      const s = cur.findIndex((l) => l.startsWith(MARK_START));
      const e = cur.findIndex((l, i) => i >= s && l.trim() === MARK_END);
      cur.splice(s, e - s + 1, extractBlock(rendered));
      write(p, cur.join('\n'));
    }
    chmodSync(p, 0o755);
    return;
  }
  if (status === 'FOREIGN' && existsSync(p)) {
    writeFileSync(`${p}.link-bak`, read(p));
    c.warn(`백업: ${t.dest}.link-bak`);
  }
  write(p, rendered);
  if (t.exec) chmodSync(p, 0o755);
}

async function cmdInit(root, mod, args) {
  const { manifest, files } = mod;
  const flags = args.flags;
  const force = !!flags.force;
  const yes = !!flags.yes;
  const noInstall = !!flags['no-install'];

  const cfg = await resolveConfig(manifest, args, readConfig(root, manifest.name));
  const pm = resolvePM(cfg, root);

  const code = cmdCheck(root, mod, cfg, pm, false);
  if (code === 2) {
    c.err('하드 충돌 — 중단.');
    return 2;
  }
  if (code === 1 && yes && !force) {
    c.err('충돌 존재 — --force 없이 비대화형에서는 중단.');
    return 1;
  }
  if (flags['dry-run']) {
    c.info('--dry-run: 변경 없이 종료');
    return 0;
  }

  write(join(root, configRel(manifest.name)), `${JSON.stringify(cfg, null, 2)}\n`);
  c.ok(configRel(manifest.name));

  ensurePrepareScript(root);
  if (!noInstall && manifest.deps?.length) {
    c.info(`deps 설치: ${installCmd(pm, manifest.deps)}`);
    execSync(installCmd(pm, manifest.deps), { cwd: root, stdio: 'inherit' });
    if (manifest.husky) {
      c.info('husky 활성화');
      execSync(`${execPrefix(pm)} husky`, { cwd: root, stdio: 'inherit' });
    }
  } else if (noInstall) c.warn('--no-install: deps/husky 생략 (파일만)');

  for (const t of activeTargets(manifest, cfg)) {
    const rendered = render(t, files, cfg, pm);
    const status = classify(root, t, rendered);
    if (status === 'IDENTICAL') {
      c.ok(`${t.dest} (변경 없음)`);
      continue;
    }
    if (status === 'FOREIGN' && !force) {
      c.warn(`${t.dest} — 외부 내용, 스킵 (--force 로 백업+덮어쓰기)`);
      continue;
    }
    writeTarget(root, t, rendered, status);
    c.ok(`${t.dest} (${status})`);
  }
  c.ok(`완료 — ${manifest.name} 모듈 설치됨.`);
  return 0;
}

function cmdDoctor(root, mod, cfg, pm) {
  const { manifest, files } = mod;
  c.info(`claude-rules v${VERSION} · 모듈 ${manifest.name}`);
  let issues = 0;
  if (manifest.husky) {
    const competing = hookManagerConflict(root);
    if (competing.length) {
      c.err(`훅 매니저 충돌: ${competing.join(', ')}`);
      issues++;
    }
    let hp = '';
    try {
      hp = execSync('git config --get core.hooksPath', { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch {}
    if (hp.startsWith('.husky')) c.ok(`hooks 활성 (${hp})`);
    else {
      c.warn('hooks 비활성 — init 또는 husky 설정 필요');
      issues++;
    }
  }
  for (const t of activeTargets(manifest, cfg)) {
    const status = classify(root, t, render(t, files, cfg, pm));
    if (status === 'IDENTICAL') c.ok(t.dest);
    else {
      c.warn(`${t.dest} — ${status === 'CREATE' ? '없음(미설치)' : `${status}(드리프트)`}`);
      issues++;
    }
  }
  if (issues) c.warn(`이슈 ${issues}건 — 'claude-rules ${manifest.name} update' 로 복구 가능`);
  else c.ok('모두 정상');
  return issues ? 1 : 0;
}

function cmdUpdate(root, mod, cfg, pm) {
  const { manifest, files } = mod;
  for (const t of activeTargets(manifest, cfg)) {
    const rendered = render(t, files, cfg, pm);
    const status = classify(root, t, rendered);
    if (status === 'IDENTICAL') continue;
    if (status === 'FOREIGN') {
      c.warn(`${t.dest} — 외부 내용, 건너뜀(수동 확인)`);
      continue;
    }
    writeTarget(root, t, rendered, status);
    c.ok(`${t.dest} (${status})`);
  }
  c.ok('update 완료');
  return 0;
}

function cmdRemove(root, mod) {
  const { manifest } = mod;
  for (const t of manifest.targets) {
    const p = join(root, t.dest);
    if (!existsSync(p)) continue;
    if (t.kind === 'hook') {
      const cur = read(p).split('\n');
      const s = cur.findIndex((l) => l.startsWith(MARK_START));
      if (s === -1) {
        c.warn(`skip ${t.dest} (관리 블록 없음)`);
        continue;
      }
      const e = cur.findIndex((l, i) => i >= s && l.trim() === MARK_END);
      cur.splice(s, e - s + 1);
      const rest = cur.join('\n').trim();
      if (rest && rest !== '#!/usr/bin/env sh') {
        write(p, `${rest}\n`);
        c.ok(`removed block ${t.dest}`);
      } else {
        rmSync(p);
        c.ok(`removed ${t.dest}`);
      }
    } else if (read(p).includes(SENTINEL)) {
      rmSync(p);
      c.ok(`removed ${t.dest}`);
    } else c.warn(`skip ${t.dest} (외부 내용 — 보존)`);
  }
  const cfgp = join(root, configRel(manifest.name));
  if (existsSync(cfgp)) {
    rmSync(cfgp);
    c.ok(`removed ${configRel(manifest.name)}`);
  }
  c.ok('제거 완료 (deps/husky는 수동 정리)');
  return 0;
}

const HELP = `claude-rules v${VERSION}

  claude-rules <module> init      룰셋 설치 (대화형)
  claude-rules <module> check     설치 전 충돌 점검 (exit 0/1/2)
  claude-rules <module> doctor    설치 상태 점검
  claude-rules <module> update    표준 파일 최신화 (.claude-rules/<module>.json 보존)
  claude-rules <module> remove    설치물 제거
  claude-rules list               사용 가능한 모듈
  claude-rules self-update        CLI 최신 재설치 안내

모듈: ${Object.keys(MODULES).join(', ')}
옵션: --yes --force --dry-run --no-install --dir <path>  (+ 모듈별 플래그)`;

function listModules() {
  c.plain('모듈:');
  for (const [name, m] of Object.entries(MODULES)) c.plain(`  ${name.padEnd(10)} ${m.manifest.description || ''}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const first = args._[0];
  const root = resolve(args.flags.dir && args.flags.dir !== true ? String(args.flags.dir) : process.cwd());

  if (!first || first === 'help' || args.flags.help) return c.plain(HELP);
  if (first === 'version' || args.flags.version) return c.plain(VERSION);
  if (first === 'list') return listModules();
  if (first === 'self-update')
    return c.info(`재설치: curl -fsSL https://github.com/${REPO}/releases/latest/download/install.mjs | node`);

  const mod = MODULES[first];
  if (!mod) {
    c.err(`알 수 없는 모듈: ${first}`);
    listModules();
    process.exit(1);
  }
  const cmd = args._[1] || 'init';
  const cfg = readConfig(root, first) || defaults(mod.manifest);
  const pm = resolvePM(cfg, root);

  let code = 0;
  switch (cmd) {
    case 'init':
      code = await cmdInit(root, mod, args);
      break;
    case 'check':
      code = cmdCheck(root, mod, cfg, pm, false);
      break;
    case 'doctor':
      code = cmdDoctor(root, mod, cfg, pm);
      break;
    case 'update':
      code = cmdUpdate(root, mod, cfg, pm);
      break;
    case 'remove':
      code = cmdRemove(root, mod);
      break;
    default:
      c.err(`알 수 없는 명령: ${cmd}`);
      c.plain(HELP);
      code = 1;
  }
  process.exit(code);
}

main().catch((e) => {
  c.err(e.message);
  process.exit(1);
});
