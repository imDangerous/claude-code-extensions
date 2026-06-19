<!-- Managed by ccx -->
<!-- ccx:always -->
# 관측성 (원칙 — 전 스택)

> 운영 중 무슨 일이 일어나는지 알 수 있어야 한다. 로그·메트릭·추적 + 에러 추적.

## DO
1. **구조적 로깅** — JSON 등 구조화(메시지 + 컨텍스트 필드). 레벨 규율(error/warn/info/debug).
2. **상관관계 ID** — request/trace id를 진입점에서 생성·전파(로그·다운스트림 호출에 포함).
3. **에러 추적** — 예외는 추적기로 보고(스택 + 컨텍스트 + 요청/사용자 메타). 삼키지 않는다.
4. **메트릭** — RED(Rate/Errors/Duration) 또는 USE. 헬스/레디니스 체크.
5. **PII/시크릿 로깅 금지** — 토큰·비밀번호·개인정보 마스킹.

## DON'T
1. `console.log` 흩뿌리기(구조적 로거 사용) · 빈 `catch {}`(에러 무시).
2. 고카디널리티/민감 값을 메트릭 라벨·로그에.
3. 로그만 있고 추적/메트릭 없음.

## 스택 도구
- web/app: Sentry(에러) + web-vitals/RUM (`observability-web`).
- Spring: Micrometer + OpenTelemetry + actuator (`observability-backend`).
