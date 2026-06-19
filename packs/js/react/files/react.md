<!-- Managed by ccx -->
# React 공통 규약 (web · app 공유)

> React/React Native 공통. UI/로직 분리는 `architecture.md`(컴포넌트=렌더, 로직=hooks/서비스). Server/Client 경계는 `nextjs.md`(web), RN 특이는 `expo.md`(app).

## Rules of Hooks
- hook은 **컴포넌트/커스텀 hook 최상위에서만** 호출. 조건문·반복문·중첩 함수 안 금지.
- 커스텀 hook은 `use` 접두. 로직 재사용은 hook으로(HOC/render-props 대신).

## Effects (최소화)
- `useEffect`는 **외부 시스템 동기화 전용**(구독·DOM·타이머·네트워크). 계산으로 끝날 일에 쓰지 않는다 — **파생값은 렌더 중 계산**(불필요 state/effect 금지).
- deps 배열 **정확히**(빠진 의존성 금지). 구독·타이머는 **cleanup** 반환.
- effect에서 state set으로 또 다른 렌더 유발하는 루프 금지. 이벤트 핸들러에 둘 수 있으면 effect로 빼지 않는다.

## State
- 가능한 한 **지역(colocate)**. 정말 공유할 때만 위로 올린다. **파생 가능한 값은 state로 중복 저장하지 않는다**.
- 불변 업데이트(직접 mutate 금지). 큰 state는 `useReducer`.

## Keys / 렌더
- 리스트 `key`는 **안정적 고유 id**. index key는 정적 리스트 한정(`biome.json`에서 `src/components` 완화 — 그 외 지양).
- 렌더는 **순수**: 사이드이펙트·props/state mutation 금지. 동일 입력 → 동일 출력.

## 메모이제이션 (측정 후)
- `memo`/`useMemo`/`useCallback`은 **증명된 핫패스·참조 안정성**에만. 기본 떡칠 금지(가독성·복잡도↑ → `entropy.md`).
- React Compiler 도입 시 수동 메모는 대부분 불필요 — 컴파일러에 맡기고 수동 메모 제거 검토.

## DON'T
- 조건부 hook · 빠진 deps · effect 남용(파생값 동기화) · index key 남용 · 무분별 메모 · 컴포넌트에 비즈니스 로직(→ `architecture.md`).
