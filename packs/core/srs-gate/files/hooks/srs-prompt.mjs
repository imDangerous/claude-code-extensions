#!/usr/bin/env node
// Managed by ccx — 직접 수정 금지(ccx update로 갱신).
// ccx SRS 게이트 (UserPromptSubmit) — 매 프롬프트에 작업 규칙을 컨텍스트로 주입한다(stdout).
process.stdout.write(
  [
    '[SRS 게이트 활성] 이 저장소는 "작업 전 SRS"가 강제됩니다(승인 전 Edit/Write/MultiEdit/NotebookEdit 자동 차단).',
    '구현/수정 요청이면 코드보다 먼저:',
    '  1) specs/NNNN_<slug>.md 에 SRS 작성 (일련번호, 최대번호+1) — frontmatter(id·date·branch·ticket?·epic?) + 본문(요청 원문·목표·수용기준). 자리표시자 <...> 남기지 말 것',
    '  2) specs/.active 에 그 SRS 파일 경로를 한 줄로 기록',
    '  3) 사용자 승인 대기 — 승인은 사람이 직접: ! node .claude/hooks/srs-approve.mjs   (에이전트가 대신 실행 금지)',
    '  4) 승인 후 대상 브랜치에서 구현',
    'SRS는 프롬프트 1건당 1개(플랫 일련번호). 폴더로 묶지 말고, 여러 태스크는 frontmatter ticket/epic 으로 연결. 절차는 skill /srs 참고.',
  ].join('\n') + '\n',
);
process.exit(0);
