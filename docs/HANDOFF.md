# ccx v2 — 작업 핸드오프 (다음 세션용)

> 작성 2026-06-18. 로컬 경로 `/Users/link/Workspace/claude-code-extensions`. 리모트 `imDangerous/claude-code-extensions`.
> 설계 시각화: `docs/architecture.html`. 사용법: `README.md`.

## 현재 상태
- **v2.0.0 = 레이어드 packs 엔진** 구현·로컬검증 완료. **미릴리스**(레지스트리/머신 `ccx`는 아직 **v1.0.2**).
- 구조: `packs/<pack>/{pack.json, <module>/{module.json, files/}}` · `src/cli.mjs`(엔진) · `build.mjs`(임베드) · `src/install.mjs`.
- 명령: `ccx <pack> init|check|doctor|update|remove` · `ccx apply` · `ccx list`. (BREAKING: v1 `ccx <category> <module>` 폐기)
- packs: **core**(git·agent-workflow·qa-reviewer·orchestrate) · **js**→core(biome·typescript) · **web**→js(nextjs·tailwind) · **app**→js(expo=스텁).

## 검증된 동작 (실측)
- `ccx web init` → core+js+web 자동 동반(requires), 전 타입 설치, 공유 config(`.claude/extends/config.json`, 합집합·중복제거).
- git transform(공유 config 읽음)→`[RP-5] ✨`, commitlint ✅. `ccx apply` idempotent + 기존 CLAUDE.md 보존 + 룰 @import. `ccx app init`→core+js+app.

## 이번 세션에서 고친 것 (적대적 리뷰 P0)
- **#1 doctor/check가 의존(core/js) 포함** — `ccx web doctor`가 core/git 드리프트도 검출(검증됨). update/remove는 대상 pack만(의도).
- **#5 apply dead code 제거**.

## 남은 작업 (적대적 리뷰, 우선순위)
- **P0 #4 실설치 미검증** — 전 테스트가 `--no-install`+NODE_PATH. 진짜 `ccx web init`(deps 설치+husky 활성+`git commit`) 1회 검증 필요.
- **P1 #8/#9 variant 명목상** — tailwind v3/v4가 config 값일 뿐 파일 분기 없음. `enabledIf`/blocks로 실제 분기 + 핵심 config 배포(biome.json·tailwind.config·cn.ts·vitest.config). git만 완전, 나머지는 룰 문서 위주.
- **P1 #6/#7 내용 스텁** — app 팩 = expo 스텁. core 에이전트(qa-reviewer·orchestrate)는 축약본. RN 템플릿(`~/Workspace/Link/github/react-native-fsd-agent-template`)에서 app-inspector·idea-researcher·product-planner·spec-planner·design-architect·plan·ideate 추출·de-RN + **Expo SDK 54→56 갱신**.
- **P1 #10 git-workflow 모듈 없음** — 브랜치 전략(조직 정책)은 미이관(프로젝트 고유라 보류 가능).
- **P1 #11 ov-fe-edocument v2 재마이그레이션** — 현재 v1(`.claude/extends/rules/git/`)로 깔려 v2와 비호환. `ccx core git`(또는 `ccx web init`)로 재-init 필요.
- **P2 #2 모듈 주소지정** — `ccx core git doctor` 안 됨(`✗ 알 수 없는 명령`). `--only git`만. `ccx <pack> <module> <cmd>` 지원 검토.
- **P2 #3 Yarn PnP** — commit-msg 훅 `./node_modules/.bin/commitlint`가 PnP에서 깨짐. PM별 호출로.

## 릴리스 절차 (다음 세션)
1. 결정: **v2.0.0-beta**(엔진+git 실동작, 내용 scaffold 명시) 권장 vs P0/P1 채운 뒤 v2.0.0.
2. 버전: `package.json` + `README.md`/`src/install.mjs`의 `v2.0.0` 핀.
3. push/release (imDangerous 권한):
   ```
   gh auth switch --user imDangerous
   git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main vX.Y.Z
   gh auth switch --user link-readypost
   ```
   태그 push → `.github/workflows/release.yml`이 dist 첨부 릴리스 생성.
4. 검증: `curl …/releases/latest/download/install.mjs | node` → `ccx version`.

## 다음 세션 먼저 볼 파일
`src/cli.mjs`(엔진) · `build.mjs` · `packs/core/git/`(완전 모듈 참조) · `docs/architecture.html` · 이 문서.

## 테스트 메모
- 임시 검증 시 commitlint/config-conventional은 ov-fe-edocument node_modules 재사용: `NODE_PATH=/Users/link/Workspace/RP/ov/apps/ov-fe-edocument/node_modules`.
- 실행: `node dist/bundle.mjs web init --yes --no-install --ticket RP --dir <temp>` (머신 `ccx`는 v1.0.2라 dist 직접 실행).
