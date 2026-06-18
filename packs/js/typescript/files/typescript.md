<!-- Managed by ccx -->
# TypeScript

> strict 기준 타입 규칙.

## 타입
- **strict 필수**(`strict: true`). **`any` 금지** — 모르면 `unknown` + 타입 가드.
- **외부 경계 값 런타임 검증** — API 응답·폼·params (zod 등 도입 시 스키마).
- **export 함수는 명시적 반환 타입**, 내부 헬퍼는 추론 허용.

## import / export
- 정렬: 프레임워크 → 외부 → `@/` → 상대 → type-only. `import type` 사용.
- `@/` 경로 별칭, `../../..` 3단계↑ 금지.
- **named export 기본** — `export default`는 프레임워크 요구 파일만.

## 타입 정의
- 객체=`interface`, 유니온/매핑=`type`. Boolean은 `is`/`has`/`should` 접두.
