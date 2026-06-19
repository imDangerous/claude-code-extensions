<!-- Managed by ccx -->
# 백엔드 관측성 (Micrometer · OpenTelemetry)

> `observability.md` 원칙의 JVM 구현. 도구는 예시(동등 대체 가능).

## 메트릭 / 추적
- **Micrometer + Actuator** — `/actuator/health`·`/metrics`. RED(요청률·에러·지연) 메트릭(자동 + 커스텀 `@Timed`/`Counter`).
- **분산 추적** — OpenTelemetry(또는 Micrometer Tracing)로 `traceId`/`spanId` 생성·전파(다운스트림 호출·메시징 헤더에).

## 로깅
- **구조적 로깅(JSON)** — logback/log4j2 JSON encoder. **MDC에 traceId/requestId** 넣어 로그-추적 상관.
- 레벨 규율(error/warn/info/debug). **PII/시크릿 로깅 금지**(마스킹).

## DON'T
- Actuator 민감 엔드포인트(env·heapdump 등)를 인증 없이 노출.
- 로그·메트릭 태그에 토큰/PII/고카디널리티 값.
- 예외 삼키기(`catch` 후 무시) — 추적기/로그로 보고.
