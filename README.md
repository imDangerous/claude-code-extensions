# claude-code-extensions (`ccx`)

> Claude Code 프로젝트에 **AI 표준**을 깔고 특화 pack으로 보강하는 CLI.
> `core`(표준 베이스) → `js`(언어) → `web`/`app`(프레임워크) · `backend`(Spring)→core. **pack 단위 설치**, 의존 pack 자동 동반.
> 타겟: **React(web) · Expo/RN(app) · Spring(backend)**. MIT · **비공식**(Anthropic과 무관).

```bash
ccx web init      # 웹: core + js + web 자동 동반
ccx app init      # RN: core + js + app (Expo SDK 56)
ccx backend init  # Spring: core + backend (Kotlin/Java)
ccx apply         # 설치된 룰을 CLAUDE.md 관리 블록에 @import(헌법급) + 색인(상세)
ccx list          # 팩/모듈 목록
```

## 설치 (머신당 1회, 무인증)

```bash
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node
# 버전 핀:
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/download/v2.2.1/install.mjs | node
```
`~/.local/bin/ccx` 런처. npm/토큰 불필요.

## 사용법

스택의 **framework pack 하나만 init**하면 `requires` 체인으로 core·js가 **자동 동반**된다.

| 프로젝트 | 명령 | 자동 동반 |
|---|---|---|
| 웹 | `ccx web init` | core + js + web |
| RN | `ccx app init` | core + js + app (Expo SDK 56) |
| Spring | `ccx backend init` | core + backend (Kotlin/Java `--lang`) |

```console
$ ccx web init
[i] 의존성 해소: core → js → web
? 패키지 매니저 pnpm   ? 티켓 prefix ABC   ? Tailwind 버전 v3   # 합집합·중복제거 → 1회
[✓] core → 원칙 룰(agent-workflow·validation·observability·entropy) · git(컨벤션) · qa-reviewer · orchestrate
[✓] js   → architecture · biome · typescript · react · validation-zod · git-hooks(commitlint·husky·CI)
[✓] web  → nextjs · tailwind(v3) · vitest · harness-web · observability-web · 에이전트
[✓] .claude/extends/config.json (공유 값 1개)
$ ccx apply
[✓] CLAUDE.md 관리 블록에 룰 @import
```

옵션: `--yes`(질문0) · `--tailwind v4`(variant) · `--only m1,m2` · `--no-install` · `--dir <path>`

### 옵트인: SRS 게이트 (`--srs-gate`)
`ccx core init --srs-gate` — **작업 전 SRS 강제**. 승인된 SRS 없이는 소스 편집을 **PreToolUse 훅이 차단**(지시 아닌 훅이 수행 → 우회 불가). 프롬프트 1건 = `specs/NNNN_<slug>.md` 1개(frontmatter: id·date·branch·ticket·epic·status), 사람 승인(`! node .claude/hooks/srs-approve.mjs`) 후 대상 브랜치에서만 구현. 스킬 `/srs` · 룰 `.claude/rules/srs.md`. 기본 off.

## 명령

```bash
ccx <pack> init                  # 팩 설치 (requires 자동 동반)
ccx <pack> check|doctor|update|remove   # 대상 팩 모듈
ccx apply                        # 룰 → CLAUDE.md @import
ccx list
```

## 설치 위치

- **공유 설정**: `.claude/extends/config.json` (전 팩 합집합·중복제거 1개) + 모듈 헬퍼 `.claude/extends/<pack>/<module>/`
- **프레임워크 강제(고정)**: `commitlint.config.cjs`(루트) · `.husky/*` · `.github/workflows/*`
- **Claude 자산**: 룰→`.claude/rules/`, 스킬→`.claude/skills/<n>/SKILL.md`, 서브에이전트→`.claude/agents/<n>.md`
- **활성화**: 스킬·서브에이전트는 즉시 자동 인식 / **룰은 `ccx apply`**. 룰은 2계층 — `<!-- ccx:always -->` 마커(헌법급 원칙)만 CLAUDE.md에 `@import`(always-on), 나머지는 **상세 색인**(경로+제목)으로 두고 해당 영역 작업 시 읽는다(always-on 컨텍스트 최소화).

> `.claude/extends/`는 커밋 대상. `.claude/` 통째 gitignore면 `init`이 경고.

## 설계 원칙

- **레이어드 pack** — core(표준) → js(언어) → web/app(프레임워크) · backend(Spring)는 core 직속(JVM, js 비경유). `requires`로 의존 자동 동반.
- **concern 태그**(frontend/backend) — framework가 선언, orchestrate가 동원 에이전트 세트를 정함.
- **variant vs baseline** — variant(사용자 선택, tailwind v3↔v4) / baseline(현행 최신, Expo SDK 56) — 릴리스마다 bump.
- **표준 파일 전 프로젝트 동일** — 값은 `config.json`, `doctor`가 드리프트 검출. 훅은 관리 블록만 소유.
- **자기개선 루프** — (A) 프로젝트: orchestrate+qa-reviewer(Hard Threshold)·iterate · (B) 표준: doctor(게이트)+update(전파)+version(재평가).

## 새 pack / 모듈

```
packs/<pack>/pack.json          # { name, description, requires:[], concern }
packs/<pack>/<module>/module.json   # { name, deps, husky, questions[], targets[] }
packs/<pack>/<module>/files/…   # 설치 파일 (Managed by ccx)
```
타깃 `kind`: `doc`(룰/스킬, 전체 관리) · `static`(파일 그대로, `exec`/`createOnly`) · `hook`(셸 훅 블록 병합, `blockId`/`soleOwner`) · `settings`(`.claude/settings.json` JSON 멱등 병합, `_ccx` 소유 마커).
`node build.mjs` → `dist/bundle.mjs` 자동 임베드. 엔진 변경 불필요.

## 라이선스

MIT
