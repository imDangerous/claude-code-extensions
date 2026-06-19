<!-- Managed by ccx -->
# 브랜치 전략 — Trunk-Based Development

> 단일 통합 브랜치(`main` = trunk)에 자주 통합한다. main은 항상 릴리스 가능 상태.

## DO
1. **짧은 수명 피처 브랜치** — main에서 분기, ≤ 1~2일 내 머지. 작은 PR.
2. **빈번한 통합** — 매일 main에 머지. 큰 배치 머지 회피.
3. **main 보호** — CI(typecheck/lint/test) 통과해야 머지. PR 경유(직접 push 지양).
4. **미완성은 피처 플래그**로 격리(브랜치 장기화 대신).
5. 릴리스는 main에서 태그(또는 짧은 릴리스 브랜치).

## DON'T
1. 장수 브랜치(`develop`·`release` 상시 유지 = GitFlow) — trunk-based에선 지양.
2. 거대 PR·수일~수주 미머지 브랜치(머지 충돌·통합 지옥).
3. main을 깨진 채 방치.

> 조직/CI 정책이 다르면 프로젝트 `CLAUDE.md`에서 보강. (이 룰은 opt-in — `ccx core init --git-branching`)
