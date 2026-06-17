# claude-code-extensions (`ccx`)

> Claude Code 자산(**rules · skills · commands · subagents**)을 카테고리/모듈로 설치·관리하는 CLI.
> 복붙 대신 설치하고, `.claude/extends/<category>/<module>/config.json` 한 곳만 프로젝트별로 바꾼다.
> MIT · **비공식**(Anthropic과 무관).

```
ccx rules git init           # git 커밋/PR 표준(Conventional Commits + gitmoji + 티켓)
ccx skills pr-review init     # (미래) 스킬 설치
ccx commands ship init       # (미래) 슬래시 커맨드
ccx subagents explorer init  # (미래) 서브에이전트
ccx list                     # 사용 가능한 카테고리/모듈
```

## 설치 (머신당 1회, 무인증)

```bash
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node
# 버전 핀:
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/download/v1.0.1/install.mjs | node
```
`~/.local/bin/ccx` 런처가 깔린다(PATH에 `~/.local/bin` 필요). npm/토큰 불필요.

## 명령

```bash
ccx <category> <module> init     # 설치 (대화형)
ccx <category> <module> check    # 설치 전 충돌 점검 (exit 0/1/2)
ccx <category> <module> doctor   # 설치 상태·드리프트 점검
ccx <category> <module> update   # 최신화 (config.json 보존)
ccx <category> <module> remove   # 제거
```

## 설치 위치

- **설정 + 헬퍼**: `.claude/extends/<category>/<module>/` (예: `.claude/extends/rules/git/{config.json, gitmoji-*.cjs}`)
- **프레임워크 강제 위치**(옮길 수 없음): `commitlint.config.cjs`(루트) · `.husky/*` · `.github/workflows/*`
- **Claude Code 자산 위치**: rules→`.claude/rules/`, skills→`.claude/skills/<n>/SKILL.md`, commands→`.claude/commands/<n>.md`, subagents→`.claude/agents/<n>.md`

> `.claude/extends/`는 커밋 대상(팀 공유). `.claude/`를 통째로 gitignore하면 `init`/`doctor`가 경고한다.

## git 모듈 동작

입력 `feat: 로그인` → 훅이 `[RP-12] ✨ 로그인`(ticketPrefix=RP, 브랜치 …/RP-12-…) / `✨ 로그인`(prefix 없음)으로 변환. commitlint이 최종 형식 검증, PR 제목은 CI가 같은 규칙으로 강제.

## 설계 원칙

- **제너릭 엔진 + 선언적 모듈** — 엔진은 모듈을 모르고, 각 모듈이 `module.json`(deps·husky·questions·targets)으로 자신을 기술.
- **표준 파일 전 프로젝트 바이트-동일** — 값은 `config.json`에서 런타임에 읽음 → `doctor`가 드리프트 검출.
- **husky 통합**(경쟁 hooksPath 안 만듦), **훅은 관리 블록만 소유**(사용자 내용 보존), **CI 백스톱**.

## 새 모듈 추가

```
categories/<category>/<module>/
├── module.json    # { name, deps, husky, questions[], targets[] }
└── files/…        # 설치될 파일 (Managed by ccx 헤더)
```
`node build.mjs` → `dist/bundle.mjs`에 자동 임베드. 엔진 변경 불필요.

## 라이선스

MIT
