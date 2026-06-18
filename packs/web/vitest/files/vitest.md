<!-- Managed by ccx -->
# 테스트 (Vitest + Testing Library)

> 단일 테스트 러너는 Vitest. React 컴포넌트는 Testing Library(RTL)로 **동작**을 검증한다.

## DO
1. **행동을 테스트** — 구현 디테일(state·내부 함수) 말고 사용자 관점 동작. RTL 쿼리는 **role/label 우선**(`getByRole`/`getByLabelText`), `getByTestId`는 최후.
2. **도메인 로직은 렌더러 없이** — 순수 함수/서비스(`architecture.md`)는 jsdom 없이 빠른 단위 테스트. 컴포넌트 테스트보다 우선.
3. 비동기는 `findBy*`/`waitFor`. 사용자 상호작용은 `@testing-library/user-event`.
4. 네트워크는 모킹(MSW 권장) — 실제 호출 금지.

## DON'T
1. 스냅샷 남발 금지(깨지기 쉽고 의미 약함) — 핵심 출력만 선별 스냅샷.
2. `act` 경고 무시 금지. 구현 변경마다 깨지는 과結합 테스트 금지.
3. 커버리지 숫자를 목표로 무의미 테스트 추가 금지.

## 메모
- 설정: `vitest.config.ts`(jsdom·`@` alias)·`tests/setup.ts`(jest-dom 매처). 테스트 위치: `tests/**` 또는 `src/**/*.test.tsx`.
- Biome는 test 파일에서 `noConsole`/`noExplicitAny`를 완화(설정 override).
