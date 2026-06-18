<!-- Managed by ccx -->
# Next.js App Router

> App Router 전용. Pages Router·SSR API 금지.

## DO
1. **Server Component 기본** — 인터랙션 필요 시에만 `'use client'`를 최하위에.
2. 클라이언트 경계 최소화 — 클라이언트가 `children`으로 서버 컴포넌트를 받게.
3. **mutation = Server Action**(`actions/`), Route Handler(`api/`)는 웹훅·외부 연동만.
4. Server Action 입력 검증(zod 도입 시), `'use server'`는 신뢰 경계.
5. `fetch` 캐시 정책 명시(`no-store`/`revalidate`/`tags`).
6. `error.tsx`는 가장 구체적 segment에, 메타데이터는 `metadata`/`generateMetadata`.
7. `next/image`·`next/font` 사용, page.tsx는 조합·레이아웃만.

## DON'T
1. Pages Router API(`getServerSideProps` 등)·`next/head` 금지.
2. `app/`·`pages/` 혼용 금지.
3. 서버 전용 코드 클라이언트 누수 금지(`server-only`).
4. `NEXT_PUBLIC_*` 아닌 env 클라이언트 참조 금지.
5. Route Handler를 mutation에 쓰지 않는다.

> 프로젝트 고유 라우팅/도메인은 ccx 관리 밖 — 프로젝트 문서/CLAUDE.md에 둔다.
