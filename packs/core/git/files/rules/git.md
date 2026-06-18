<!-- Managed by ccx -->
# Git 커밋/PR 규약 (ccx 관리)

> 이 파일과 `scripts/git/*`, `commitlint.config.cjs`, `.husky/*`, 커밋 관련 워크플로는
> **`ccx`이 관리**한다. 직접 수정하지 말 것 — 값은 `.claude/extends/config.json`을 바꾸고
> `ccx rules git update` / `ccx rules git doctor`로 갱신·점검한다.

## 커밋 메시지

입력은 **표준 conventional `type: 제목`**으로만. 훅이 자동으로 `[<TICKET>-n] gitmoji 제목`으로 변환한다
(티켓 prefix 미설정 시 `gitmoji 제목`).

```
입력:  feat: 로그인 화면 추가        → 변환:  ✨ 로그인 화면 추가
티켓 prefix 설정 시(브랜치 …/ABC-12-…):  → [ABC-12] ✨ 로그인 화면 추가
```

## type → gitmoji (표준 11개)

| type | gitmoji | | type | gitmoji |
|------|---------|-|------|---------|
| feat | ✨ | | test | ✅ |
| fix | 🐛 | | build | 📦 |
| refactor | ♻️ | | ci | 👷 |
| perf | ⚡ | | chore | 🔧 |
| style | 💄 | | revert | ⏪ |
| docs | 📝 | | | |

표준 밖 type/이모지는 commit-msg 훅에서 차단된다.

## PR 제목

커밋과 동일 형식 `[<TICKET>-n] gitmoji 제목`. CI(`commit-standards.yml`)가 같은 commitlint 규칙으로 강제.

## 설정 (`.claude/extends/config.json`)

```jsonc
{ "ticketPrefix": "", "ticketRequired": false, "packageManager": "auto",
  "prTitleCheck": true, "commitMsgCiCheck": false }
```
