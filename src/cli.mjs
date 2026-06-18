#!/usr/bin/env node
// ccx v2 — pack 단위 설치 (core→js→web/app), requires 자동 동반, 공유 config, apply.
//   ccx <pack> <init|check|doctor|update|remove>   ·   ccx apply   ·   ccx list
// 빌드 시 build.mjs 가 아래 placeholder 를 CATALOG 로 치환.
import { execFileSync, execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const CATALOG = __CATALOG__; // { pack: { meta:{name,description,requires,concern}, modules:{mod:{manifest,files}} } }
const VERSION = '__VERSION__';
const REPO = 'imDangerous/claude-code-extensions';

const MARK_START = '# >>> ccx';
const MARK_END = '# <<< ccx <<<';
const SENTINEL = 'Managed by ccx';
const CONFIG = join('.claude', 'extends', 'config.json');
const CLAUDE = 'CLAUDE.md';
const CM_START = '<!-- ccx:managed:start -->';
const CM_END = '<!-- ccx:managed:end -->';

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
const eol = (s) => s.replace(/\r\n/g, '\n');

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const n = argv[i + 1];
      if (n && !n.startsWith('--')) { out.flags[k] = n; i++; } else out.flags[k] = true;
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
const installCmd = (pm, d) => ({ pnpm: `pnpm add -D ${d.join(' ')}`, npm: `npm install -D ${d.join(' ')}`, yarn: `yarn add -D ${d.join(' ')}`, bun: `bun add -d ${d.join(' ')}` })[pm];
const ciInstall = (pm) => ({ pnpm: 'pnpm install --frozen-lockfile --ignore-scripts', npm: 'npm ci --ignore-scripts', yarn: 'yarn install --frozen-lockfile --ignore-scripts', bun: 'bun install --frozen-lockfile --ignore-scripts' })[pm];
const execPrefix = (pm) => ({ pnpm: 'pnpm exec', npm: 'npm exec', yarn: 'yarn', bun: 'bunx' })[pm];

// ── pack/config ───────────────────────────────────────────────────
function resolvePacks(name, seen = new Set(), order = []) {
  if (seen.has(name)) return order;
  if (!CATALOG[name]) throw new Error(`알 수 없는 pack: ${name}`);
  seen.add(name);
  for (const dep of CATALOG[name].meta.requires || []) resolvePacks(dep, seen, order);
  order.push(name);
  return order;
}
const modulesOf = (pack) => Object.entries(CATALOG[pack].modules); // [[name, {manifest,files}]]
function unionQuestions(packs) {
  const seen = new Set(), qs = [];
  for (const pk of packs) for (const [, m] of modulesOf(pk)) for (const q of m.manifest.questions || []) {
    if (seen.has(q.key)) continue;
    seen.add(q.key); qs.push(q);
  }
  return qs;
}
function readConfig(root) {
  const p = join(root, CONFIG);
  if (!existsSync(p)) return null;
  try { return JSON.parse(read(p)); } catch { return null; }
}
const resolvePM = (cfg, root) => (cfg.packageManager && cfg.packageManager !== 'auto' ? cfg.packageManager : detectPM(root));

// ── render / classify / write (id = pack/module) ──────────────────
function render(t, files, cfg, pm, id) {
  let s = files[t.src].replaceAll('__CCX_ID__', id);
  if (t.placeholders) for (const [ph, v] of Object.entries(t.placeholders)) s = s.replaceAll(ph, v === '@ciInstall' ? ciInstall(pm) : v);
  if (t.blocks) for (const b of t.blocks) {
    if (cfg[b.enabledIf]) continue;
    const L = s.split('\n');
    const st = L.findIndex((l) => l.includes(`ccx: ${b.name}`));
    const en = L.findIndex((l, i) => i > st && l.trim() === MARK_END);
    if (st !== -1 && en !== -1) L.splice(st, en - st + 1);
    s = L.join('\n');
  }
  return s;
}
function findBlock(lines, id) {
  const s = lines.findIndex((l) => l.startsWith(MARK_START) && l.includes(`ccx:${id}`));
  if (s === -1) return [-1, -1];
  return [s, lines.findIndex((l, i) => i >= s && l.trim() === MARK_END)];
}
function extractBlock(content, id) {
  const L = eol(content).split('\n');
  const [s, e] = findBlock(L, id);
  return s === -1 || e === -1 ? null : L.slice(s, e + 1).join('\n');
}
function classify(root, t, rendered, id) {
  const p = join(root, t.dest);
  if (!existsSync(p)) return 'CREATE';
  if (t.createOnly) return 'KEEP';
  const cur = eol(read(p)), ren = eol(rendered);
  if (t.kind === 'hook') {
    const mine = extractBlock(cur, id);
    if (mine !== null) return mine === extractBlock(ren, id) ? 'IDENTICAL' : 'UPDATE';
    return 'MERGE';
  }
  if (sha(cur) === sha(ren)) return 'IDENTICAL';
  if (cur.includes(SENTINEL)) return 'UPDATE';
  return 'FOREIGN';
}
const activeTargets = (mf, cfg) => mf.targets.filter((t) => !t.enabledIf || cfg[t.enabledIf]);
function writeTarget(root, t, rendered, status, id) {
  const p = join(root, t.dest);
  if (t.kind === 'hook') {
    if (!existsSync(p)) write(p, rendered);
    else if (status === 'MERGE') write(p, `${read(p).replace(/\s*$/, '')}\n\n${extractBlock(rendered, id)}\n`);
    else if (status === 'UPDATE') {
      const cur = read(p).split('\n');
      const [s, e] = findBlock(cur, id);
      cur.splice(s, e - s + 1, extractBlock(rendered, id));
      write(p, cur.join('\n'));
    }
    chmodSync(p, 0o755);
    return;
  }
  if (status === 'FOREIGN' && existsSync(p)) { writeFileSync(`${p}.ccx-bak`, read(p)); c.warn(`백업: ${t.dest}.ccx-bak`); }
  write(p, rendered);
  if (t.exec) chmodSync(p, 0o755);
}
function hookConflict(root) {
  let hp = '';
  try { hp = execSync('git config --get core.hooksPath', { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); } catch {}
  const x = [];
  if (hp && !hp.startsWith('.husky')) x.push(`core.hooksPath=${hp}`);
  if (existsSync(join(root, 'lefthook.yml'))) x.push('lefthook');
  if (existsSync(join(root, '.pre-commit-config.yaml'))) x.push('pre-commit');
  return x;
}
function isIgnored(root, rel) {
  try { execFileSync('git', ['check-ignore', rel], { cwd: root, stdio: ['pipe', 'pipe', 'ignore'] }); return true; } catch { return false; }
}

// ── questions ─────────────────────────────────────────────────────
async function resolveConfig(questions, args, existing) {
  const f = args.flags, yes = !!f.yes, cfg = {};
  let rl;
  if (!yes) rl = createInterface({ input: process.stdin, output: process.stdout });
  for (const q of questions) {
    const cur = existing && q.key in existing ? existing[q.key] : q.default;
    let v = cur;
    if (q.flag && q.flag in f) v = q.type === 'bool' ? !q.flagInverts : String(f[q.flag]);
    else if (!yes) {
      if (q.type === 'bool') { const a = (await rl.question(`? ${q.prompt} ${cur ? 'Y/n' : 'y/N'} `)).trim().toLowerCase(); v = a ? a === 'y' : cur; }
      else { const a = (await rl.question(`? ${q.prompt} (${cur || ''}) `)).trim(); v = a || cur; }
    }
    cfg[q.key] = v;
  }
  if (rl) rl.close();
  return cfg;
}
function ensurePrepare(root) {
  const pp = join(root, 'package.json');
  if (!existsSync(pp)) return;
  const pkg = JSON.parse(read(pp));
  pkg.scripts ||= {};
  if (!(pkg.scripts.prepare || '').includes('husky')) { pkg.scripts.prepare = pkg.scripts.prepare ? `${pkg.scripts.prepare} && husky` : 'husky'; write(pp, `${JSON.stringify(pkg, null, 2)}\n`); }
}

// ── commands ──────────────────────────────────────────────────────
function eachModule(packs, only, targetPack) {
  const out = [];
  for (const pk of packs) for (const [mn, m] of modulesOf(pk)) {
    if (only && pk === targetPack && !only.includes(mn)) continue;
    out.push({ pk, mn, m, id: `${pk}/${mn}` });
  }
  return out;
}

function checkSet(root, list, cfg, pm, quiet) {
  let conflicts = 0, hard = 0;
  if (list.some(({ m }) => m.manifest.husky) && hookConflict(root).length) { c.err(`훅 매니저 충돌: ${hookConflict(root).join(', ')}`); hard++; }
  for (const { m, id } of list) for (const t of activeTargets(m.manifest, cfg)) {
    const st = classify(root, t, render(t, m.files, cfg, pm, id), id);
    const line = `${t.dest.padEnd(46)} ${st}`;
    if (st === 'FOREIGN') { c.err(`${line} — 외부 내용`); conflicts++; }
    else if (st === 'MERGE') c.warn(`${line} — 관리 블록 추가`);
    else if (st === 'UPDATE') c.warn(`${line} — 갱신 예정`);
    else if (!quiet) c.ok(line);
  }
  if (!quiet) c.plain(`요약: 충돌 ${conflicts} · 하드충돌 ${hard}`);
  return hard ? 2 : conflicts ? 1 : 0;
}

async function cmdInit(root, packName, args) {
  const packs = resolvePacks(packName);
  c.info(`의존성 해소: ${packs.join(' → ')}`);
  const only = args.flags.only ? String(args.flags.only).split(',') : null;
  const list = eachModule(packs, only, packName);
  const cfg = await resolveConfig(unionQuestions(packs), args, readConfig(root));
  const pm = resolvePM(cfg, root);

  const code = checkSet(root, list, cfg, pm, false);
  if (code === 2) { c.err('하드 충돌 — 중단.'); return 2; }
  if (code === 1 && args.flags.yes && !args.flags.force) { c.err('충돌 — --force 없이 비대화형 중단.'); return 1; }
  if (args.flags['dry-run']) { c.info('--dry-run: 종료'); return 0; }

  if (isIgnored(root, CONFIG)) c.warn(`.claude/ 가 gitignore — '!.claude/extends/' 권장`);
  write(join(root, CONFIG), `${JSON.stringify(cfg, null, 2)}\n`);
  c.ok(CONFIG);

  ensurePrepare(root);
  const deps = [...new Set(list.flatMap(({ m }) => m.manifest.deps || []))];
  const needHusky = list.some(({ m }) => m.manifest.husky);
  if (!args.flags['no-install'] && deps.length) {
    c.info(`deps: ${installCmd(pm, deps)}`);
    execSync(installCmd(pm, deps), { cwd: root, stdio: 'inherit' });
    if (needHusky) { c.info('husky'); execSync(`${execPrefix(pm)} husky`, { cwd: root, stdio: 'inherit' }); }
  } else if (args.flags['no-install']) c.warn('--no-install: deps/husky 생략');

  for (const { m, id, pk } of list) for (const t of activeTargets(m.manifest, cfg)) {
    const r = render(t, m.files, cfg, pm, id);
    const st = classify(root, t, r, id);
    if (st === 'IDENTICAL' || st === 'KEEP') continue;
    if (st === 'FOREIGN' && !args.flags.force) { c.warn(`${t.dest} — 외부 내용 스킵(--force)`); continue; }
    writeTarget(root, t, r, st, id);
    c.ok(`${t.dest}  (${pk})`);
  }
  c.ok(`완료 — ${packs.join('+')} 설치`);
  c.info('룰을 CLAUDE.md에 연결: `ccx apply`');
  return 0;
}

function cmdApply(root) {
  const rd = join(root, '.claude', 'rules');
  const docs = [];
  if (existsSync(rd)) for (const f of readdirSync(rd).sort()) {
    if (!f.endsWith('.md')) continue;
    if (read(join(rd, f)).includes(SENTINEL)) docs.push(`@.claude/rules/${f}`);
  }
  const block = [CM_START, '## AI 표준 (ccx 관리 — 직접 수정 금지. `ccx apply`로 갱신)', ...docs, CM_END].join('\n');
  const cp = join(root, CLAUDE);
  let content = existsSync(cp) ? read(cp) : `# ${basename(root)}\n`;
  if (content.includes(CM_START)) {
    const L = content.split('\n');
    const s = L.indexOf(CM_START), e = L.indexOf(CM_END);
    L.splice(s, e - s + 1, block);
    content = L.join('\n');
  } else content = `${block}\n\n${content}`;
  write(cp, content);
  c.ok(`CLAUDE.md 갱신 — 룰 ${docs.length}개 @import 주입`);
  return 0;
}

function cmdGeneric(root, packName, cmd, args) {
  const packs = resolvePacks(packName);
  const only = args.flags.only ? String(args.flags.only).split(',') : null;
  const fullList = eachModule(packs, only, packName); // check/doctor: 의존(core/js) 포함 — 건강 오판 방지
  const targetList = eachModule([packName], only, packName); // update/remove: 대상 pack만
  const cfg = readConfig(root) || Object.fromEntries(unionQuestions(packs).map((q) => [q.key, q.default]));
  const pm = resolvePM(cfg, root);
  if (cmd === 'check') return checkSet(root, fullList, cfg, pm, false);
  if (cmd === 'doctor') {
    let issues = 0;
    for (const { m, id } of fullList) for (const t of activeTargets(m.manifest, cfg)) {
      const st = classify(root, t, render(t, m.files, cfg, pm, id), id);
      if (st === 'IDENTICAL' || st === 'KEEP') c.ok(t.dest);
      else { c.warn(`${t.dest} — ${st === 'CREATE' ? '없음' : st}`); issues++; }
    }
    c.plain(issues ? `이슈 ${issues}건 — 'ccx ${packName} update'` : '모두 정상');
    return issues ? 1 : 0;
  }
  if (cmd === 'update') {
    for (const { m, id, pk } of targetList) for (const t of activeTargets(m.manifest, cfg)) {
      const r = render(t, m.files, cfg, pm, id), st = classify(root, t, r, id);
      if (st === 'IDENTICAL' || st === 'KEEP') continue;
      if (st === 'FOREIGN') { c.warn(`${t.dest} — 외부 내용 스킵`); continue; }
      writeTarget(root, t, r, st, id); c.ok(`${t.dest} (${pk})`);
    }
    c.ok('update 완료'); return 0;
  }
  if (cmd === 'remove') {
    for (const { m, id } of targetList) for (const t of m.manifest.targets) {
      const p = join(root, t.dest);
      if (!existsSync(p)) continue;
      if (t.kind === 'hook') {
        const cur = read(p).split('\n'); const [s, e] = findBlock(cur, id);
        if (s === -1) { c.warn(`skip ${t.dest}`); continue; }
        cur.splice(s, e - s + 1);
        const rest = cur.join('\n').trim();
        const other = cur.some((l) => l.startsWith(MARK_START));
        if (rest && (other || rest !== '#!/usr/bin/env sh')) { write(p, `${rest}\n`); c.ok(`removed block ${t.dest}`); }
        else { rmSync(p); c.ok(`removed ${t.dest}`); }
      } else if (read(p).includes(SENTINEL)) { rmSync(p); c.ok(`removed ${t.dest}`); }
      else c.warn(`skip ${t.dest} (외부)`);
    }
    c.ok('remove 완료'); return 0;
  }
}

const HELP = `ccx v${VERSION}  (claude-code-extensions)

  ccx <pack> init       팩 설치 (requires 자동 동반: ${Object.keys(CATALOG).join('/')})
  ccx <pack> check|doctor|update|remove   (대상 팩 모듈)
  ccx apply             설치된 룰을 CLAUDE.md 관리 블록에 @import
  ccx list              팩/모듈 목록

옵션: --yes --force --dry-run --no-install --dir <path> --only <m1,m2>  (+ 모듈 플래그)`;

function cmdList() {
  c.plain('packs:');
  for (const [pk, p] of Object.entries(CATALOG)) {
    const req = p.meta.requires?.length ? ` (requires: ${p.meta.requires.join(',')})` : '';
    c.plain(`  ${pk.padEnd(8)}${req}  ${p.meta.description || ''}`);
    c.plain(`    modules: ${Object.keys(p.modules).join(', ')}`);
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const first = a._[0];
  const root = resolve(a.flags.dir && a.flags.dir !== true ? String(a.flags.dir) : process.cwd());
  if (!first || first === 'help' || a.flags.help) return c.plain(HELP);
  if (first === 'version' || a.flags.version) return c.plain(VERSION);
  if (first === 'list') return cmdList();
  if (first === 'apply') return process.exit(cmdApply(root));
  if (first === 'self-update') return c.info(`curl -fsSL https://github.com/${REPO}/releases/latest/download/install.mjs | node`);
  if (!CATALOG[first]) { c.err(`알 수 없는 pack: ${first}`); cmdList(); process.exit(1); }
  const cmd = a._[1] || 'init';
  let code = 0;
  if (cmd === 'init') code = await cmdInit(root, first, a);
  else if (['check', 'doctor', 'update', 'remove'].includes(cmd)) code = cmdGeneric(root, first, cmd, a);
  else { c.err(`알 수 없는 명령: ${cmd}`); c.plain(HELP); code = 1; }
  process.exit(code);
}
main().catch((e) => { c.err(e.message); process.exit(1); });
