<!-- Managed by ccx -->
# 웹 관측성 (Sentry · Web Vitals)

> `observability.md` 원칙의 web 구현. 도구는 예시(Sentry/web-vitals) — 동등 대체 가능하되 원칙은 동일.

## 에러 추적
- 클라+서버+엣지 에러 캡처(예: `@sentry/nextjs`). Server Action·Route Handler·RSC 에러 경계 포함.
- **소스맵을 릴리스별 업로드**(스택 가독성) — 단 소스맵 공개 노출 금지.
- **PII 스크럽**(`beforeSend`): 토큰·이메일·정확위치 제거. user context는 **비식별 id**만.

## 성능 / RUM
- **Core Web Vitals(LCP·INP·CLS) 실측 수집** — 라우트별. `web-vitals` 또는 Sentry performance.
- release/version 태깅으로 회귀 추적(`harness-web`의 CWV 게이트와 연결).

## 로깅
- 서버 로그 구조적(JSON)+상관관계 id. 클라 `console`은 프로덕션에서 최소/제거(`biome` noConsole).

## DON'T
- DSN 외 시크릿 클라 노출, PII 캡처, 소스맵 퍼블릭 노출, 고카디널리티 태그.
