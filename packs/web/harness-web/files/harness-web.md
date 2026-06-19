<!-- Managed by ccx -->
# 웹 작업 하네스 (web 특화 검증)

> `agent-workflow.md`(일반 하네스)의 웹 적용. 웹 변경은 **빌드·런타임으로 검증**한다 — 정적 읽기만으로 "된다" 선언 금지.

## 능동 검증 (읽지 말고 실행)
- 기본 typecheck·lint·test + **`build`** — RSC 서버/클라 경계·번들·`server-only` 누수 오류는 build에서만 드러난다.
- **Lighthouse/axe 실측** — a11y(WCAG 2.2 AA)·Core Web Vitals(LCP≤2.5s·INP≤200ms·CLS≤0.1)·SEO를 측정값으로(추정 금지). `web-inspector` Hard Threshold의 근거.
- 가능하면 **preview 배포**에서 확인. UI 변경은 **시각 회귀**(스냅샷) 점검.

## RSC 경계 규율 (변경 후 점검)
- `'use client'` 경계가 의도대로인지(불필요한 상위 승격·클라 시크릿 누수 0) — `nextjs.md`.
- 데이터는 서버 패칭→props, 캐싱 정책 명시 확인.

## 게이트·반복
- 단계 전환은 `web-inspector` PASS(a11y/CWV/보안)일 때만. FAIL→수정→재검수(유한 N회 후 에스컬레이션).

## 핸드오프
- `web-inspector`(QA 실행)·`web-design-architect`(토큰·대비 기준)와 정합. 일반 원칙은 `agent-workflow.md`.
