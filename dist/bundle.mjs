#!/usr/bin/env node
// ccx v2 — pack 단위 설치 (core→js→web/app), requires 자동 동반, 공유 config, apply.
//   ccx <pack> <init|check|doctor|update|remove>   ·   ccx apply   ·   ccx list
// 빌드 시 build.mjs 가 아래 placeholder 를 CATALOG 로 치환.
import { execFileSync, execSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const CATALOG = {"app":{"meta":{"name":"app","description":"RN 프레임워크 — Expo (baseline SDK 56)","requires":["js"],"concern":"frontend"},"modules":{"expo":{"manifest":{"name":"expo","deps":[],"husky":false,"questions":[],"targets":[{"src":"expo.md","dest":".claude/rules/expo.md","kind":"doc"}]},"files":{"expo.md":"<!-- Managed by ccx -->\n# Expo (React Native) — baseline SDK 56\n\n> ⚠️ **스캐폴드 스텁.** 현재는 규약 골격만. 실제 RN 룰·스킬(FSD scaffold·ui-developer·nativewind)은\n> RN 템플릿에서 추출·de-RN + SDK 54→56 갱신 후 채운다(미완).\n\n## baseline\n- **Expo (managed) 기본**, **SDK 56** 의존성에 맞춘다. 호환 라이브러리 우선.\n- baseline은 새 SDK 릴리스마다 bump(메타 재평가 루프).\n\n## 원칙 (RN 공통)\n- 모바일 퍼스트, 터치 타깃 ≥ 44px, SafeArea 처리.\n- 상태: 전역=Zustand, 서버=TanStack Query(또는 RN 표준).\n- 네이티브 의존성은 Expo SDK 56 호환 버전으로 고정.\n\n## TODO (추출 예정)\n- create-feature / create-screen (FSD scaffold, RN)\n- ui-developer / feature-builder 에이전트\n- nativewind 규칙\n"}}}},"core":{"meta":{"name":"core","description":"표준 베이스 — git·에이전트·QA·작업흐름 (전 스택 공통)","requires":[],"concern":null},"modules":{"agent-workflow":{"manifest":{"name":"agent-workflow","deps":[],"husky":false,"questions":[],"targets":[{"src":"agent-workflow.md","dest":".claude/rules/agent-workflow.md","kind":"doc"}]},"files":{"agent-workflow.md":"<!-- Managed by ccx -->\n# 에이전트 작업 흐름\n\n> AI 에이전트의 표준 작업 절차. 사람이 다시 지시하지 않아도 같은 품질로 재현되는 것이 목표.\n\n## DO\n1. **계획을 문서로** — 3파일 이상/다중 세션 작업은 `docs/plans/{날짜}-{slug}.md`에 먼저 저장.\n2. **가정을 먼저 명시** — 해석이 갈리면 구현 전 확인.\n3. **작업 단위 = 커밋 단위** — \"그 김에 고친\" 코드는 별도 커밋.\n4. **광범위 탐색은 서브에이전트에 위임** — 메인 컨텍스트는 단일 파일·문서·대화에 보존.\n5. **검증 후 종료** — lint·typecheck·test 통과해야 \"완료\".\n\n## DON'T\n1. 문서 갱신 없이 코드만 쌓지 않는다.\n2. 로컬 검증 없이 push·PR 하지 않는다(`--no-verify` 금지).\n3. 계획 없이 대규모 리팩터 시작하지 않는다(5파일↑ 사전 확인).\n4. \"작동한다\"를 실행 없이 선언하지 않는다.\n\n## 에스컬레이션\n변경이 계획의 2배↑ / 기존 테스트 3개↑ 수정 / 외부 API 불확실 / 보안·권한·개인정보 / 동일 증상 2회↑ 실패 → 자동 진행 말고 보고.\n"}},"git":{"manifest":{"name":"git","description":"Conventional Commits + gitmoji + optional ticket prefix (husky/commitlint/PR CI)","deps":["@commitlint/cli","@commitlint/config-conventional","husky"],"husky":true,"questions":[{"key":"ticketPrefix","type":"string","default":"","prompt":"티켓 prefix (없으면 Enter)","flag":"ticket","validate":"^[A-Za-z0-9]*$","validateHint":"영문/숫자만 (예: RP) — 정규식 메타문자 불가"},{"key":"ticketRequired","type":"bool","default":false,"prompt":"티켓 필수?","flag":"ticket-required"},{"key":"packageManager","type":"string","default":"auto","prompt":"패키지 매니저 (auto/pnpm/npm/yarn/bun)","flag":"pm"},{"key":"prTitleCheck","type":"bool","default":true,"prompt":"PR 제목 CI 켤까?","flag":"no-pr-title","flagInverts":true},{"key":"commitMsgCiCheck","type":"bool","default":false,"prompt":"CI에서 커밋 메시지도 검사?","flag":"commit-ci"}],"targets":[{"src":"scripts/git/gitmoji-map.cjs","dest":".claude/extends/core/git/gitmoji-map.cjs","kind":"static"},{"src":"scripts/git/gitmoji-commit.cjs","dest":".claude/extends/core/git/gitmoji-commit.cjs","kind":"static","exec":true},{"src":"commitlint.config.cjs","dest":"commitlint.config.cjs","kind":"static"},{"src":"husky/prepare-commit-msg","dest":".husky/prepare-commit-msg","kind":"hook"},{"src":"husky/commit-msg","dest":".husky/commit-msg","kind":"hook"},{"src":"workflows/commit-standards.yml","dest":".github/workflows/commit-standards.yml","kind":"static","enabledIf":"prTitleCheck","placeholders":{"__INSTALL_CMD__":"@ciInstall"},"blocks":[{"name":"commit-messages","enabledIf":"commitMsgCiCheck"}]},{"src":"rules/git.md","dest":".claude/rules/git.md","kind":"doc"}]},"files":{"commitlint.config.cjs":"// Managed by ccx. Do not edit — change .claude/extends/config.json instead.\n//\n// 표준 Conventional Commits 룰(config-conventional)을 상속하고,\n// 헤더 형식만 `[PREFIX-n] gitmoji 제목`으로 재정의한다.\nconst { EMOJIS, TICKET_PREFIX, TICKET_REQUIRED } = require('./.claude/extends/core/git/gitmoji-map.cjs');\n\nconst alt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|');\n\n// 티켓 prefix 설정 여부/필수 여부에 따라 헤더패턴 구성\nlet ticketPart = '';\nlet hasTicketGroup = false;\nif (TICKET_PREFIX) {\n  const group = `\\\\[(${TICKET_PREFIX}-\\\\d+)\\\\] `;\n  ticketPart = TICKET_REQUIRED ? group : `(?:${group})?`;\n  hasTicketGroup = true;\n}\n\nconst headerPattern = new RegExp(`^${ticketPart}(${alt}) (.+)$`, 'u');\nconst headerCorrespondence = hasTicketGroup\n  ? ['ticket', 'type', 'subject']\n  : ['type', 'subject'];\n\nmodule.exports = {\n  extends: ['@commitlint/config-conventional'],\n  parserPreset: { parserOpts: { headerPattern, headerCorrespondence } },\n  rules: {\n    'type-enum': [2, 'always', EMOJIS],\n    'type-case': [0], // 이모지는 대소문자 개념 없음\n  },\n};\n","husky/commit-msg":"#!/usr/bin/env sh\n# >>> ccx:__CCX_ID__ (managed: do not edit between markers) >>>\n./node_modules/.bin/commitlint --edit \"$1\"\n# <<< ccx <<<\n","husky/prepare-commit-msg":"#!/usr/bin/env sh\n# >>> ccx:__CCX_ID__ (managed: do not edit between markers) >>>\nnode .claude/extends/core/git/gitmoji-commit.cjs \"$1\" \"$2\"\n# <<< ccx <<<\n","rules/git.md":"<!-- Managed by ccx -->\n# Git 커밋/PR 규약 (ccx 관리)\n\n> 이 파일과 `scripts/git/*`, `commitlint.config.cjs`, `.husky/*`, 커밋 관련 워크플로는\n> **`ccx`이 관리**한다. 직접 수정하지 말 것 — 값은 `.claude/extends/config.json`을 바꾸고\n> `ccx rules git update` / `ccx rules git doctor`로 갱신·점검한다.\n\n## 커밋 메시지\n\n입력은 **표준 conventional `type: 제목`**으로만. 훅이 자동으로 `[<TICKET>-n] gitmoji 제목`으로 변환한다\n(티켓 prefix 미설정 시 `gitmoji 제목`).\n\n```\n입력:  feat: 로그인 화면 추가        → 변환:  ✨ 로그인 화면 추가\n티켓 prefix 설정 시(브랜치 …/ABC-12-…):  → [ABC-12] ✨ 로그인 화면 추가\n```\n\n## type → gitmoji (표준 11개)\n\n| type | gitmoji | | type | gitmoji |\n|------|---------|-|------|---------|\n| feat | ✨ | | test | ✅ |\n| fix | 🐛 | | build | 📦 |\n| refactor | ♻️ | | ci | 👷 |\n| perf | ⚡ | | chore | 🔧 |\n| style | 💄 | | revert | ⏪ |\n| docs | 📝 | | | |\n\n표준 밖 type/이모지는 commit-msg 훅에서 차단된다.\n\n## PR 제목\n\n커밋과 동일 형식 `[<TICKET>-n] gitmoji 제목`. CI(`commit-standards.yml`)가 같은 commitlint 규칙으로 강제.\n\n## 설정 (`.claude/extends/config.json`)\n\n```jsonc\n{ \"ticketPrefix\": \"\", \"ticketRequired\": false, \"packageManager\": \"auto\",\n  \"prTitleCheck\": true, \"commitMsgCiCheck\": false }\n```\n","scripts/git/gitmoji-commit.cjs":"#!/usr/bin/env node\n// Managed by ccx. Do not edit — change .claude/extends/config.json instead.\n//\n// prepare-commit-msg: `type: 제목`(conventional) → `[PREFIX-n] gitmoji 제목`.\n//   - ticketPrefix 설정 시: 헤더에 있으면 보존, 없으면 브랜치명에서 추출. 미설정 시 티켓 생략.\n//   - 이미 최종형식/merge/revert/squash 면 변환 안 함(idempotent).\n//\n// 이 훅은 \"표시용\" 변환만 한다. 어떤 오류(맵 로드 실패, 의존성 누락 등)로도\n// 커밋을 막지 않는다(fail-open) — 형식 검증은 commit-msg(commitlint)가 담당한다.\nconst fs = require('node:fs');\nconst { execSync } = require('node:child_process');\n\ntry {\n  const { GITMOJI, EMOJIS, TICKET_PREFIX } = require('./gitmoji-map.cjs');\n\n  const [msgPath, source] = process.argv.slice(2);\n  if (!msgPath) process.exit(0);\n  if (source === 'merge' || source === 'squash') process.exit(0);\n\n  const raw = fs.readFileSync(msgPath, 'utf8');\n  const lines = raw.split('\\n');\n  const i = lines.findIndex((l) => l.trim() && !l.startsWith('#'));\n  if (i === -1) process.exit(0);\n\n  const header = lines[i];\n  if (/^(Merge|Revert|fixup!|squash!|amend!)/.test(header)) process.exit(0);\n\n  const emojiAlt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('|');\n\n  let work = header;\n  let ticket = '';\n  if (TICKET_PREFIX) {\n    const headRe = new RegExp(`^\\\\[(${TICKET_PREFIX}-\\\\d+)\\\\]\\\\s+`, 'i');\n    const m = work.match(headRe);\n    if (m) {\n      ticket = `[${m[1].toUpperCase()}] `;\n      work = work.slice(m[0].length);\n    }\n  }\n\n  if (new RegExp(`^(?:${emojiAlt}) `, 'u').test(work)) process.exit(0);\n\n  const cm = work.match(/^(\\w+)(?:\\([^)]*\\))?!?:\\s+(.+)$/);\n  if (!cm) process.exit(0);\n  const [, type, subject] = cm;\n  const emoji = GITMOJI[type.toLowerCase()];\n  if (!emoji) process.exit(0);\n\n  if (TICKET_PREFIX && !ticket) {\n    try {\n      const branch = execSync('git symbolic-ref --short HEAD', {\n        encoding: 'utf8',\n        stdio: ['pipe', 'pipe', 'ignore'],\n      }).trim();\n      const t = branch.match(new RegExp(`${TICKET_PREFIX}-\\\\d+`, 'i'));\n      if (t) ticket = `[${t[0].toUpperCase()}] `;\n    } catch {\n      // 브랜치 확인 실패 시 티켓 없이 진행\n    }\n  }\n\n  lines[i] = `${ticket}${emoji} ${subject}`;\n  fs.writeFileSync(msgPath, lines.join('\\n'));\n} catch {\n  // 표시용 변환 실패는 커밋을 막지 않는다. 최종 형식은 commitlint(commit-msg)이 검증한다.\n  process.exit(0);\n}\n","scripts/git/gitmoji-map.cjs":"// Managed by ccx. Do not edit — change .claude/extends/config.json instead.\n//\n// 유효 커밋 타입의 SoT = @commitlint/config-conventional 표준 11개.\n// ticketPrefix / ticketRequired 는 .claude/extends/config.json 에서 런타임에 읽는다\n// (이 파일은 모든 프로젝트에서 바이트-동일).\nconst fs = require('node:fs');\nconst path = require('node:path');\n\nfunction loadConfig() {\n  try {\n    const p = path.resolve(process.cwd(), '.claude', 'extends', 'config.json');\n    return JSON.parse(fs.readFileSync(p, 'utf8'));\n  } catch {\n    return {};\n  }\n}\n\nconst conventional = require('@commitlint/config-conventional');\nconst cc = conventional.default || conventional;\nconst STANDARD_TYPES = cc.rules['type-enum'][2];\n\nconst EMOJI_BY_TYPE = {\n  feat: '✨',\n  fix: '🐛',\n  docs: '📝',\n  style: '💄',\n  refactor: '♻️',\n  perf: '⚡',\n  test: '✅',\n  build: '📦',\n  ci: '👷',\n  chore: '🔧',\n  revert: '⏪',\n};\n\nconst GITMOJI = {};\nfor (const type of STANDARD_TYPES) {\n  const emoji = EMOJI_BY_TYPE[type];\n  if (!emoji) {\n    throw new Error(\n      `gitmoji-map: no gitmoji for standard type '${type}'. Add it to EMOJI_BY_TYPE.`,\n    );\n  }\n  GITMOJI[type] = emoji;\n}\n\nconst EMOJIS = [...new Set(Object.values(GITMOJI))];\n\nconst cfg = loadConfig();\nconst TICKET_PREFIX = cfg.ticketPrefix || '';\nconst TICKET_REQUIRED = !!cfg.ticketRequired;\n\nmodule.exports = { GITMOJI, EMOJIS, STANDARD_TYPES, TICKET_PREFIX, TICKET_REQUIRED };\n","workflows/commit-standards.yml":"name: Commit Standards\n\n# Managed by ccx.\non:\n  pull_request:\n    types: [opened, edited, reopened, synchronize]\n\npermissions:\n  contents: read\n  pull-requests: read\n\njobs:\n  pr-title:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: __INSTALL_CMD__\n      - name: Lint PR title\n        env:\n          PR_TITLE: ${{ github.event.pull_request.title }}\n        run: printf '%s' \"$PR_TITLE\" | ./node_modules/.bin/commitlint\n  # >>> ccx: commit-messages (optional) >>>\n  commit-messages:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: __INSTALL_CMD__\n      - name: Lint commit messages in PR range\n        run: >-\n          ./node_modules/.bin/commitlint\n          --from=${{ github.event.pull_request.base.sha }}\n          --to=${{ github.event.pull_request.head.sha }}\n  # <<< ccx <<<\n"}},"orchestrate":{"manifest":{"name":"orchestrate","deps":[],"husky":false,"questions":[],"targets":[{"src":"SKILL.md","dest":".claude/skills/orchestrate/SKILL.md","kind":"doc"}]},"files":{"SKILL.md":"---\nname: orchestrate\ndescription: 장기 작업을 단계(phase)로 분해하고 Go/No-Go 게이트와 자기개선 루프로 감독한다. plan→build→QA→iterate.\n---\n<!-- Managed by ccx -->\n\n# orchestrate\n\n여러 에이전트/스킬을 **감독(supervisor)** 으로 묶어 장기 작업을 수행한다. 프레임워크 무관 — 구현 단계는 설치된 스택 pack(web/app/…)에 위임.\n\n## 파이프라인 (단계별 핸드오프)\n```\nplan → design → build(스택 pack) → QA(qa-reviewer) → [FAIL] fix(≤N) → [PASS] 다음 → ship\n```\n각 단계 산출물을 `_workspace/{phase}.md`에 저장 → 컨텍스트 리셋돼도 파일로 이어간다(Context Reset > Compaction).\n\n## 견고성 장치 (Anthropic harness 설계 원칙)\n1. **객관 게이트** — 단계 전환은 qa-reviewer의 Hard Threshold PASS일 때만.\n2. **유한 반복** — QA FAIL → 수정 → 재QA, 최대 N회 후 escalate.\n3. **능동 테스트** — 읽지 말고 실행(typecheck/lint/test/build).\n4. **지속 기억** — `_workspace/` 파일 핸드오프 + `pipeline-status.md`.\n5. **회의적 평가자** — qa-reviewer를 관대하지 않게(few-shot·skepticism).\n6. **메타 재평가** — 모델/SDK 릴리스마다 스캐폴딩 재평가·가지치기.\n\n## concern 연동\n설치된 framework pack의 `concern`(frontend/backend)에 따라 동원 에이전트 세트가 달라진다(FE: design/ui/a11y, BE: api/db/security).\n\n## 사용\n사용자 요청 → 단계로 분해 → 각 단계 에이전트/스킬 호출 → 게이트 통과 시 진행 → 막히면 보고.\n"}},"qa-reviewer":{"manifest":{"name":"qa-reviewer","deps":[],"husky":false,"questions":[],"targets":[{"src":"qa-reviewer.md","dest":".claude/agents/qa-reviewer.md","kind":"doc"}]},"files":{"qa-reviewer.md":"---\nname: qa-reviewer\ndescription: 변경분을 객관적 Hard Threshold로 검수한다. 하나라도 미달이면 FAIL. 주관 점수 금지.\ntools: Bash, Read, Grep, Glob\n---\n<!-- Managed by ccx -->\n\n# qa-reviewer\n\n코드/문서 변경을 **객관 pass/fail 기준(Hard Threshold)** 으로만 검수한다. \"대체로 좋아 보임\" 같은 관대한 판정 금지 — **명시적 회의주의**로 본다.\n\n## 원칙\n- **Hard Threshold**: 하나라도 임계 미달이면 전체 FAIL. 소프트 점수 없음.\n- **능동 테스트**: 읽지 말고 **실행**(typecheck/lint/test/build). 정적 분석만으로 통과 선언 금지.\n- **few-shot 회의주의**: AI 산출물을 기본 신뢰하지 않는다. 근거(명령 출력·라인)로만 판정.\n\n## 기본 Hard Threshold (프로젝트가 추가/조정)\n| 기준 | 임계 | 측정 |\n|------|------|------|\n| 타입 오류 | 0 | `typecheck` |\n| 린트 에러 | 0 | `lint` |\n| 테스트 실패 | 0 | `test` |\n| 빈 상태(empty) 미처리 | 0 | 코드 분석 |\n| 에러 무시(`catch {}`) | 0 | 코드 분석 |\n| PII/시크릿 로깅 | 0 | grep |\n\n## 출력\n- 각 기준: PASS / FAIL + 근거(명령 출력 또는 파일:라인).\n- 하나라도 FAIL → **전체 FAIL**, 수정 후 재검수(최대 N회, 초과 시 escalate).\n"}}}},"js":{"meta":{"name":"js","description":"JS/TS 공통 — 린터·포매터·타입 (web/app 의 언어 베이스)","requires":["core"],"concern":null},"modules":{"biome":{"manifest":{"name":"biome","deps":["@biomejs/biome"],"husky":false,"questions":[],"targets":[{"src":"biome.md","dest":".claude/rules/biome.md","kind":"doc"}]},"files":{"biome.md":"<!-- Managed by ccx -->\n# Biome (린트·포맷·import 정렬)\n\n> 린트·포맷의 단일 도구는 Biome. ESLint·Prettier 사용 금지.\n\n## DO\n1. `biome check --write`(lint+fix)·`biome format --write`를 단일 도구로.\n2. a11y 규칙(`a11y.recommended`) 활성.\n3. import 정렬도 Biome(`organizeImports`)로 일원화.\n4. CI/pre-commit은 lint-staged → `biome check --write` (변경 파일만).\n\n## DON'T\n1. ESLint·Prettier·`eslint-plugin-*` 추가 금지.\n2. `biome`+`eslint` 혼용 금지.\n3. Biome가 잡을 규칙을 커스텀 스크립트로 대체하지 않는다.\n\n## 메모\n- 스캔 제외: `node_modules`·빌드 산출·`.claude`·생성물.\n- 버전 업: `biome migrate --write`로 설정 자동 승격.\n- ccx 관리 루트 설정 파일은 Biome 스캔에서 제외(포매터 재포맷으로 인한 드리프트 방지).\n"}},"typescript":{"manifest":{"name":"typescript","deps":[],"husky":false,"questions":[],"targets":[{"src":"typescript.md","dest":".claude/rules/typescript.md","kind":"doc"}]},"files":{"typescript.md":"<!-- Managed by ccx -->\n# TypeScript\n\n> strict 기준 타입 규칙.\n\n## 타입\n- **strict 필수**(`strict: true`). **`any` 금지** — 모르면 `unknown` + 타입 가드.\n- **외부 경계 값 런타임 검증** — API 응답·폼·params (zod 등 도입 시 스키마).\n- **export 함수는 명시적 반환 타입**, 내부 헬퍼는 추론 허용.\n\n## import / export\n- 정렬: 프레임워크 → 외부 → `@/` → 상대 → type-only. `import type` 사용.\n- `@/` 경로 별칭, `../../..` 3단계↑ 금지.\n- **named export 기본** — `export default`는 프레임워크 요구 파일만.\n\n## 타입 정의\n- 객체=`interface`, 유니온/매핑=`type`. Boolean은 `is`/`has`/`should` 접두.\n"}}}},"web":{"meta":{"name":"web","description":"웹 프레임워크 — Next.js · Tailwind(v3 기본/v4 variant)","requires":["js"],"concern":"frontend"},"modules":{"nextjs":{"manifest":{"name":"nextjs","deps":[],"husky":false,"questions":[],"targets":[{"src":"nextjs.md","dest":".claude/rules/nextjs.md","kind":"doc"}]},"files":{"nextjs.md":"<!-- Managed by ccx -->\n# Next.js App Router\n\n> App Router 전용. Pages Router·SSR API 금지.\n\n## DO\n1. **Server Component 기본** — 인터랙션 필요 시에만 `'use client'`를 최하위에.\n2. 클라이언트 경계 최소화 — 클라이언트가 `children`으로 서버 컴포넌트를 받게.\n3. **mutation = Server Action**(`actions/`), Route Handler(`api/`)는 웹훅·외부 연동만.\n4. Server Action 입력 검증(zod 도입 시), `'use server'`는 신뢰 경계.\n5. `fetch` 캐시 정책 명시(`no-store`/`revalidate`/`tags`).\n6. `error.tsx`는 가장 구체적 segment에, 메타데이터는 `metadata`/`generateMetadata`.\n7. `next/image`·`next/font` 사용, page.tsx는 조합·레이아웃만.\n\n## DON'T\n1. Pages Router API(`getServerSideProps` 등)·`next/head` 금지.\n2. `app/`·`pages/` 혼용 금지.\n3. 서버 전용 코드 클라이언트 누수 금지(`server-only`).\n4. `NEXT_PUBLIC_*` 아닌 env 클라이언트 참조 금지.\n5. Route Handler를 mutation에 쓰지 않는다.\n\n> 프로젝트 고유 라우팅/도메인은 ccx 관리 밖 — 프로젝트 문서/CLAUDE.md에 둔다.\n"}},"tailwind":{"manifest":{"name":"tailwind","deps":[],"husky":false,"questions":[{"key":"tailwind","type":"string","default":"v3","prompt":"Tailwind 버전 (v3/v4)","flag":"tailwind"}],"targets":[{"src":"tailwind.md","dest":".claude/rules/tailwind.md","kind":"doc"}]},"files":{"tailwind.md":"<!-- Managed by ccx -->\n# Tailwind CSS (variant: v3 기본 / v4)\n\n> 버전은 `.claude/extends/config.json`의 `tailwind`(기본 `v3`). 레거시 브라우저/기기 호환이 필요하면 v3.\n\n## 공통\n- 클래스 병합은 `cn()`(clsx + tailwind-merge) 유틸을 둔다(예: `src/lib/cn.ts`).\n- **모바일 퍼스트** — 375px 기본, `min-width` 확장. `max-width` 쿼리 금지.\n- 의미 토큰은 설정(theme)이 SoT. `!important`·CSS-in-JS 금지.\n\n## v3 (기본)\n- `tailwind.config.{js,ts}` + `content` 경로. PostCSS/Autoprefixer.\n- Biome가 CSS를 파싱 가능.\n\n## v4 (옵트인)\n- CSS `@theme`/`@apply` 지시어 기반. Biome CSS 파서가 못 읽으니 `*.css`를 Biome 스캔에서 제외.\n\n## 터치 UX\n- 터치 타깃 ≥ 44px, `:active` 피드백, 동적 뷰포트(`dvh`).\n"}}}}}; // { pack: { meta:{name,description,requires,concern}, modules:{mod:{manifest,files}} } }
const VERSION = '2.0.0';
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
  } else content = `${block}\n\n${content.replace(/^/, '')}`;
  write(cp, content);
  c.ok(`CLAUDE.md 갱신 — 룰 ${docs.length}개 @import 주입`);
  return 0;
}

