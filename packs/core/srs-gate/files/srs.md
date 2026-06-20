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
5. **구현** — 대상 브랜치에서 진행.
6. **평가자 검수 → 완료** — 구현이 끝나면 아래 "검수 게이트" 절차를 거쳐 `status: done`. 검수 없이 done 으로 닫으려 하면 Stop 훅이 차단.

## 게이트 통과 조건 (훅이 검사)

- `specs/.active` 가 가리키는 SRS 파일이 존재
- 본문 내용이 채워짐(자리표시자 `<...>` 잔재 없음)
- `specs/.approvals/<해당 SRS>.json` 존재(= 사람이 승인)
- 승인 기록의 대상 브랜치 == 현재 git 브랜치

`specs/**` 편집(=SRS 작성)은 항상 허용됩니다. 긴급 운영자 우회는 `CCX_SRS_OFF=1` (명시적, 상시 사용 금지).

## 검수 게이트 (review-gate, Stop 훅) — 개발 후 평가자 검수 강제

작업 전 spec 만 강제하면 "스펙대로 만든 뒤 검수를 건너뛰는" 비대칭이 생깁니다. `review-gate.mjs`(Stop 훅)는 그 대칭 짝으로, **완료 선언 시점**에 평가자 검수를 강제합니다. 근거: `agent-workflow.md` 규칙 8(생성자≠평가자)·규칙 13(강제는 산문이 아니라 훅으로).

흐름: **구현 → 별도 평가자 검수 → PASS 기록 → `status: done`**

1. 구현 후, 변경분을 **생성자가 아닌 별도 평가자**로 검수합니다:
   - `qa-reviewer`(객관 Hard Threshold) — 필수
   - `web-inspector`(a11y · CWV · RSC 경계) — UI 변경 시
2. PASS 면 기록합니다(에이전트 호출 가능 — 승인과 달리 사람 전용 아님):

   > `! node .claude/hooks/srs-review.mjs PASS "tsc:0 biome:0 qa-reviewer:PASS ..."`

   → `specs/.reviews/NNNN_<slug>.json` 생성(`.approvals/` 와 대칭).
3. 그 뒤 SRS frontmatter 를 `status: done` 으로 바꿉니다.

**Stop 훅 동작**: active SRS 가 `status: done` 인데 검수 PASS 기록이 없으면 세션 종료를 차단합니다. `done` 이전(구현 중)·비작업 브랜치·검수 기록 존재 시엔 통과 — 구현 중 stop·사용자 질문은 막지 않습니다.

- verdict 는 **생성자 자기채점 금지** — 별도 평가자의 결과를 그대로 기록합니다.
- FAIL 이면 `status` 를 done 에서 되돌리고 수정 후 재검수합니다.
- 우회: `CCX_SRS_OFF=1`. `srs-review.mjs` 는 에이전트가 호출 가능하므로 verdict 위조는 가능 — 검수를 **기본 경로**로 만들고 생략에 **마찰**을 주는 보조 장치이지 불가침 케이지는 아닙니다.

## 자리표시자 표기 규약 — `<...>` vs `{...}`

게이트는 SRS 본문에 템플릿 자리표시자가 남았는지 정규식 `/<[^>\n]{2,}>/` 로 검사합니다(잔재 있으면 승인 차단).

- **ASCII 꺾쇠로 감싼 토큰 = "채워 넣어라" 미완성 자리표시자 전용** — 채울 때 전부 제거합니다.
- SRS 본문에 **남겨야 하는 리터럴 꺾쇠 토큰**(명령 usage·파일명 패턴 등)은 꺾쇠 대신 **중괄호 `{...}`** 로 적습니다. 꺾쇠로 적으면 게이트가 미완성으로 보고 차단합니다.
- 승인이 "자리표시자 잔재"로 막히면 잔여 토큰을 직접 찾습니다:

```bash
grep -nE '<[^>]{2,}>' specs/NNNN_your-srs.md   # 매칭 줄의 꺾쇠 토큰을 제거하거나 {...} 로 치환
```

## 한계

훅이 막는 범위는 Edit/Write/MultiEdit/NotebookEdit 입니다. 셸로 직접 파일을 바꾸는(`sed`, 리다이렉트 등) 우회는 막지 않으니, 편집은 표준 도구로 합니다.
