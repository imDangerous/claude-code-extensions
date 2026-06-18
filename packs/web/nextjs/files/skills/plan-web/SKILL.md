---
name: plan-web
description: 웹 제품 기획서(PRD)를 작성하는 스킬. 유저 스토리, 기능 목록, 사이트맵/라우트(App Router), SEO, 렌더링·캐싱 계획, 지표(Core Web Vitals/전환), MVP를 정의한다. "기획해줘", "PRD 작성", "사이트맵/라우트 설계", "웹 설계" 요청 시 사용.
---
<!-- Managed by ccx -->

# plan-web — 웹 제품 기획/PRD

아이디어를 구현 가능한 웹 PRD로 변환한다. 실행은 `web-product-planner` 에이전트에 위임. 구조는 `nextjs.md`·`architecture.md`를 따른다.

## Trigger
"기획해줘", "PRD 작성", "사이트맵/라우트 설계", "유저 스토리", "웹 설계".

## Input
`_workspace/01_idea_research.md`(있으면) 또는 사용자 설명.

## Steps
1. **요구사항 분석** — 핵심 가치·타겟 페르소나·핵심 vs 부가.
2. **유저 스토리** — "사용자로서 ~", 우선순위 P0/P1/P2 + 인수 조건.
3. **사이트맵/라우트** — IA를 App Router 트리로(`(marketing)/`·`(app)/`·`api/`). 라우트 파일은 컨테이너 렌더만(얇게). **FSD 레이어/강제 barrel 금지**(`nextjs.md`).
4. **렌더링·캐싱 계획** — 라우트별 Server/Client 경계, 정적/ISR/동적, 스트리밍 대상.
5. **SEO + 지표** — 페이지별 title/description/canonical/OG/JSON-LD. Core Web Vitals 목표(LCP≤2.5s·INP≤200ms·CLS≤0.1) + 전환 퍼널/이벤트(웹 애널리틱스, PII 금지).
6. **MVP 범위** — 1차(P0)/2차(P1) → `_workspace/02_product_plan.md`.

## 위임
전 단계 `web-product-planner`. 다음: `web-spec-planner` → `web-design-architect` → 구현(web-feature-builder/web-api-integrator/web-ui-developer) → QA(qa-reviewer/web-inspector).
