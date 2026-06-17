#!/usr/bin/env node
// link-rules-git — git 커밋/PR 표준 설치/관리 CLI.
// 빌드 시 build.mjs 가 아래 placeholder 를 {relpath: content} 로 치환한다.
import { execSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const TEMPLATES = __TEMPLATES__;
const VERSION = '__VERSION__';
const REPO = 'imDangerous/rules-git';

const MARK_START = '# >>> link-rules-git';
const MARK_END = '# <<< link-rules-git <<<';
const SENTINEL = 'Managed by link-rules-git';
const CONFIG_REL = join('.link', 'rules-git.json');

const DEPS = ['@commitlint/cli', '@commitlint/config-conventional', 'husky'];

const TARGETS = [
  { tpl: 'scripts/git/gitmoji-map.cjs', dest: 'scripts/git/gitmoji-map.cjs', kind: 'static' },
  { tpl: 'scripts/git/gitmoji-commit.cjs', dest: 'scripts/git/gitmoji-commit.cjs', kind: 'static', exec: true },
  { tpl: 'commitlint.config.cjs', dest: 'commitlint.config.cjs', kind: 'static' },
  { tpl: 'husky/prepare-commit-msg', dest: '.husky/prepare-commit-msg', kind: 'hook' },
  { tpl: 'husky/commit-msg', dest: '.husky/commit-msg', kind: 'hook' },
  { tpl: 'workflows/commit-standards.yml', dest: '.github/workflows/commit-standards.yml', kind: 'workflow' },
  { tpl: 'rules/git.md', dest: '.claude/rules/git.md', kind: 'doc' },
];

// ── 출력 ──────────────────────────────────────────────────────────
const c = {
  ok: (m) => console.log(`\x1b[32m[✓]\x1b[0m ${m}`),
  warn: (m) => console.log(`\x1b[33m[⚠]\x1b[0m ${m}`),
  err: (m) => console.error(`\x1b[31m[✗]\x1b[0m ${m}`),
  info: (m) => console.log(`\x1b[36m[i]\x1b[0m ${m}`),
  plain: (m) => console.log(m),
};

// ── 유틸 ──────────────────────────────────────────────────────────
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

const pmCmds = (pm) => ({
  add: {
    pnpm: `pnpm add -D ${DEPS.join(' ')}`,
    npm: `npm install -D ${DEPS.join(' ')}`,
    yarn: `yarn add -D ${DEPS.join(' ')}`,
    bun: `bun add -d ${DEPS.join(' ')}`,
  }[pm],
  ciInstall: {
    pnpm: 'pnpm install --frozen-lockfile',
    npm: 'npm ci',
    yarn: 'yarn install --frozen-lockfile',
    bun: 'bun install --frozen-lockfile',
  }[pm],
  exec: { pnpm: 'pnpm exec', npm: 'npm exec', yarn: 'yarn', bun: 'bunx' }[pm],
});

// 워크플로 렌더링: install cmd 치환 + 옵션 job strip + prTitle 여부
function renderWorkflow(tpl, cfg, pm) {
  let s = tpl.replaceAll('__INSTALL_CMD__', pmCmds(pm).ciInstall);
  if (!cfg.commitMsgCiCheck) {
    // commit-messages job 블록 제거
    const lines = s.split('\n');
    const start = lines.findIndex((l) => l.includes('commit-messages (optional)'));
    const end = lines.findIndex((l, i) => i > start && l.trim() === MARK_END);
    if (start !== -1 && end !== -1) lines.splice(start, end - start + 1);
    s = lines.join('\n');
  }
  return s;
}

// 정적 파일 렌더(치환 없음)
const renderStatic = (tpl) => tpl;

function renderTarget(t, cfg, pm) {
  if (t.kind === 'workflow') return renderWorkflow(TEMPLATES[t.tpl], cfg, pm);
  return TEMPLATES[t.tpl];
}

// 훅: managed block 추출
function extractBlock(content) {
  const lines = content.split('\n');
  const s = lines.findIndex((l) => l.startsWith(MARK_START));
  const e = lines.findIndex((l, i) => i >= s && l.trim() === MARK_END);
  if (s === -1 || e === -1) return null;
  return lines.slice(s, e + 1).join('\n');
}

// ── 분류(check) ───────────────────────────────────────────────────
// 반환: CREATE | IDENTICAL | UPDATE | MERGE | FOREIGN
function classify(root, t, rendered) {
  const p = join(root, t.dest);
  if (!existsSync(p)) return 'CREATE';
  const cur = read(p);
  if (t.kind === 'hook') {
    if (cur.includes(MARK_START)) {
      return extractBlock(cur) === extractBlock(rendered) ? 'IDENTICAL' : 'UPDATE';
    }
    return 'MERGE'; // 사용자 훅 존재 → 블록 추가(공존)
  }
  if (sha(cur) === sha(rendered)) return 'IDENTICAL';
  if (cur.includes(SENTINEL) || (t.kind === 'workflow' && cur.includes('Managed by link-rules-git')))
    return 'UPDATE';
  return 'FOREIGN';
}

function hookManagerConflict(root) {
  let hooksPath = '';
  try {
    hooksPath = execSync('git config --get core.hooksPath', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* unset */
  }
  const competing = [];
  if (hooksPath && !hooksPath.startsWith('.husky')) competing.push(`core.hooksPath=${hooksPath}`);
  if (existsSync(join(root, 'lefthook.yml')) || existsSync(join(root, '.lefthook.yml')))
    competing.push('lefthook');
  if (existsSync(join(root, '.pre-commit-config.yaml'))) competing.push('pre-commit framework');
  return competing;
}

function readConfig(root) {
  const p = join(root, CONFIG_REL);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(read(p));
  } catch {
    return null;
  }
}

// ── check ─────────────────────────────────────────────────────────
function cmdCheck(root, cfg, pm) {
  c.info(`대상: ${root}`);
  let conflicts = 0;
  let hard = 0;

  const competing = hookManagerConflict(root);
  if (competing.length) {
    c.err(`다른 훅 매니저와 충돌: ${competing.join(', ')} — git hooksPath는 하나만 가능`);
    hard++;
  }

  for (const t of TARGETS) {
    if (t.kind === 'workflow' && !cfg.prTitleCheck) continue;
    const status = classify(root, t, renderTarget(t, cfg, pm));
    const line = `${t.dest.padEnd(40)} ${status}`;
    if (status === 'FOREIGN') {
      c.err(`${line} — 외부 내용(백업 후 표준 채택 필요)`);
      conflicts++;
    } else if (status === 'MERGE') {
      c.warn(`${line} — 기존 훅에 관리 블록 추가(보존)`);
    } else if (status === 'UPDATE') {
      c.warn(`${line} — 옛 표준 → 갱신 예정`);
    } else {
      c.ok(line);
    }
  }
  c.plain(`요약: 충돌 ${conflicts} · 하드충돌 ${hard}`);
  return hard ? 2 : conflicts ? 1 : 0;
}

// ── init ──────────────────────────────────────────────────────────
async function cmdInit(root, args) {
  const flags = args.flags;
  const dryRun = !!flags['dry-run'];
  const force = !!flags.force;
  const yes = !!flags.yes;
  const noInstall = !!flags['no-install'];

  let cfg = readConfig(root) || {};
  const detectedPM = detectPM(root);

  if (yes) {
    cfg = {
      ticketPrefix: flags.ticket && flags.ticket !== true ? String(flags.ticket) : cfg.ticketPrefix || '',
      ticketRequired: 'ticket-required' in flags ? true : !!cfg.ticketRequired,
      packageManager: flags.pm && flags.pm !== true ? String(flags.pm) : cfg.packageManager || 'auto',
      prTitleCheck: 'no-pr-title' in flags ? false : cfg.prTitleCheck !== false,
      commitMsgCiCheck: 'commit-ci' in flags ? true : !!cfg.commitMsgCiCheck,
    };
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (q, def) => {
      const a = (await rl.question(`? ${q} ${def ? `(${def})` : ''} `)).trim();
      return a || def;
    };
    cfg.ticketPrefix = await ask('티켓 prefix (없으면 Enter)', cfg.ticketPrefix || '');
    cfg.ticketRequired =
      (await ask('티켓 필수? y/N', cfg.ticketRequired ? 'y' : 'n')).toLowerCase() === 'y';
    cfg.packageManager = await ask('패키지 매니저 (auto/pnpm/npm/yarn/bun)', cfg.packageManager || 'auto');
    cfg.prTitleCheck = (await ask('PR 제목 CI 켤까? Y/n', cfg.prTitleCheck === false ? 'n' : 'y')).toLowerCase() !== 'n';
    cfg.commitMsgCiCheck =
      (await ask('CI에서 커밋 메시지도 검사? y/N', cfg.commitMsgCiCheck ? 'y' : 'n')).toLowerCase() === 'y';
    rl.close();
  }

  const pm = cfg.packageManager && cfg.packageManager !== 'auto' ? cfg.packageManager : detectedPM;

  // preflight
  const code = cmdCheck(root, cfg, pm);
  if (code === 2) {
    c.err('하드 충돌 — 중단. 훅 매니저를 정리한 뒤 다시 실행하세요.');
    return 2;
  }
  if (code === 1 && !force && yes) {
    c.err('충돌 존재 — --force 없이 비대화형(--yes)에서는 외부 파일을 건드리지 않고 중단.');
    return 1;
  }

  if (dryRun) {
    c.info('--dry-run: 변경 없이 종료');
    return 0;
  }

  // 1) 설정 기록
  write(join(root, CONFIG_REL), `${JSON.stringify(cfg, null, 2)}\n`);
  c.ok(CONFIG_REL);

  // 2) deps + husky
  if (!noInstall) {
    ensurePrepareScript(root);
    c.info(`deps 설치: ${pmCmds(pm).add}`);
    execSync(pmCmds(pm).add, { cwd: root, stdio: 'inherit' });
    c.info('husky 활성화');
    execSync(`${pmCmds(pm).exec} husky`, { cwd: root, stdio: 'inherit' });
  } else {
    c.warn('--no-install: deps/husky 생략 (파일만 기록)');
    ensurePrepareScript(root);
  }

  // 3) 파일 기록
  for (const t of TARGETS) {
    if (t.kind === 'workflow' && !cfg.prTitleCheck) continue;
    const rendered = renderTarget(t, cfg, pm);
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

  c.ok('완료. 이제 `git commit` 시 자동 변환됩니다.');
  return 0;
}

function ensurePrepareScript(root) {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(read(pkgPath));
  pkg.scripts ||= {};
  if (pkg.scripts.prepare !== 'husky') {
    pkg.scripts.prepare = pkg.scripts.prepare ? `${pkg.scripts.prepare} && husky` : 'husky';
    write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

function backup(p) {
  const bak = `${p}.link-bak`;
  writeFileSync(bak, read(p));
  return bak;
}

function writeTarget(root, t, rendered, status) {
  const p = join(root, t.dest);
  if (t.kind === 'hook') {
    if (!existsSync(p)) {
      write(p, rendered);
    } else if (status === 'MERGE') {
      const block = extractBlock(rendered);
      write(p, `${read(p).replace(/\s*$/, '')}\n\n${block}\n`);
    } else if (status === 'UPDATE') {
      // 기존 마커 블록 교체
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
    const bak = backup(p);
    c.warn(`백업: ${bak}`);
  }
  write(p, rendered);
  if (t.exec) chmodSync(p, 0o755);
}

// ── doctor ────────────────────────────────────────────────────────
function cmdDoctor(root, cfg, pm) {
  c.info(`CLI v${VERSION}`);
  let issues = 0;

  const competing = hookManagerConflict(root);
  if (competing.length) {
    c.err(`훅 매니저 충돌: ${competing.join(', ')}`);
    issues++;
  }

  // husky active?
  let hooksPath = '';
  try {
    hooksPath = execSync('git config --get core.hooksPath', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {}
  if (hooksPath.startsWith('.husky')) c.ok(`hooks 활성 (${hooksPath})`);
  else {
    c.warn('hooks 비활성 — `link-rules-git init` 또는 husky 설정 필요');
    issues++;
  }

  for (const t of TARGETS) {
    if (t.kind === 'workflow' && !cfg.prTitleCheck) continue;
    const status = classify(root, t, renderTarget(t, cfg, pm));
    if (status === 'IDENTICAL') c.ok(t.dest);
    else if (status === 'CREATE') {
      c.warn(`${t.dest} — 없음(미설치)`);
      issues++;
    } else {
      c.warn(`${t.dest} — ${status}(드리프트)`);
      issues++;
    }
  }
  if (issues) c.warn(`이슈 ${issues}건 — 'link-rules-git update' 로 복구 가능`);
  else c.ok('모두 정상');
  return issues ? 1 : 0;
}

// ── update ────────────────────────────────────────────────────────
function cmdUpdate(root, cfg, pm) {
  for (const t of TARGETS) {
    if (t.kind === 'workflow' && !cfg.prTitleCheck) continue;
    const rendered = renderTarget(t, cfg, pm);
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

// ── remove ────────────────────────────────────────────────────────
function cmdRemove(root) {
  for (const t of TARGETS) {
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
    } else {
      c.warn(`skip ${t.dest} (외부 내용 — 보존)`);
    }
  }
  const cfgp = join(root, CONFIG_REL);
  if (existsSync(cfgp)) {
    rmSync(cfgp);
    c.ok(`removed ${CONFIG_REL}`);
  }
  c.ok('제거 완료 (deps/husky는 수동 정리)');
  return 0;
}

const HELP = `link-rules-git v${VERSION}

  link-rules-git init      커밋/PR 표준 설치 (대화형)
  link-rules-git check     설치 전 충돌 점검 (exit 0/1/2)
  link-rules-git doctor    설치 상태 점검
  link-rules-git update    표준 파일 최신화 (.link/rules-git.json 보존)
  link-rules-git remove    설치물 제거
  link-rules-git self-update   CLI 최신 재설치 안내

옵션: --yes --force --dry-run --no-install --dir <path>
      --ticket <PREFIX> --ticket-required --pm <pnpm|npm|yarn|bun>
      --no-pr-title --commit-ci`;

// ── main ──────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  const root = resolve(args.flags.dir && args.flags.dir !== true ? String(args.flags.dir) : process.cwd());

  if (!cmd || cmd === 'help' || args.flags.help) return c.plain(HELP);
  if (cmd === 'version' || args.flags.version) return c.plain(VERSION);

  const cfg = readConfig(root) || {
    ticketPrefix: '',
    ticketRequired: false,
    packageManager: 'auto',
    prTitleCheck: true,
    commitMsgCiCheck: false,
  };
  const pm = cfg.packageManager && cfg.packageManager !== 'auto' ? cfg.packageManager : detectPM(root);

  let code = 0;
  switch (cmd) {
    case 'init':
      code = await cmdInit(root, args);
      break;
    case 'check':
      code = cmdCheck(root, cfg, pm);
      break;
    case 'doctor':
      code = cmdDoctor(root, cfg, pm);
      break;
    case 'update':
      code = cmdUpdate(root, cfg, pm);
      break;
    case 'remove':
      code = cmdRemove(root);
      break;
    case 'self-update':
      c.info(`재설치: curl -fsSL https://github.com/${REPO}/releases/latest/download/install.mjs | node`);
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
