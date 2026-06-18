<!-- Managed by ccx -->
# Next.js App Router (16 / React 19)

> App Router 전용. Pages Router·SSR API 금지. baseline: Next.js 16(Turbopack 기본·React 19.2). UI/로직 분리는 `architecture.md` 따름.

## DO
1. **Server Component 기본** — `'use client'`는 상태/이벤트/브라우저 API가 필요한 **최하위 leaf**에만. `'use client'`는 경계 — 그 모듈이 import하는 전부가 클라 번들에 포함되니 디렉티브를 트리 아래로 민다.
2. 클라이언트 경계 최소화 — 서버 컴포넌트를 `children`/props(slot)로 클라 컴포넌트에 전달(서버에서 렌더, 클라 번들 미포함). Context Provider는 `{children}` 감싸는 클라 컴포넌트로, 가능한 깊게.
3. **mutation = Server Action**, Route Handler는 웹훅·외부 연동만.
4. **Server Action은 공개 POST 엔드포인트로 취급** — 모든 `'use server'` 함수가 **독립적으로** 입력 검증(zod) + 인증 + 인가(소유권) 수행. `proxy.ts`(구 middleware)는 보안 경계가 아니다(CVE-2025-29927) — 데이터 접근 지점마다 방어.
5. **캐싱은 opt-in** — Next 15+부터 `fetch`/GET Route Handler 기본 비캐시, 16은 기본 요청시 실행. 캐시는 `'use cache'`(Cache Components)로 명시. 재검증 `revalidateTag(tag, profile)`(프로필 필수), 폼/설정은 `updateTag`, 비캐시 갱신은 `refresh()`.
6. **느린 데이터는 `Suspense` 스트리밍** — 서버→클라로 promise 전달 후 React `use`로 unwrap. 정적 셸 + 동적 hole은 Cache Components/PPR(`cacheComponents: true`).
7. `params`/`searchParams`/`cookies()`/`headers()`/`draftMode()`는 **async — `await`** 한다(16).
8. `next/image`(`images.remotePatterns`, AVIF/WebP·치수 지정으로 CLS 방지)·`next/font`. `error.tsx`는 가장 구체적 segment, 메타데이터는 `metadata`/`generateMetadata`. page.tsx는 조합·레이아웃만.

## DON'T
1. Pages Router API(`getServerSideProps` 등)·`next/head` 금지. `app/`·`pages/` 혼용 금지.
2. 서버 전용 코드 클라이언트 누수 금지 — `server-only` 패키지로 빌드타임 차단. `NEXT_PUBLIC_*` 아닌 env 클라 참조 금지(비prefix는 빈 문자열로 치환).
3. Route Handler를 mutation에 쓰지 않는다. `next lint`(제거됨) 대신 ESLint/Biome 직접.
4. **프레젠테이션 컴포넌트에서 직접 패칭·비즈니스 로직 금지**(`architecture.md`) — 패칭은 서버 컴포넌트/서비스, 도메인 로직은 순수 함수.
5. **Feature-Sliced Design(FSD) 금지** — `entities`/`widgets`/`shared` 엄격 레이어·다층 단방향 import·강제 barrel export 도입 안 함. App Router 파일 시스템을 구조 SoT로(프레임워크와 싸우지 않는다), 비즈니스 로직만 기능별로 가볍게 colocation. (이유: 보일러플레이트 폭발·경계 논쟁·리팩토링 지옥·파일기반 라우팅 충돌·barrel이 RSC 경계/트리셰이킹 손상.)

> 프로젝트 고유 라우팅/도메인은 ccx 관리 밖 — 프로젝트 문서/CLAUDE.md에 둔다.
