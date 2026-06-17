# claude-rules

> Claude Code 프로젝트용 **룰셋을 모듈 단위로 설치·관리**하는 CLI. 복붙 대신 표준 파일을 깔고,
> `.claude-rules/<module>.json` 한 곳만 프로젝트별로 바꾼다. MIT · **비공식**(Anthropic과 무관).

```
claude-rules git init       # git 커밋/PR 표준(Conventional Commits + gitmoji + 티켓) 설치
claude-rules biome init     # (미래) biome 룰셋 설치
claude-rules list           # 사용 가능한 모듈
```

현재 모듈: **git**. 모듈은 `modules/<name>/`(manifest + files)로 추가된다.

## 설치 (머신당 1회, 무인증)

```bash
curl -fsSL https://github.com/imDangerous/claude-rules/releases/latest/download/install.mjs | node
# 버전 핀:
curl -fsSL https://github.com/imDangerous/claude-rules/releases/download/v0.1.0/install.mjs | node
```
`~/.local/bin/claude-rules` 런처가 깔린다(PATH에 `~/.local/bin` 필요). npm/토큰 불필요.

## 사용

```bash
cd <your-project>
claude-rules git init                         # 대화형
claude-rules git init --yes --ticket RP --pm pnpm   # 비대화형
claude-rules git check                         # 설치 전 충돌 점검 (exit 0/1/2)
claude-rules git doctor                        # 설치 상태·드리프트 점검
claude-rules git update                        # 표준 파일 최신화(.claude-rules/git.json 보존)
claude-rules git remove                        # 제거
```

## git 모듈이 설치하는 것

```
.claude-rules/git.json            # 프로젝트 설정(유일 변수)
scripts/git/gitmoji-map.cjs       # 타입→gitmoji (표준 SoT = @commitlint/config-conventional)
scripts/git/gitmoji-commit.cjs    # 커밋 메시지 변환
commitlint.config.cjs             # 표준 룰 상속 + gitmoji 헤더패턴
.husky/prepare-commit-msg         # 변환 훅 (관리 블록)
.husky/commit-msg                 # commitlint 훅 (관리 블록)
.github/workflows/commit-standards.yml   # PR 제목(+선택: 커밋) CI
.claude/rules/git.md              # 규약 문서
```
입력 `feat: 로그인` → 훅이 `[RP-12] ✨ 로그인`(ticketPrefix=RP, 브랜치 …/RP-12-…) / `✨ 로그인`(prefix 없음)으로 변환.

## 설계 원칙

- **제너릭 엔진 + 선언적 모듈** — 엔진은 모듈을 모르고, 모듈은 `module.json`(deps·targets·questions·blocks)으로 자신을 기술.
- **표준 파일 전 프로젝트 바이트-동일** — 값은 `.claude-rules/<module>.json`에서 런타임에 읽음 → `doctor`가 드리프트 검출.
- **husky 통합**(경쟁 hooksPath 안 만듦), **훅은 관리 블록만 소유**(사용자 내용 보존), **CI 백스톱**.

## 새 모듈 추가

```
modules/<name>/
├── module.json    # { name, deps, husky, questions[], targets[] }
└── files/…        # 설치될 파일들 (Managed by claude-rules 헤더 포함)
```
`node build.mjs` → `dist/bundle.mjs`에 자동 임베드.

## 라이선스

MIT
