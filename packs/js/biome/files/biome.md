<!-- Managed by ccx -->
# Biome (린트·포맷·import 정렬)

> 린트·포맷의 단일 도구는 Biome. ESLint·Prettier 사용 금지.

## DO
1. `biome check --write`(lint+fix)·`biome format --write`를 단일 도구로.
2. a11y 규칙(`a11y.recommended`) 활성.
3. import 정렬도 Biome(`organizeImports`)로 일원화.
4. CI/pre-commit은 lint-staged → `biome check --write` (변경 파일만).

## DON'T
1. ESLint·Prettier·`eslint-plugin-*` 추가 금지.
2. `biome`+`eslint` 혼용 금지.
3. Biome가 잡을 규칙을 커스텀 스크립트로 대체하지 않는다.

## 메모
- 스캔 제외: `node_modules`·빌드 산출·`.claude`·생성물.
- 버전 업: `biome migrate --write`로 설정 자동 승격.
- ccx 관리 루트 설정 파일은 Biome 스캔에서 제외(포매터 재포맷으로 인한 드리프트 방지).
