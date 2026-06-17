// Managed by ccx. Do not edit — change .claude/extends/rules/git/config.json instead.
//
// 표준 Conventional Commits 룰(config-conventional)을 상속하고,
// 헤더 형식만 `[PREFIX-n] gitmoji 제목`으로 재정의한다.
const { EMOJIS, TICKET_PREFIX, TICKET_REQUIRED } = require('./.claude/extends/rules/git/gitmoji-map.cjs');

const alt = EMOJIS.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

// 티켓 prefix 설정 여부/필수 여부에 따라 헤더패턴 구성
let ticketPart = '';
let hasTicketGroup = false;
if (TICKET_PREFIX) {
  const group = `\\[(${TICKET_PREFIX}-\\d+)\\] `;
  ticketPart = TICKET_REQUIRED ? group : `(?:${group})?`;
  hasTicketGroup = true;
}

const headerPattern = new RegExp(`^${ticketPart}(${alt}) (.+)$`, 'u');
const headerCorrespondence = hasTicketGroup
  ? ['ticket', 'type', 'subject']
  : ['type', 'subject'];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: { parserOpts: { headerPattern, headerCorrespondence } },
  rules: {
    'type-enum': [2, 'always', EMOJIS],
    'type-case': [0], // 이모지는 대소문자 개념 없음
  },
};
