# Changelog

[Keep a Changelog](https://keepachangelog.com) 형식. 설치: `curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node`

## [2.5.0] — 2026-06-24 — qa-reviewer 개선 + qa-reviewer-web 신규 (web 팩)
### Added
- **`web/qa-reviewer-web`** — 웹 변경분 전용 검수 에이전트(`.claude/agents/qa-reviewer-web.md`). 기본 Hard Threshold에 웹 레이어 추가: `pnpm build`(RSC 경계·server-only 누수), Playwright E2E(UI 변경 감지 시 의무), axe WCAG 2.2 AA, `console` 사용 grep, 도메인 react import grep, RSC `'use client'` 경계 적절성. UI 변경 포함 SRS에서 `qa-reviewer` 대신 사용.
### Changed
- **`core/qa-reviewer`** — SRS 수용 기준 항목별 체크 추가. `specs/.active` 가 존재하면 해당 SRS를 읽어 각 수용 기준 항목 충족 여부를 ✅/❌로 확인(SRS 미사용 프로젝트는 스킵).

## [2.4.0] — 2026-06-20 — HANDOFF 게이트 예외 + 완료 시 핸드오프 갱신 관행
### Added
- **`HANDOFF.md` 게이트 예외** — srs-gate(PreToolUse)가 `HANDOFF.md`(basename) 편집을 `specs/` 처럼 **승인 없이 허용**. 진행상황 핸드오프는 살아있는 메타 문서(작업 산출물 아님)인데, 게이트 마찰 때문에 갱신이 드리프트하던 문제 해소. srs-gate 런타임 테스트에 HANDOFF 예외 어서션 추가(테스트 17 유지).
### Changed
- **완료(done) 절차에 HANDOFF 갱신 포함** — 룰(`srs.md`)·스킬(`/srs`)·템플릿(검수 체크)에 "작업 닫을 때 `HANDOFF.md` 현재상태(스냅샷·다음 할 일) 갱신" 명문화. SRS 원장(per-task)과 HANDOFF(한눈 현재상태)의 역할 구분.

## [2.3.0] — 2026-06-20 — 검수 게이트(개발 후 평가자 검수 강제) + commitlint subject-case 완화
### Added
- **`core/srs-gate` 검수 게이트(review-gate, Stop 훅)** — srs-gate(작업 전 spec)의 **대칭 짝**. 작업 전만 강제하면 "스펙대로 만든 뒤 검수를 건너뛰는" 비대칭이 생기므로, 개발 후 **평가자 검수**를 강제한다. 근거: `agent-workflow.md` 규칙 8(생성자≠평가자)·규칙 13(강제는 훅으로).
  - **Stop 훅**(`.claude/hooks/review-gate.mjs`) — active SRS 가 `status: done` 인데 검수 PASS 기록(`specs/.reviews/<SRS>.json`)이 없으면 세션 종료를 차단. `done` 이전(구현 중)·비작업 브랜치·검수 기록 존재·`stop_hook_active`·`CCX_SRS_OFF=1` 이면 통과(구현 중 stop·사용자 질문은 막지 않음).
  - **검수 기록 헬퍼**(`srs-review.mjs`) — `PASS|FAIL` + evidence 를 `specs/.reviews/` 에 기록(`.approvals/` 와 대칭). 에이전트 호출 가능(단 verdict 는 별도 평가자 결과여야 — 생성자 자기채점 금지).
  - settings.json `Stop` 항목(`_ccx` 마커)·룰(`srs.md`)·스킬(`/srs` 6단계)·템플릿(검수 체크) 동반. `enabledIf: srsGate` — SRS 게이트를 켜면 앞뒤 게이트가 함께 설치.
- **SRS 자리표시자 표기 규약** — 게이트의 `<...>` 잔재 검사가 리터럴 꺾쇠 토큰(명령 usage·파일명 패턴)까지 오탐하던 문제를 규약으로 해소: `<...>`=미완성 자리표시자 전용, 리터럴은 `{...}`. 룰·템플릿에 명문화 + grep 자가진단 안내.
### Changed
- **commitlint `subject-case` 완화** — `@commitlint/config-conventional` 기본값(sentence/start/pascal/upper 전부 차단)이 `DESIGN.md`·`Button`·`Add x` 같은 **대문자 시작 제목**까지 막아 과도. `[2,'never',['upper-case']]` 로 완화 — 전체 대문자(SHOUTING)만 차단, 대문자 시작 허용.

## [2.2.1] — 2026-06-19 — SRS 게이트 실환경 검증 + 패치
### Fixed
- **게이트 차단 메시지 옛 경로** — "활성 SRS 없음" 차단 문구가 폐기된 폴더 방식(`specs/<작업단위>_<날짜>/NNN_...`)을 안내해 프롬프트 훅/스킬(플랫)과 모순되던 문제. `specs/NNNN_<slug>.md`(일련번호)로 통일.
- **hook 스크립트 자동 갱신 불가** — `.claude/hooks/*.mjs`(kind:static)에 `Managed by ccx` sentinel이 없어 `ccx update` 시 FOREIGN으로 분류·스킵되던 문제(=패치가 기존 설치에 전파 안 됨). sentinel 추가 → `update`로 갱신, `remove`로 정리.
### Verified
- **실프로젝트(ov-fe-edocument) 실세션 검증 완료** — `--srs-gate` 설치 후 실제 Claude Code 세션에서 settings.json의 `_ccx` 마커 훅이 인식되어 SRS 없는 소스 편집을 차단함을 실증(파일 미생성). settings 병합이 기존 `permissions`/`$schema` 보존도 확인.

## [2.2.0] — 2026-06-19 — SRS 게이트(스펙 주도 강제)
### Added
- **`core/srs-gate` 모듈**(opt-in, 기본 off — `ccx core init --srs-gate`) — "작업 전 SRS 강제". 승인된 SRS 없이는 소스 편집(Edit/Write/MultiEdit/NotebookEdit)을 **PreToolUse 훅이 차단**한다. 지시가 아니라 훅이 수행 → 우회 불가.
  - **PreToolUse 게이트**(`.claude/hooks/srs-gate.mjs`) — `specs/.active` 가 가리키는 SRS 존재 + 본문 채움(자리표시자 `<...>` 없음) + `specs/.approvals/<SRS>.json` 승인 + 대상 브랜치 일치 시에만 통과. `specs/**` 편집(=SRS 작성)은 항상 허용. 긴급 우회 `CCX_SRS_OFF=1`.
  - **UserPromptSubmit 주입**(`srs-prompt.mjs`) — 매 프롬프트에 SRS 절차 주입.
  - **승인 명령**(`srs-approve.mjs`) — 사람이 직접 실행(자기 승인 금지). `.approvals/` 마커 생성 + 체크박스/`status` 갱신.
  - 구조: **플랫 일련번호** `specs/NNNN_<slug>.md`(프롬프트 1건=SRS 1개) + **frontmatter**(id·date·branch·ticket·epic·status). 폴더로 묶지 않고 ticket/epic 으로 연결 → 티켓 없음/사후 생성/다중 태스크 흡수. 룰·스킬(`/srs`)·템플릿 동반.
- **엔진 `kind: "settings"`** — `.claude/settings.json` JSON **멱등 병합**(`_ccx` 소유 마커로 우리 항목만 식별, 사용자 키 보존, `remove` 시 우리 것만 정리). Claude Code 훅 자동 설치의 기반.
- **자동 테스트 +3** — settings 병합·srs-gate opt-in·게이트 런타임(차단→승인→허용) → 총 15개.

## [2.1.2] — 2026-06-19
### Fixed
- **web-idea-researcher 도구 누락** — 본문에서 모호 시 `AskUserQuestion`을 호출하는데 frontmatter `tools:`에 빠져 있어 에이전트가 미부여 도구를 호출하던 동작 버그. `tools:`에 `AskUserQuestion` 추가(형제 web-design-architect·web-product-planner와 일관).
### Changed
- **qa-reviewer 재검수 한도 명시** — `최대 N회`(미정의) → `기본 최대 3회, 프로젝트가 조정 가능`.
- **web-inspector 시크릿 탐지 구체화** — `grep(env·키 패턴)` → 구체 패턴(`sk-`·`AKIA`·`ghp_`·`AIza`·`BEGIN ... PRIVATE KEY`) 명시(본문·Hard Threshold 표).

## [2.1.1] — 2026-06-19
### Fixed
- **훅 마이그레이션 self-heal** — v1 `rules/git` 등 레거시 ccx 훅 블록이 마이그레이션 시 제거되지 않아 orphan(삭제 스크립트 호출→첫 커밋 실패)이 되던 문제. 커밋 훅에 `soleOwner` 도입 → `init`/`update` 시 현재 블록 외 모든 ccx 블록 자동 제거. `doctor`가 orphan을 stale로 검출(이전엔 정상 오판).
### Added
- **자동 테스트** — `node:test` 블랙박스 12개(`npm test`) + CI 워크플로(`ci.yml`, push/PR).
### Changed
- 문서 최신화(README·architecture.html·orchestrate) — 3타겟·@import 2계층·git 분리 반영.
- CI/release actions Node 24 버전으로 bump(checkout/setup-node v5, action-gh-release v3).

## [2.1.0] — 2026-06-19 — 팩 확장: 3타겟
### Added
- **backend(Spring) 팩** — `ccx backend init`(→core). `spring`·`validation-backend`·`observability-backend`·`testing-backend`, **Kotlin/Java variant**(`--lang`). → React(web)·Expo(app)·Spring(backend) 3타겟 실현.
- **core 원칙 룰** — `validation`(경계 검증)·`observability`(로깅·추적)·`entropy`(복잡도 예산: 파일300/함수50/복잡도10)·`git-branching`(Trunk-Based, opt-in).
- **js 공통** — `react`(Rules of Hooks·effect 최소화)·`validation-zod`. **web** — `harness-web`·`observability-web`. 테스트 모듈 `vitest`.
### Changed
- **@import 2계층 모델** — `apply`가 `<!-- ccx:always -->` 마커 룰만 always-on @import(헌법급 원칙), 나머지는 색인(on-demand). always-on 컨텍스트 최소화.
- **git 모듈 분리** — `core/git`(컨벤션, 전 스택) + `js/git-hooks`(husky·commitlint, Node). backend는 컨벤션만.

## [2.0.2] — 2026-06-19
### Changed
- 제네릭 `biome.json`에 비자명 설정 근거 JSONC 주석(CSS 제외·components override).

## [2.0.1] — 2026-06-18
### Fixed
- `install.mjs` 설치 후 안내 문구를 v2 문법(`ccx <pack> init`)으로 교정.

## [2.0.0] — 2026-06-18 — 레이어드 packs 실콘텐츠화
### Added
- 레이어드 pack 엔진(core→js→web/app, `requires` 자동 동반, 공유 config, `ccx apply`).
- 핵심 config 배포(`biome.json`·`tailwind.config`/`postcss`(v3)/`tailwind.css`(v4)·`cn.ts`·`vitest.config`) — variant 분기(`enabledIf`+`equals`)·`createOnly` 스캐폴드·`prodDeps`.
- web/app 에이전트 파이프라인(plan→design→build→QA, 각 8 에이전트+2 스킬) + 하네스 룰 + UI/로직 분리(`architecture`).
- 모듈 주소지정 `ccx <pack> <module> <cmd>`, Yarn PnP-safe 훅(`@bin:`).
### Changed
- **BREAKING**: v1 `ccx <category> <module>` 폐기 → `ccx <pack> init`.
- **FSD(Feature-Sliced Design) 금지** — web·app 모두 프레임워크 네이티브(Expo Router/App Router) + 가벼운 feature colocation.

[2.1.1]: https://github.com/imDangerous/claude-code-extensions/releases/tag/v2.1.1
[2.1.0]: https://github.com/imDangerous/claude-code-extensions/releases/tag/v2.1.0
[2.0.2]: https://github.com/imDangerous/claude-code-extensions/releases/tag/v2.0.2
[2.0.1]: https://github.com/imDangerous/claude-code-extensions/releases/tag/v2.0.1
[2.0.0]: https://github.com/imDangerous/claude-code-extensions/releases/tag/v2.0.0
