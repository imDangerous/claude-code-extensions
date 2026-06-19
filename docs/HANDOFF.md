# ccx — 작업 핸드오프 (다음 세션용)

> 갱신 2026-06-19. 로컬 `/Users/link/Workspace/claude-code-extensions` · 리모트 `imDangerous/claude-code-extensions`.
> 릴리스 이력 = `CHANGELOG.md`. 설계 시각화 = `docs/architecture.html`. 사용법 = `README.md`. 확장 계획 = `docs/plans/2026-06-19-packs-expansion.md`.
> (세션별 상세 로그는 git history + CHANGELOG 참조 — 이 문서는 현재 상태 + 불변 설계 결정만.)

## 현재 상태 — ✅ v2.2.0 (`releases/latest`)
- 원격 `main` = v2.2.0 태그 커밋(PR #1 squash 머지). CI green(테스트 15). Release 워크플로 success, `releases/latest` = v2.2.0 검증(`curl …/latest/bundle.mjs | node - version` → 2.2.0). working tree 클린. gh 계정 link-readypost.
- **v2.2.0**: SRS 게이트 + 엔진 `settings` kind 추가.
- ⚠️ 실프로젝트(ov-fe-edocument) `--srs-gate` 설치 후 실세션 훅 인식·차단/승인 동작은 **미검증**(`_ccx` 마커 무시 전제 실증 1회 필요).
- **v2.2.0 신규**:
  - **`core/srs-gate`**(opt-in `--srs-gate`, 기본 off) — "작업 전 SRS 강제". PreToolUse 훅이 미승인 소스 편집 차단(우회 불가). `specs/.active` 포인터 + `specs/.approvals/<SRS>.json` 승인 + 대상 브랜치 일치. 플랫 일련번호 `specs/NNNN_<slug>.md` + frontmatter(ticket/epic 으로 묶음). 훅 3종(gate/prompt/approve)·룰·스킬 `/srs`·템플릿.
  - **엔진 `kind: "settings"`** — `.claude/settings.json` JSON 멱등 병합(`_ccx` 마커, 사용자 키 보존, remove 정리). Claude Code 훅 자동 설치 기반. (기존 3 kind=doc/static/hook → 4종)
  - ⚠️ 이건 HANDOFF의 "거버넌스 승인게이트 의도적 폐기"(아래)와 **다른 것** — 그건 readypost 특화 CLAUDE.md 산문 룰이었고, 이건 훅 강제·opt-in·제너럴 모듈. 폐기 결정과 모순 아님.
- **5팩 · 3타겟**:
  - **core**(전 스택): git(컨벤션)·agent-workflow·qa-reviewer·orchestrate·validation·observability·entropy·git-branching(opt-in)·srs-gate(opt-in)
  - **js**→core: architecture·biome·typescript·react·validation-zod·git-hooks
  - **web**→js: nextjs·tailwind(v3*/v4)·vitest·harness-web·observability-web (+ 에이전트 8·스킬 2)
  - **app**→js: expo (+ 에이전트 8·스킬 2)
  - **backend**→core: spring·validation-backend·observability-backend·testing-backend (Kotlin/Java variant)
- 명령: `ccx <pack> init|check|doctor|update|remove` · `ccx <pack> <module> <cmd>` · `ccx apply` · `ccx list`.

## 핵심 설계 결정 (불변 — 변경 전 숙지)
- **FSD 금지** — web·app 모두 프레임워크 네이티브(Expo Router/App Router) + 가벼운 feature colocation. 근거: React 공식·Redux 공식·Bulletproof React. 룰/에이전트 전반 de-FSD, 잔존 FSD 언급은 의도적 DON'T뿐.
- **@import 2계층** — `apply`는 `<!-- ccx:always -->` 마커 룰(헌법급: agent-workflow·validation·observability·entropy·architecture, ~149줄)만 @import, 나머지는 색인(on-demand). "200줄"은 하드캡 아닌 *always-on 최소화* 원칙(룰 추가는 기본 on-demand).
- **레이어 = 책임 경계** — core는 Node 비결합(전 스택). js=JS/TS(React 공유). architecture(UI/로직 분리)는 js라 **backend 미상속**(프론트 룰이 백엔드에 안 옴 — 검증).
- **git 분리** — core/git=컨벤션, js/git-hooks=Node 구현. 훅 블록 id `core/git` 고정(`blockId`) + **`soleOwner` self-heal**(레거시 orphan 자동 제거, doctor 검출).
- **createOnly** — 프로젝트 config(biome.json·tailwind·vitest…)는 스캐폴드 후 project-owned(update 미덮음). 프로젝트 고유값은 그 파일/CLAUDE.md, ccx는 제네릭만.
- **UI/로직 분리**(architecture) — 3계층: 도메인/서비스(순수·UI 비의존) → hooks(ViewModel) → dumb 컴포넌트. 과분리 경고(AHA) 포함.
- **core 일반 유지** — qa-reviewer/orchestrate는 de-RN 일반 버전(확장 시 RN 재결합 → 레이어드 위배). orchestrate 풀 파이프라인(1155줄) 의도적 미이관.
- **entropy = 복잡도 예산**(파일300/함수50/순환복잡도10). biome complexity off 유지(cyclomatic≠cognitive).
- **버전 핀 SoT = 프로젝트 package.json** — 룰은 SDK-무관 규약, 신규 API는 "공식 문서 확인" 단서.

## 남은 작업 (전부 선택 — 핵심 비전 완료)
- **Phase 5**(보류): backend 검수 에이전트 `be-reviewer`(계층 위반·N+1·트랜잭션 경계·보안) · app `observability-app`.
- 미해결(소): entropy 측정 자동화 · backend 빌드도구(Gradle/Maven) 구체화 · observability 도구 고정도 · CHANGELOG 유지.
- **거버넌스 룰**(core.md 승인게이트·readypost 브랜치전략)은 **의도적 폐기** — 복원 안 함.
- RN 원본 참조: `~/Workspace/Link/github/react-native-fsd-agent-template/.claude/`.

## 운영
- **테스트**: `npm test`(build + node:test, `test/cli.test.mjs` 15개). CI=`ci.yml`(push/PR).
- **릴리스(패치)**: ① `package.json`+`README.md`+`src/install.mjs` 핀 bump → `node build.mjs` → 커밋 → `git tag -a vX.Y.Z` ② imDangerous로 push ③ `gh release edit vX.Y.Z --notes-file <md>` ④ 검증 `curl …/latest/… | node` → `ccx version`.
  ```
  gh auth switch --user imDangerous
  git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main vX.Y.Z
  gh auth switch --user link-readypost
  ```
  (CI/release actions는 Node24 버전 — checkout/setup-node v5, action-gh-release v3.)
- **먼저 볼 파일**: `src/cli.mjs`(엔진) · `build.mjs` · `packs/core/git`+`packs/js/git-hooks`(분리 참조) · `test/cli.test.mjs` · `CHANGELOG.md` · `docs/architecture.html`.
- 임시 검증 NODE_PATH(commitlint 재사용): `/Users/link/Workspace/RP/ov/apps/ov-fe-edocument/node_modules`. 미커밋 변경 검증은 `node dist/bundle.mjs …` 직접 실행.
