<!-- Managed by ccx -->
# SRS 게이트 — 작업 전 명세 강제

이 저장소는 **작업 전 SRS 작성**을 강제합니다. 승인된 SRS 없이는 소스 편집(Edit/Write/MultiEdit/NotebookEdit)이 PreToolUse 훅으로 **차단**됩니다. 강제는 지시가 아니라 훅이 수행하므로 우회되지 않습니다.

> 철학: 구현 결과물보다 **작업 요청의 기록(=SRS)** 이 더 중요합니다. SRS만으로 작업을 재현(replay)할 수 있어야 합니다.

## 구조 (플랫 + frontmatter)

```text
specs/
├── .active                       # 현재 작업 중인 SRS 경로 한 줄
├── _template/srs.md
├── 0001_edoc-bulk-download.md    # 프롬프트 1건 = SRS 1개, 일련번호로 누적
├── 0002_fix-login-redirect.md
└── .approvals/                   # 승인 마커(기계용)
    └── 0001_edoc-bulk-download.json
```

- **파일명 = `NNNN_<slug>.md`** — 일련번호라 판단 불필요(최대번호+1). 정렬·유일성·리플레이 순서 자동.
- **폴더로 묶지 않음** — 여러 태스크가 한 작업이면 frontmatter `ticket`/`epic` 로 연결(쿼리: `grep "ticket: RP-1234" specs/*.md`).
- **티켓 불필요** — 없으면 `ticket:` 비움. 사후에 생기면 그 줄만 채움(파일명 안 바꿈).
- `specs/.active` 한 줄이 "지금 작업 중인 SRS" 를 가리킵니다. 브랜치가 아니라 이 포인터로 식별하므로 main↔dev 를 오가도 동작합니다.

### frontmatter 필드
`id`(번호) · `date` · `branch`(대상 브랜치) · `ticket`(선택) · `epic`(묶음 라벨, 선택) · `status`(draft→approved→done)

## 흐름

1. SRS 작성 — `specs/_template/srs.md` 복사 → `specs/NNNN_<slug>.md`. frontmatter + 본문(요청·목표·수용기준) 채움, 자리표시자 `<...>` 제거. → skill `/srs`
2. `specs/.active` 에 그 SRS 경로 기록.
3. **사용자 승인** — 사람이 직접 `! node .claude/hooks/srs-approve.mjs [브랜치]` 실행. 승인 명령은 **에이전트가 대신 실행하지 않습니다**(자기 승인 금지).
4. 승인되면 `specs/.approvals/NNNN_<slug>.json` 이 생기고, **대상 브랜치에서만** 소스 편집이 허용됩니다.

## 게이트 통과 조건 (훅이 검사)

- `specs/.active` 가 가리키는 SRS 파일이 존재
- 본문 내용이 채워짐(자리표시자 `<...>` 잔재 없음)
- `specs/.approvals/<해당 SRS>.json` 존재(= 사람이 승인)
- 승인 기록의 대상 브랜치 == 현재 git 브랜치

`specs/**` 편집(=SRS 작성)은 항상 허용됩니다. 긴급 운영자 우회는 `CCX_SRS_OFF=1` (명시적, 상시 사용 금지).

## 한계

훅이 막는 범위는 Edit/Write/MultiEdit/NotebookEdit 입니다. 셸로 직접 파일을 바꾸는(`sed`, 리다이렉트 등) 우회는 막지 않으니, 편집은 표준 도구로 합니다.
