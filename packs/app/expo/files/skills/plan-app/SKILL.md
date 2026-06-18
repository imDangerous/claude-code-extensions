---
name: plan-app
description: 앱 기획서(PRD)를 작성하는 스킬. 유저 스토리, 기능 목록, 화면 구조(Expo Router), 기능↔화면 매핑, API 엔드포인트, MVP 범위를 정의한다. "기획해줘", "PRD 작성", "기능 정의", "화면 흐름 설계", "앱 설계" 요청 시 사용.
---
<!-- Managed by ccx -->

# plan-app — 앱 기획/PRD

아이디어를 구현 가능한 PRD로 변환한다. 실행은 `product-planner` 에이전트에 위임. 구조는 `expo.md`(프레임워크 네이티브)·`architecture.md`(UI/로직 분리)를 따른다.

## Trigger
"기획해줘", "PRD 작성", "기능 정의", "화면 구조/유저 스토리 설계", "앱 설계".

## Input
`_workspace/01_idea_research.md`(있으면) 또는 사용자 설명.

## Steps
1. **요구사항 분석** — 핵심 가치·타겟 페르소나·핵심 vs 부가 기능 분류.
2. **유저 스토리** — "사용자로서 ~하기 위해 ~할 수 있다", 우선순위 P0/P1/P2 + 인수 조건.
3. **화면 구조** — Expo Router 그룹으로 매핑: `(auth)/`·`(tabs)/`·`(modal)/`·스택. 각 화면 주요 UI 요소.
4. **기능 ↔ 화면/모듈 매핑** — 기능별 코드 위치를 **feature-colocation**으로(`src/features/{name}`: ui·hooks·api·store·types 한 폴더). **FSD 레이어(entities/widgets/shared)·강제 barrel로 분해하지 않는다**(`architecture.md`). 라우트 파일은 컨테이너 렌더만(얇게).
5. **API 설계** — 엔드포인트 목록 + Request/Response 타입 초안 + 인증 방식.
6. **MVP 범위** — 1차(P0)/2차(P1) → `_workspace/02_product_plan.md`에 저장.

## 위임
전 단계 `product-planner`. 다음: `spec-planner`(스펙/태스크) → `design-architect`(디자인) → 구현(feature-builder/api-integrator/ui-developer) → QA(qa-reviewer/app-inspector).
