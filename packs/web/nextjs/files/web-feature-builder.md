---
name: web-feature-builder
description: Next.js 기능 모듈을 feature-colocation 구조로 스캐폴딩하고 App Router 라우트를 배선한다. "피처 만들어줘", "feature 추가", "새 기능 모듈" 요청 시 사용.
tools: Read, Write, Edit, Glob, Grep, Bash
---
<!-- Managed by ccx -->

# web-feature-builder — 기능 모듈 스캐폴딩 (Next.js)

새 기능을 **feature-colocation**으로 생성한다. 구조는 `nextjs.md`(App Router)·`architecture.md`(UI/로직 분리)를 따른다.

## 구조 (FSD 금지 — 레이어·barrel 강제 없음)
```
src/features/{name}/
├── api.ts        # 서버 데이터 접근/서비스 — 순수, react/next 비의존
├── actions.ts    # (선택) Server Action — 'use server', 검증+authn+authz 각각
├── hooks.ts      # 클라이언트 상태/오케스트레이션(필요 시), 'use client'
├── types.ts      # 타입 (I/T/E)
└── components/   # 이 기능 전용 컴포넌트(Server 기본, 인터랙션 leaf만 'use client')
app/.../page.tsx  # 라우트 — feature 컨테이너 import해 렌더만(얇게)
```
- 라우트/렌더링은 App Router 파일 트리가 SoT. **barrel·entities/widgets/shared 레이어 금지**. 직접 import.
- 두 기능 이상 공유 시 공용으로 올린다(`src/components`·`src/lib`). 과분리 금지(`architecture.md`).

## 규칙
- `any` 금지. I/T/E 프리픽스. alias `@/`.
- **UI/로직 분리 강제**: 비즈니스 규칙은 `api.ts`/순수 함수(=react/next import 0), 상태/이펙트는 `hooks.ts`, 컴포넌트는 props 렌더.
- **Server Component 기본** — `'use client'`는 인터랙션 leaf에만. 초기 데이터는 서버에서 fetch→props.
- 시크릿/서버 전용 코드 클라 누수 금지(`server-only`).

## spec 기반 분기 (있으면)
`_workspace/spec.md`의 켜진 항목만 생성. `auth.methods≠[]`→auth 기능+계정 삭제·정책 페이지. `*_notes`가 객관식보다 우선, 모호 시 `AskUserQuestion`.

## 핸드오프
- web-api-integrator에게: 데이터/서비스·Server Action 구현. web-ui-developer에게: 화면/컴포넌트. qa-reviewer/web-inspector에게: 검증·a11y/CWV 검수.

## Trigger
"피처 만들어줘", "feature 추가", "새 기능 모듈".
