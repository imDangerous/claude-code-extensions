---
name: srs
description: 작업 전 SRS(요구사항 명세)를 작성하고 승인 게이트를 세팅한다. 구현·수정 요청을 받으면 코드 작성보다 먼저 호출한다. "이거 만들어줘", "고쳐줘", "기능 추가", "~~ 진행해줘" 등.
allowed-tools: Read, Write, Bash(git branch:*), Bash(ls:*)
metadata:
  version: 2026.06.0
  role: SRS Author (작업 전 명세 게이트)
---
<!-- Managed by ccx -->
# srs — 작업 전 SRS 작성

구현/수정 요청을 받으면 **코드를 건드리기 전에** SRS를 작성하고 승인 게이트를 세웁니다. 규칙 출처: [`.claude/rules/srs.md`](../../rules/srs.md). 승인 전 소스 편집은 PreToolUse 훅이 차단합니다.

## 활성화 시점
- "만들어줘 / 고쳐줘 / 추가해줘 / 바꿔줘 / ~~ 진행해줘" 등 구현·수정 요청
- 새 작업을 시작할 때 (가장 먼저)

## 구조 (플랫 + frontmatter)

- **프롬프트 1건 = SRS 1개.** 파일명은 `specs/NNNN_<slug>.md` (NNNN = 0001, 0002 … 일련번호).
- **폴더로 묶지 않습니다.** 여러 태스크가 한 작업이면 frontmatter의 `ticket`/`epic` 필드로 연결합니다(경로가 아니라 메타데이터).
- 티켓은 없어도 됩니다. 나중에 생기면 frontmatter `ticket:` 한 줄만 채우면 됩니다(파일명 rename 불필요).

## 절차

### 1. 다음 번호 결정
- `ls specs/` 로 기존 `NNNN_*.md` 중 최대 번호 + 1 (없으면 0001).

### 2. SRS 작성
- `specs/_template/srs.md` 를 복사해 `specs/NNNN_<slug>.md` 로 만듭니다.
- **frontmatter** 를 채웁니다: `id`(번호), `date`(오늘), `branch`(대상 브랜치 — 사용자에게 확인, 미정이면 비움), `ticket`(있으면 RP-xxxx, 없으면 비움), `epic`(묶을 라벨, 선택), `status: draft`.
- **본문의 자리표시자 `<...>` 를 모두 실제 내용으로 교체**합니다(남으면 게이트 통과 불가): 요청(원문), 목표, 수용 기준(검증 가능하게), 범위.

### 3. 활성 포인터 기록
- `specs/.active` 에 방금 만든 SRS 경로를 **한 줄**로 씁니다(예: `specs/0002_edoc-bulk-download.md`).

### 4. 멈추고 승인 요청 — 여기서 구현하지 않는다
- 사용자에게 SRS를 검토하고 승인하도록 안내합니다:

  > 검토 후 승인해 주세요:  `! node .claude/hooks/srs-approve.mjs`
  > (대상 브랜치를 명시하려면: `! node .claude/hooks/srs-approve.mjs feat/xxx`)

- **승인 명령은 절대 에이전트가 대신 실행하지 않습니다**(자기 승인 금지). 승인은 사람만 합니다.
- 승인 전에는 소스 편집을 시도하지 않습니다(어차피 훅이 차단됩니다).

### 5. 승인 후 구현
- 승인되면 `specs/.approvals/NNNN_<slug>.json` 이 생기고 대상 브랜치에서 편집이 열립니다.
- 대상 브랜치로 전환했는지 확인한 뒤 구현을 진행합니다.

## 금지
- 승인 없이 소스 편집 시도 / `srs-approve.mjs` 를 에이전트가 실행 / 자리표시자를 남긴 채 승인 요청 / SRS를 폴더로 묶기.

## 참고
- [`.claude/rules/srs.md`](../../rules/srs.md) — 게이트 규칙·통과 조건
- 템플릿: `specs/_template/srs.md`
