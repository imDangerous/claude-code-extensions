# link-rules-git

> **Conventional Commits + gitmoji + (선택) 티켓 prefix** 를 한 CLI로 설치·관리.
> 복붙 대신 표준 파일을 깔고, `.link/rules-git.json` 한 곳만 프로젝트별로 바꾼다. MIT.

커밋 입력은 표준 `type: 제목`만 — 훅이 자동으로 변환:

```
feat: 로그인 추가            →  ✨ 로그인 추가
feat: 로그인 추가  (ticketPrefix=RP, 브랜치 …/RP-12-…)  →  [RP-12] ✨ 로그인 추가
```

## 설치 (머신당 1회, 무인증)

```bash
curl -fsSL https://github.com/imDangerous/rules-git/releases/latest/download/install.mjs | node
# 버전 핀:
curl -fsSL https://github.com/imDangerous/rules-git/releases/download/v0.1.0/install.mjs | node
```
`~/.local/bin/link-rules-git` 런처가 깔린다(PATH에 `~/.local/bin` 필요). npm/토큰 불필요.

## 사용

```bash
cd <your-project>
link-rules-git init        # 대화형: 티켓 prefix / 필수 여부 / PM / PR·커밋 CI
link-rules-git init --yes --ticket RP --pm pnpm   # 비대화형
link-rules-git check       # 설치 전 충돌 점검 (exit 0/1/2)
link-rules-git doctor      # 설치 상태·드리프트 점검
link-rules-git update      # 표준 파일 최신화(.link/rules-git.json 보존)
link-rules-git remove      # 제거
```

## 설치되는 것 (모두 표준, 프로젝트별 값은 `.link/rules-git.json` 하나)

```
.link/rules-git.json              # 프로젝트 설정(유일 변수)
scripts/git/gitmoji-map.cjs       # 타입→gitmoji (표준 SoT = @commitlint/config-conventional)
scripts/git/gitmoji-commit.cjs    # 커밋 메시지 변환
commitlint.config.cjs             # 표준 룰 상속 + gitmoji 헤더패턴
.husky/prepare-commit-msg         # 변환 훅 (관리 블록)
.husky/commit-msg                 # commitlint 훅 (관리 블록)
.github/workflows/commit-standards.yml   # PR 제목(+선택: 커밋) CI
.claude/rules/git.md              # 규약 문서(AI/사람용)
```
+ devDeps `@commitlint/cli @commitlint/config-conventional husky` 설치, `package.json` `prepare: husky`.

## 설정 `.link/rules-git.json`

```jsonc
{
  "ticketPrefix": "",        // "" = 티켓 없음 / "RP" = [RP-123] …
  "ticketRequired": false,   // true = 티켓 필수
  "packageManager": "auto",  // auto | pnpm | npm | yarn | bun
  "prTitleCheck": true,      // PR 제목 CI
  "commitMsgCiCheck": false  // PR 커밋 메시지까지 CI 검사(옵션)
}
```

## 설계 원칙

- **표준 파일은 전 프로젝트 바이트-동일** — 값은 `.link/rules-git.json`에서 런타임에 읽음 → `doctor`가 드리프트 검출.
- **husky와 통합**(경쟁 hooksPath 안 만듦), **훅은 관리 블록만 소유**(사용자 내용 보존), **버전 무관 포맷**.
- **CI 백스톱** — 로컬 우회해도 PR 단계에서 표준 강제.
- 명령 패밀리 규칙: `link-` + repo 이름 (예: `rules-biome` → `link-rules-biome`).

## 라이선스

MIT
