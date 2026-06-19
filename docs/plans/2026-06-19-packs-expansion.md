# ccx 팩 확장 계획 — web/app/backend 3타겟 룰 충실화

> 작성 2026-06-19. 목적: ccx 타겟을 **React(web) / Expo·RN(app) / Spring(backend)** 3축으로 명확히 하고,
> 현재 얇은 룰 구조를 비전 수준으로 채운다. 라이브러리 설치가 아니라 **룰(규약) 콘텐츠** 확장.
> 근거: `web`/`app`은 이미 `concern:"frontend"`, orchestrate가 `concern(frontend/backend)` 분기 — **backend 자리는 설계돼 있으나 미구현**.

## 확정 결정 (2026-06-19)
- **backend(Spring) = Kotlin/Java variant** (config `lang`=kotlin|java, `enabledIf`+`equals`로 파일 분기 — tailwind v3/v4 선례).
- **entropy = 복잡도/엔트로피 예산** (중복·파일/함수 크기·순환복잡도 상한). 전 스택 공통 → core.
- **공통 룰(react·validation)은 js 레이어 공유** (web+app 둘 다 React; architecture.md 선례).
- 진행: **단계적, 이 plan 합의 후 phase별 커밋**.

## 목표 구조 (end state)
```
core (web·app·backend 공통)
  git · agent-workflow(=harness 일반) · qa-reviewer · orchestrate        [기존]
  validation(원칙) · observability(원칙) · entropy(복잡도 예산) · git-branching(opt-in)  [신설]
js (JS/TS 공통, →core)
  architecture · biome · typescript                                     [기존]
  react(React 공통: hooks·key·effect·memo) · validation-zod             [신설]
web (→js, React/Next.js)
  nextjs · tailwind(styling) · vitest                                   [기존]
  harness-web · observability-web(Sentry·web-vitals)                    [신설]
app (→js, Expo/RN)
  expo(styling=nativewind 포함)                                         [기존]
  observability-app(Sentry RN) — 선택                                   [신설?]
backend (→core, Spring/JVM)   ← 전부 신설
  spring(구조·DI·계층) · validation-backend(Bean Validation) ·
  observability-backend(Micrometer/OTel) · testing-backend(JUnit5/MockK|Mockito)
  [Kotlin/Java variant], concern:"backend"
```

## 설계 규칙 (충돌·중복 방지)
- **cross-cutting 개념은 layer별로 파일명을 분리**해 dest 충돌 방지: 원칙은 `core/<concern>.md`, 스택 구현은 `<concern>-<stack>.md`(예: `observability-web.md`·`observability-backend.md`·`validation-zod.md`·`validation-backend.md`). 같은 `.claude/rules/validation.md`를 두 팩이 쓰지 않는다 (backend→core라 core/validation.md와 backend/validation.md 충돌하므로).
- 원칙(core)은 도구 비종속, 스택 파일은 도구 구체(zod·Sentry·Micrometer).
- 에이전트/스킬은 기존대로 `web-`/(app 무접두) 규칙 유지. backend 에이전트는 `be-`(또는 무접두+backend 전용) — phase 5에서 확정.
- biome 충돌 주의: 현재 ccx biome.json은 `complexity: preset none`. **entropy 룰과 정합**시킬지(복잡도 룰 일부 켜기) phase 1에서 결정.

## Phase 별 작업 (각 = 1커밋/세션)

### Phase 1 — core 원칙 룰 (전 스택 토대)
- `core/validation`(원칙: 신뢰 경계에서 검증·fail-closed·입력 sanitize·경계 명시)
- `core/observability`(원칙: 구조적 로깅·상관관계 ID·에러 추적·PII 금지·로그 레벨)
- `core/entropy`(복잡도/엔트로피 예산: 파일/함수 LOC·중복 임계·순환복잡도·"엔트로피 증가 억제" 휴리스틱)
- `core/git-branching`(opt-in 모듈 — 브랜치 전략. 기존 "프로젝트 고유 보류" 결정 번복: 설정 가능한 제네릭 기본 제공)
- 결정: entropy ↔ biome complexity preset 정합.

### Phase 2 — js 공통 (frontend 공유)
- `js/react`(hooks 규칙·deps array·key·effect cleanup·메모이제이션·컴포넌트 순수성. RSC/Server-Client는 web, RN 특이는 app으로 위임)
- `js/validation-zod`(zod 스키마·infer·경계 파싱·core/validation 원칙의 JS 구현)

### Phase 3 — web 보강
- `web/harness-web`(web 특화 에이전트/QA 지침 — web-inspector와 정합, 중복 회피)
- `web/observability-web`(Sentry·web-vitals·RUM·소스맵)
- styling은 tailwind로 충족(추가 없음). react는 js에서 상속.

### Phase 4 — backend 팩 신설 (Spring)
- `backend` pack.json (requires:core, concern:"backend"), config `lang` 질문(kotlin|java).
- `backend/spring`(레이어드 구조·DI·계층 경계·controller/service/repository·DTO·예외처리). Kotlin/Java variant 파일.
- `backend/validation-backend`(Bean Validation·@Valid·경계 검증)
- `backend/observability-backend`(Micrometer·OpenTelemetry·구조적 로깅·actuator)
- `backend/testing-backend`(JUnit5 + Kotlin:MockK / Java:Mockito, slice test, testcontainers 언급)
- 검증: `ccx backend init`(→core+backend), lang variant 분기 실측.

### Phase 5 — (선택) 에이전트·관측 확장
- backend 검수 에이전트(spring-reviewer: 계층 위반·N+1·트랜잭션 경계·보안). 필요 시 backend 기획/구현 에이전트.
- `app/observability-app`(Sentry RN).
- 양 스택 orchestrate concern 연동 점검.

## 미해결/추후 결정
- **entropy 수치 기준**: 파일/함수 LOC·복잡도 상한 구체값 (Phase 1에서 합의).
- **git-branching 전략 종류**: trunk-based vs GitHub Flow vs GitFlow 중 기본값 (질문 또는 config).
- **backend 빌드 도구**: Gradle(Kotlin DSL) 기본 가정? Maven 지원?
- **backend 에이전트 네이밍**: `be-*` vs 무접두.
- **observability 도구 고정도**: Sentry를 기본으로 박을지, 도구 비종속 원칙만 둘지.

## 검증 게이트 (각 phase 공통)
- `node build.mjs` OK · 해당 `init` 실측(파일 배포·variant 분기) · dest/name 충돌 0 · FSD 잔재 0 · `apply` @import 정합 · HANDOFF 갱신.
- 룰 추가 시 web @import 줄수 모니터(현 218줄, 권고 200) — 과하면 중복 제거/분할.
