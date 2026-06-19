# Changelog

[Keep a Changelog](https://keepachangelog.com) 형식. 설치: `curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node`

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
