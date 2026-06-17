// Managed by link-rules-git. Do not edit — change .link/rules-git.json instead.
//
// 유효 커밋 타입의 SoT = @commitlint/config-conventional 표준 11개.
// ticketPrefix / ticketRequired 는 .link/rules-git.json 에서 런타임에 읽는다
// (이 파일은 모든 프로젝트에서 바이트-동일).
const fs = require('node:fs');
const path = require('node:path');

function loadConfig() {
  try {
    const p = path.resolve(process.cwd(), '.link', 'rules-git.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

const conventional = require('@commitlint/config-conventional');
const cc = conventional.default || conventional;
const STANDARD_TYPES = cc.rules['type-enum'][2];

const EMOJI_BY_TYPE = {
  feat: '✨',
  fix: '🐛',
  docs: '📝',
  style: '💄',
  refactor: '♻️',
  perf: '⚡',
  test: '✅',
  build: '📦',
  ci: '👷',
  chore: '🔧',
  revert: '⏪',
};

const GITMOJI = {};
for (const type of STANDARD_TYPES) {
  const emoji = EMOJI_BY_TYPE[type];
  if (!emoji) {
    throw new Error(
      `gitmoji-map: no gitmoji for standard type '${type}'. Add it to EMOJI_BY_TYPE.`,
    );
  }
  GITMOJI[type] = emoji;
}

const EMOJIS = [...new Set(Object.values(GITMOJI))];

const cfg = loadConfig();
const TICKET_PREFIX = cfg.ticketPrefix || '';
const TICKET_REQUIRED = !!cfg.ticketRequired;

module.exports = { GITMOJI, EMOJIS, STANDARD_TYPES, TICKET_PREFIX, TICKET_REQUIRED };
