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

## 2026-06-18(2차) 세션 — P0 #4 검증 + P1 #8/#9 완료
- **엔진 확장(`src/cli.mjs`)**: ① 타깃/블록 `enabledIf`에 `equals` 추가 — 문자열 variant 값으로 분기(예: `"enabledIf":"tailwind","equals":"v3"`). bool enabledIf는 그대로(하위호환·회귀검증 완료). ② `prodDeps`(런타임 의존) 지원 — `npm install`(devDep `-D`와 별도)로 설치. cn() 같은 런타임 유틸용.
- **js/biome**: `biome.json` 배포(createOnly 스캐폴드, biome v2.5.0 기준 — ov-fe-edocument 추출·프로젝트 비종속화).
- **web/tailwind**: `src/lib/cn.ts`(공통, prodDeps `clsx`+`tailwind-merge`) + variant 실파일 분기 — v3→`tailwind.config.ts`+`postcss.config.js`, v4→`src/styles/tailwind.css`(@theme). 전부 createOnly.
- **검증(실측)**: v3/v4 init이 각 버전 파일만 생성(상호배타) ✅, cn.ts/biome.json 공통 ✅, createOnly가 사용자 수정 biome.json 보존(KEEP) ✅, git bool enabledIf 회귀 없음 ✅.
- **남은 config**: vitest.config.ts는 테스트 모듈 부재 + react plugin/`tests/setup.ts` 의존이라 이번 범위서 제외(신규 모듈 필요 — 아래 #6/#7과 함께).

## 남은 작업 (적대적 리뷰, 우선순위)
- **P0 #4 실설치 검증 완료 (2026-06-18)** — 빈 npm 프로젝트에서 진짜 `ccx web init`(`--no-install` 없이) 실행: deps 79패키지 설치 ✅, husky 활성(`core.hooksPath=.husky/_`, `prepare:husky`) ✅, 정상 커밋 `feat:`→`✨` 변환+commitlint 통과 ✅, 잘못된 메시지는 commitlint가 거부하고 HEAD 불변 ✅. 훅이 실동작 확인됨. → **v2.0.0-beta 릴리스 가능.**
- **P1 #8/#9 variant 분기 + 핵심 config 배포 완료 (2026-06-18 2차)** — 위 "2차 세션" 참고. biome.json·tailwind.config·postcss·cn.ts·v4 css 실배포 + v3/v4 enabledIf+equals 분기 검증. (vitest.config만 미배포 — 테스트 모듈 신설 필요.)
- **P1 #6/#7 app 팩 실콘텐츠화 — 1차 완료 (2026-06-18 3차)**:
  - `app/expo` 가 실제 팩이 됨 — `expo.md`(SDK 56 baseline + 불변 규약: 프로젝트 구조·코드컨벤션·NativeWind 무결성·Secure Storage·날짜/시간·수익화/스토어 안티패턴·EAS) + `app-inspector.md` 에이전트(`.claude/agents/`, `_workspace` 강제→"있으면 활용"으로 de-RN). `app init`→core+js+app, `apply`로 expo.md @import·에이전트는 자동발견(검증됨).
  - **FSD 금지 정책 (사용자 지침 — 2026-06-18 4차)**: RN 원본 템플릿은 FSD 기반이나, 글로벌 커뮤니티 비판(보일러플레이트 폭발·레이어 경계 논쟁·동급참조 금지發 리팩토링 지옥·파일기반 프레임워크 충돌)에 따라 **web·app 모두 FSD 미채택**. `expo.md`는 FSD 아키텍처 섹션을 "Expo Router 파일기반 + 가벼운 feature colocation" 구조로 교체하고 **명시적 DON'T(CRITICAL): FSD 금지** 추가. `nextjs.md` DON'T에도 FSD 금지 1줄. FSD 경로(`@features/`,`@/shared`)는 중립 래퍼 표현으로 치환(보안 본질 유지). 잔존 FSD 언급은 전부 DON'T 맥락뿐(grep 검증).
  - **설계 결정**: ① expo 네이티브 deps는 `npm install -D`로 깨지므로 자동설치 안 함 — 룰이 `npx expo install` 안내. ② (8차에서 갱신) SDK 56 세부가 **공식 출처로 검증됨** → expo.md에 검증 사실 반영. ③ RN 고유 QA 안티패턴(AdMob·store-review·secure-storage)은 expo.md에 압축 통합(원본 qa-reviewer 200줄 전체 이관 안 함). ④ **core qa-reviewer/orchestrate는 일반(de-RN) 버전 유지가 의도** — 확장하면 RN에 재결합되어 레이어드 설계에 위배.
  - **기획 에이전트 4종 이관 완료 (2026-06-18 5차)**: idea-researcher·product-planner·spec-planner·design-architect → `app/expo` `.claude/agents/`. **배치 결정**: 이들은 프레임워크 무관이 아니라 **모바일 앱 전용**(App Store 트렌드·Firebase KPI·Store Review·AdMob·Expo Router·NativeWind)이라 core가 아닌 **app/expo**로. **de-FSD 적용**: product-planner의 "FSD 모듈 맵"·"FSD Layer" 컬럼·"FSD 단위 분해" 제거 → Expo Router + 기능 폴더 colocation으로 교체 + 명시적 "FSD로 분해 안 함". spec-planner 예시 task 목록 de-FSD(entities/·barrel 제거). design-architect의 `src/shared/config/theme.ts`→`src/lib/theme.ts`. `_workspace/` 핸드오프는 orchestrate 규약과 일치하므로 유지. `app init`로 6종 에이전트(core qa-reviewer + app 5종) 배포·자동발견 검증. de-FSD grep 검증(잔재는 의도적 DON'T 지시문뿐).
  - **web 전용 에이전트 추가 (2026-06-18 6차)**: 그간 web 팩은 룰+config만 있고 에이전트가 없어 app과 비대칭이었음 → **웹 베스트프랙티스 리서치 기반**으로 신설. ① `web-inspector`(→web/nextjs `.claude/agents/`) — 접근성(WCAG 2.2 AA), Core Web Vitals(LCP≤2.5s·**INP≤200ms**(2024 FID 대체)·CLS≤0.1, p75), RSC 경계(Server기본·client island·useEffect 초기패칭 금지), SEO/메타, 보안(시크릿/eval/CSP/SRI), Hard Threshold+능동검증(build·Lighthouse). ② `web-design-architect`(→web/tailwind, app `design-architect`와 경로충돌 피해 명칭 분리) — Tailwind 토큰 SoT·모바일퍼스트·WCAG AA 대비 4.5:1·다크모드·FSD 미채택. `web init`로 배포·자동발견 검증. **리서치 출처**: web.dev(CWV 임계), W3C WCAG 2.2, Next.js 공식(RSC), Front-End-Checklist(thedaviddias). 현재 에이전트 대칭: web=inspector+design-architect / app=inspector+design-architect+기획3(idea/product/spec) / core=qa-reviewer+orchestrate(공용).
  - **Feature-Driven 3규칙 보강 (2026-06-18 7차)**: 사용자 제시 의견의 지지 규모를 적대적 검증 → 핵심 구조(얇은 app/·feature colocation·기능 독립성+공용 상위로)는 **주류 표준** 확인(React 공식 legacy File Structure FAQ의 feed/profile colocation 예시, Redux 공식 Style Guide feature-folder, **Bulletproof React 35.3k★**, Robin Wieruch). 단 "머지충돌 70%↓/AI 5배/환각 0%" 수치는 **출처 없는 과장**이라 미반영. `expo.md` 구조 섹션에 3규칙 명시(얇은 app/=화면스위치, 기능 가방 colocation, 기능 독립성은 **가급적**). 규칙 3과 FSD-DON'T 충돌 방지: "가급적 + 2버킷, 다층 레이어/barrel 강제 아님"으로 일관성 명시. nextjs.md는 기존 "page.tsx는 조합·레이아웃만"으로 얇은 라우트 규칙 이미 보유.
  - **하네스 수준 룰/에이전트 강화 + UI/로직 분리 (2026-06-18 8차, 병렬 리서치 3건 기반)**:
    - **신규 `js/architecture.md`** (UI/로직 분리, **web·app 공유** — js→둘 다 상속): 3계층(도메인/서비스 순수·프레임워크무관 → hooks=ViewModel → dumb 프레젠테이션), DO/DON'T·안티패턴(프레젠테이션 직접패칭·도메인이 react/RN import 등)·과분리 경고(AHA·Rule of Three·컨테이너/프레젠테이션 폐기). 근거: Fowler Humble Object/Presentation Model·React 공식 hooks·headless(Radix/TanStack/React Aria). **요청 #2(MVC/MVVM식 UI-로직 분리) 충족.** 배치: 프레임워크 무관 원칙이라 js 레이어(component UI로 스코프 명시).
    - **core `agent-workflow.md` 하네스 강화**: gather→plan→act→verify→iterate 루프, context engineering(희소 예산·서브에이전트 위임·파일시스템 기억·`/clear`), verification-first(읽지말고 실행·Hard Threshold·증거·생성자≠평가자), 유한루프+에스컬레이션, Claude Code 프리미티브(skill/subagent/hook 구분·CLAUDE.md ~200줄·deny-first 권한). 근거: Anthropic harness/context-engineering 블로그·Claude Code docs.
    - **web `nextjs.md` → Next.js 16 검증 갱신**: Turbopack 기본, 캐싱 opt-in(`'use cache'`/Cache Components·`revalidateTag(tag,profile)`/`updateTag`/`refresh`), async `params/cookies/headers`, Server Action=공개 엔드포인트(검증+authn+authz 각각, `proxy.ts`는 보안경계 아님 CVE-2025-29927), `server-only`, React 19.2. **app `expo.md` → SDK 56 검증 갱신**: RN 0.85/React 19.2, New Arch 기본(SDK55 Legacy 제거), Hermes v1 기본, typed routes, FlashList v2·Reanimated v4, expo-video/audio(expo-av 제거). 둘 다 `architecture.md` 참조.
    - **inspector 에이전트에 분리 검사 추가**: web-inspector(3b절+Hard Threshold 2행)·app-inspector(Hard Threshold 2행) — 프레젠테이션 직접패칭/도메인의 react(-native) import = FAIL.
    - 검증: js에 architecture 모듈 추가 → web/app init 모두 architecture.md 상속(실측). 리서치 출처는 각 룰 하단/HANDOFF에 명시. (주의: Opus 4.7/4.8·Fable 5 등 일부 최신 모델/SDK 빌링 변경은 3자 출처라 불확실로 표기.)
  - **app 구현 에이전트 3종 이관 — app 파이프라인 완성 (2026-06-19 10차)**: feature-builder·ui-developer·api-integrator → app/expo `.claude/agents/`, **de-FSD + architecture.md 3계층 정렬**. feature-builder=FSD 스캐폴더 → **feature-colocation 스캐폴더**로 재구성(barrel/레이어 금지, ui·hooks·api·store·types colocation). ui-developer=프레젠테이션 계층(dumb 컴포넌트·NativeWind·평점/광고 배선, `src/shared/ui`→`src/components`). api-integrator=도메인/서비스+hooks 계층(Axios 토큰 리프레시·TanStack Query·Zustand·SecureStore·analytics/평점/광고 래퍼) — 원본 414줄에서 RP 특화 콘솔자동화(Playwright) 제외하고 내구성 핵심만 ~90줄로 트림. `app init` → 9 에이전트 배포 검증(idea→product→spec→design→feature-builder→api-integrator→ui-developer→app-inspector + core qa-reviewer = plan→design→build→QA 완성). FSD 잔재는 의도적 '금지' 지시문뿐(grep).
  - **web 기획 에이전트 3종 — web 파이프라인 완성 (2026-06-19 11차)**: web-idea-researcher·web-product-planner·web-spec-planner → web/nextjs `.claude/agents/`. app 기획 3종을 **웹 표준으로 변환**(App Store/AdMob/Firebase → SEO·IA/사이트맵·App Router 라우트·웹 애널리틱스·Core Web Vitals 목표·Server/Client 분리 계획). 명칭 `web-` 접두(충돌 방지, web-design-architect/web-inspector와 일관 — dest 중복 0 검증). `web init` → 6 에이전트(web-idea/product/spec-planner·web-design-architect·web-inspector + core qa-reviewer = plan→design→QA). 웹 build 단계는 nextjs.md+architecture.md 룰로 커버(전용 build 에이전트는 선택). FSD 잔재는 의도적 금지문뿐.
  - **현재 에이전트 대칭(완성)**: app=idea/product/spec/design + feature-builder/api-integrator/ui-developer + app-inspector(8) · web=web-{idea/product/spec}-planner/design-architect/inspector(5) · core=qa-reviewer+orchestrate.
  - **적대적 리뷰 (2026-06-19 12차, 독립 서브에이전트 + 검증)**:
    - **[릴리스 게이트] 10·11차 산출물(에이전트 6종+module.json+dist+HANDOFF) 미커밋** — working tree엔 전부 있고 dist도 최신(번들 CATALOG 1줄). 커밋된 de0653c는 9차 시점이라 stale. **릴리스 전 `git add`+`node build.mjs`+커밋 필수.** (손실 아님, 미커밋일 뿐.)
    - **수정 완료**: ① ui-developer 평점 스니펫 자기완결화(`useStoreReview`/`useReviewStore` 구조분해, `{uiIsIdle:true}`). ② tailwind.md에 tailwind 본체 설치 안내 추가(ccx는 config만 스캐폴드 — v3/v4 설치 상이). ③ expo.md/nextjs.md 버전 단정 완화("설치 버전/공식 문서로 확인" — 신규 API 시그니처 취약성 대비).
    - **수용한 트레이드오프**: architecture.md가 js 레이어(프론트 전용 룰이나 현 taxonomy상 js 소비자는 web/app 둘 다 React라 무해, 백엔드 js 팩 생기면 재배치). web install @import 룰 199줄 ≈ 권고 200줄(빠듯 — 향후 중복 제거(NativeWind/CWV/평점 반복) 여지).
    - **이상 없음 확인**: 에이전트 name/dest 충돌 0(web- 접두), 엔진(equals/모듈주소지정/@bin/prodDeps) 회귀 0, FSD 실잔재 0(전 hit가 의도적 금지/설명문).
  - **app 스킬 2종 이관 (2026-06-19 13차)**: ideate(→idea-researcher 위임)·plan-app(→product-planner 위임) → app/expo `.claude/skills/`. plan-app Step 4 "FSD 모듈 맵" → **feature-colocation 매핑으로 de-FSD**. app init → 스킬 3종(orchestrate(core)+ideate+plan-app) 배포 검증. app 팩 완성: 룰(expo)+에이전트 8+스킬 2(+core orchestrate).
  - **orchestrate 1155줄 파이프라인 = 의도적 미이관**: core의 일반(de-RN) orchestrate(29줄) 유지 — 풀 파이프라인 이식 시 RN/FSD/_workspace 재결합 + 컨텍스트 비대로 레이어드 설계 위배. (4차 'core 일반 유지' 결정과 일관.)
  - **남은(선택)**: web 전용 build 에이전트, web 스킬(ideate/plan-web — 단 app 스킬과 name/dest 충돌 주의), vitest 테스트 모듈. RN 원본: `~/Workspace/Link/github/react-native-fsd-agent-template/.claude/`.
- **P1 #10 git-workflow 모듈 없음** — 브랜치 전략(조직 정책)은 미이관(프로젝트 고유라 보류 가능).
- **P1 #11 ov-fe-edocument v2 재마이그레이션** — 현재 v1(`.claude/extends/rules/git/`)로 깔려 v2와 비호환. `ccx core git`(또는 `ccx web init`)로 재-init 필요.
- **P2 #2 모듈 주소지정 완료 (2026-06-18 9차)** — `ccx <pack> <module> <cmd>` 지원(예: `ccx core git doctor` → git 모듈만 검사). main()에서 a._[1]이 명령이 아니면 모듈명으로 보고 `--only`로 좁힘 + 미지 모듈/잘못된 cmd 에러. HELP 갱신. 검증됨.
- **P2 #3 Yarn PnP 완료 (2026-06-18 9차)** — commit-msg 훅의 `./node_modules/.bin/commitlint` 하드코딩 제거 → 엔진 `@bin:<name>` 플레이스홀더(render에서 PM별 `binRun`으로 치환): npm=`npx --no-install commitlint`·pnpm=`pnpm exec commitlint`·**yarn=`yarn commitlint`(PnP-safe)**·bun=`bunx commitlint`. PM 4종 렌더 + npm 실설치 정상/비정상 커밋 회귀 검증(✨ 변환·commitlint 거부 모두 OK).

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
