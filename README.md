# claude-code-extensions (`ccx`)

> Claude Code 프로젝트에 **AI 표준**을 깔고 특화 pack으로 보강하는 CLI.
> `core`(표준 베이스) → `js`(언어) → `web`/`app`(프레임워크) 레이어. **pack 단위 설치**, 의존 pack 자동 동반.
> MIT · **비공식**(Anthropic과 무관).

```bash
ccx web init     # 웹: core + js + web 자동 동반
ccx app init     # RN: core + js + app (Expo SDK 56)
ccx apply        # 설치된 룰을 CLAUDE.md 관리 블록에 @import
ccx list         # 팩/모듈 목록
```

## 설치 (머신당 1회, 무인증)

```bash
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/latest/download/install.mjs | node
# 버전 핀:
curl -fsSL https://github.com/imDangerous/claude-code-extensions/releases/download/v2.1.0/install.mjs | node
```
`~/.local/bin/ccx` 런처. npm/토큰 불필요.

## 사용법

스택의 **framework pack 하나만 init**하면 `requires` 체인으로 core·js가 **자동 동반**된다.

| 프로젝트 | 명령 | 자동 동반 |
|---|---|---|
| 웹 | `ccx web init` | core + js + web |
| RN | `ccx app init` | core + js + app (Expo SDK 56) |
| (미래) Spring | `ccx spring init` | core + jvm + spring |

```console
$ ccx web init
[i] 의존성 해소: core → js → web
? 패키지 매니저 pnpm   ? 티켓 prefix ABC   ? Tailwind 버전 v3   # 합집합·중복제거 → 1회
[✓] core → rules · skills(orchestrate) · agents(qa-reviewer) · git(commitlint·husky·CI)
[✓] js   → biome · typescript
[✓] web  → nextjs · tailwind(v3)
[✓] .claude/extends/config.json (공유 값 1개)
$ ccx apply
[✓] CLAUDE.md 관리 블록에 룰 @import
```

옵션: `--yes`(질문0) · `--tailwind v4`(variant) · `--only m1,m2` · `--no-install` · `--dir <path>`

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
- **활성화**: 스킬·서브에이전트는 즉시 자동 인식 / **룰은 `ccx apply`** 가 CLAUDE.md에 `@import` 주입해야 로드됨.

> `.claude/extends/`는 커밋 대상. `.claude/` 통째 gitignore면 `init`이 경고.

## 설계 원칙

- **레이어드 pack** — core(표준) → 언어(js/jvm) → 프레임워크(web/app/spring). `requires`로 의존 자동 동반.
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
`node build.mjs` → `dist/bundle.mjs` 자동 임베드. 엔진 변경 불필요.

## 라이선스

MIT
