<!-- Managed by ccx -->
<!-- ccx:always -->
# 프론트엔드 아키텍처 — UI/로직 분리 (Humble View + hooks as ViewModel)

> 컴포넌트 기반 UI(React·React Native)에서 **비즈니스 로직이 UI를 직접 다루지 않게** 한다. UI는 자주 바뀌므로 갈아끼울 수 있어야 하고(swappable), 로직은 렌더러 없이 테스트 가능해야 한다.
> 근거: Fowler **Humble Object/Presentation Model**, React 공식 "custom hooks = stateful logic 공유", **headless 컴포넌트**(Radix·TanStack·React Aria). MVC/MVP/MVVM이 공유하는 원칙의 현대 React 구현.

## 3계층 — 각 계층은 한 가지 일만, 안쪽으로만 의존
1. **도메인/서비스 (순수·프레임워크 무관)** — 비즈니스 규칙·검증·계산·포매팅 + 데이터 접근(API·storage 클라이언트).
   - **`react`/`react-native`/`next`를 import하지 않는다.** 이 제약이 테스트성과 web↔RN 이식성의 핵심(=Humble Object). 같은 코드가 web·RN·Node 테스트에서 그대로 돈다.
2. **hooks ("ViewModel")** — 상태·사이드이펙트·오케스트레이션. `useState`/`useEffect`/데이터패칭을 소유하고 도메인/서비스를 호출, 화면에 줄 **state + 핸들러**를 반환. (MVVM의 ViewModel / Presentation Model의 현대 구현 — 컨테이너 컴포넌트를 대체.)
3. **프레젠테이션 (dumb 컴포넌트)** — props(데이터+콜백)를 받아 **렌더만** 하고 이벤트를 위로 emit. 패칭·비즈니스 규칙·API 클라이언트 import 없음(=Humble/Passive View → 갈아끼우기 쉬움).

> **headless**는 이 분리의 productized 형태: 동작/접근성/상태는 hook(`useDropdown`, TanStack Table, React Aria)이, 렌더는 소비자가. "로직은 라이브러리, UI는 너".
> **React Native 동일**: 도메인·hook 계층이 `react-native`를 import하지 않으므로 web과 그대로 공유, 프레젠테이션(`View`/`Text` vs DOM)만 다르다.

## DO (각 항목 검증 가능)
1. 비즈니스 규칙·검증·계산은 `domain/`(또는 `lib/`)의 **순수 함수**로. → 그 파일들은 `react`/`react-native`/`next` import 0 (ESLint `no-restricted-imports`로 강제).
2. 데이터 패칭·사이드이펙트는 **hook 또는 서비스**에. 프레젠테이션 컴포넌트엔 `fetch`/`axios`/query-client import·I/O `useEffect` 없음.
3. 컴포넌트는 props로 데이터+콜백을 받고 이벤트를 emit. dumb 컴포넌트는 도메인 모듈·API 클라이언트를 직접 import하지 않는다.
4. 도메인 로직은 렌더러 없이 테스트(Node 단위 테스트, jsdom/RTL 불필요 — 빠르다).
5. 복잡한 인터랙티브 위젯은 **headless 라이브러리**(Radix·TanStack·React Aria·Headless UI)로 접근성+스타일 교체성 확보.
6. hook은 기능 폴더에 colocation. 한 컴포넌트만 쓰는 일회성 hook은 그 옆에 둬도 된다.

## DON'T (즉시 교정 대상)
1. **JSX/이벤트 핸들러 안에 비즈니스 로직 금지** — `onClick`은 가격/권한을 인라인 계산하지 말고 hook/서비스 핸들러를 호출.
2. **프레젠테이션 컴포넌트에서 직접 패칭 금지** — 루프/누수 위험 + 재사용·테스트 불가.
3. **컴포넌트가 API 클라이언트/axios/query-client를 직접 import 금지** — 서비스 계층 경유(HTTP 라이브러리 교체가 컴포넌트를 건드리지 않게).
4. **도메인/유틸이 `react`/`react-native`/`next` import 금지** — 이식성·테스트성 파괴.
5. **컨테이너/프레젠테이션 래퍼 컴포넌트로 분리하지 말 것** — 폐기된 방식(Dan Abramov 본인 철회). custom hook이 그 역할을 더 가볍게 한다.
6. `useMount` 류 lifecycle 래핑 hook 금지(react.dev 권고) — 구체적 use case 단위 hook으로.

## 과분리 경고 — 분리하되 과하게 추상화하지 않는다 (가장 중요한 뉘앙스)
- **AHA** (Kent C. Dodds): "잘못된 추상화보다 중복이 낫다". 공통점이 "소리칠 때"까지 기다렸다 추상화.
- **Rule of Three**: 실제 중복 ~3회 전엔 추출하지 않는다.
- React 공식: "작은 중복마다 custom hook을 뽑을 필요 없다 — 약간의 중복은 괜찮다." 일회성 hook 추출은 가독성을 되레 떨어뜨린다.
- **풀 Clean/Hexagonal(ports/adapters·DI)은 프론트에서 niche/과설계** — 대부분은 *서비스 계층 + custom hooks + dumb 컴포넌트*면 충분. 거대·장수명·복잡 도메인(핀테크/엔터프라이즈)에서만 더 간다.
- 휴리스틱: **세 책임(렌더 vs 오케스트레이션 vs 비즈니스 규칙)은 항상 개념적으로 구분**하되, 재사용·테스트성·복잡도가 요구할 때만 별도 파일/계층으로 승격.

## 출처
- martinfowler.com/bliki/HumbleObject.html · /eaaDev/PresentationModel.html · /articles/headless-component.html
- react.dev/learn/reusing-logic-with-custom-hooks · kentcdodds.com/blog/aha-programming
- radix-ui.com · tanstack.com · react-aria.adobe.com