function cmdGeneric(root, packName, cmd, args) {
  const packs = resolvePacks(packName);
  const only = args.flags.only ? String(args.flags.only).split(',') : null;
  const list = eachModule([packName], only, packName); // 대상 pack 모듈만 (deps 제외)
  const cfg = readConfig(root) || Object.fromEntries(unionQuestions(packs).map((q) => [q.key, q.default]));
  const pm = resolvePM(cfg, root);
  if (cmd === 'check') return checkSet(root, list, cfg, pm, false);
  if (cmd === 'doctor') {
    let issues = 0;
    for (const { m, id } of list) for (const t of activeTargets(m.manifest, cfg)) {
      const st = classify(root, t, render(t, m.files, cfg, pm, id), id);
      if (st === 'IDENTICAL' || st === 'KEEP') c.ok(t.dest);
      else { c.warn(`${t.dest} — ${st === 'CREATE' ? '없음' : st}`); issues++; }
    }
    c.plain(issues ? `이슈 ${issues}건 — 'ccx ${packName} update'` : '모두 정상');
    return issues ? 1 : 0;
  }
  if (cmd === 'update') {
    for (const { m, id, pk } of list) for (const t of activeTargets(m.manifest, cfg)) {
      const r = render(t, m.files, cfg, pm, id), st = classify(root, t, r, id);
      if (st === 'IDENTICAL' || st === 'KEEP') continue;
      if (st === 'FOREIGN') { c.warn(`${t.dest} — 외부 내용 스킵`); continue; }
      writeTarget(root, t, r, st, id); c.ok(`${t.dest} (${pk})`);
    }
    c.ok('update 완료'); return 0;
  }
  if (cmd === 'remove') {
    for (const { m, id } of list) for (const t of m.manifest.targets) {
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
