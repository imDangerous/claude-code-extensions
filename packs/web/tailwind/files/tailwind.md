<!-- Managed by ccx -->
# Tailwind CSS (variant: v3 기본 / v4)

> 버전은 `.claude/extends/config.json`의 `tailwind`(기본 `v3`). 레거시 브라우저/기기 호환이 필요하면 v3.

## 공통
- 클래스 병합은 `cn()`(clsx + tailwind-merge) 유틸을 둔다(예: `src/lib/cn.ts`).
- **모바일 퍼스트** — 375px 기본, `min-width` 확장. `max-width` 쿼리 금지.
- 의미 토큰은 설정(theme)이 SoT. `!important`·CSS-in-JS 금지.

## v3 (기본)
- `tailwind.config.{js,ts}` + `content` 경로. PostCSS/Autoprefixer.
- Biome가 CSS를 파싱 가능.

## v4 (옵트인)
- CSS `@theme`/`@apply` 지시어 기반. Biome CSS 파서가 못 읽으니 `*.css`를 Biome 스캔에서 제외.

## 터치 UX
- 터치 타깃 ≥ 44px, `:active` 피드백, 동적 뷰포트(`dvh`).
