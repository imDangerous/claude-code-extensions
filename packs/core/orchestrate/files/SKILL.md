---
name: orchestrate
description: 장기 작업을 단계(phase)로 분해하고 Go/No-Go 게이트와 자기개선 루프로 감독한다. plan→build→QA→iterate.
---
<!-- Managed by ccx -->

# orchestrate

여러 에이전트/스킬을 **감독(supervisor)** 으로 묶어 장기 작업을 수행한다. 프레임워크 무관 — 구현 단계는 설치된 스택 pack(web/app/…)에 위임.

## 파이프라인 (단계별 핸드오프)
```
plan → design → build(스택 pack) → QA(qa-reviewer) → [FAIL] fix(≤N) → [PASS] 다음 → ship
```
각 단계 산출물을 `_workspace/{phase}.md`에 저장 → 컨텍스트 리셋돼도 파일로 이어간다(Context Reset > Compaction).

## 견고성 장치 (Anthropic harness 설계 원칙)
1. **객관 게이트** — 단계 전환은 qa-reviewer의 Hard Threshold PASS일 때만.
2. **유한 반복** — QA FAIL → 수정 → 재QA, 최대 N회 후 escalate.
3. **능동 테스트** — 읽지 말고 실행(typecheck/lint/test/build).
4. **지속 기억** — `_workspace/` 파일 핸드오프 + `pipeline-status.md`.
5. **회의적 평가자** — qa-reviewer를 관대하지 않게(few-shot·skepticism).
6. **메타 재평가** — 모델/SDK 릴리스마다 스캐폴딩 재평가·가지치기.

## concern 연동
설치된 framework pack의 `concern`(frontend/backend)에 따라 동원 에이전트 세트가 달라진다(FE: design/ui/a11y, BE: api/db/security).

## 사용
사용자 요청 → 단계로 분해 → 각 단계 에이전트/스킬 호출 → 게이트 통과 시 진행 → 막히면 보고.
