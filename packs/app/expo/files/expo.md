<!-- Managed by ccx -->
# Expo (React Native) — baseline SDK 56

> Expo(managed) + React Native 앱의 AI 작업 표준. 버전 핀은 프로젝트 `package.json`이 SoT —
> 룰은 가급적 SDK 무관한 **불변 규약**을 정의한다. 네이티브 의존성은 `npx expo install`로 호환 버전을 맞춘다(임의 `npm install` 금지).
> baseline(검증, 2026-05): **SDK 56 = RN 0.85 / React 19.2**. New Architecture 기본(SDK 54부터 기본, **SDK 55에서 Legacy 제거** — New-Arch 호환 라이브러리만), **Hermes v1 기본**(SDK 56). UI/로직 분리는 `architecture.md` 따름.

## 스택 (표준)
- **Framework**: React Native + Expo (SDK 56, managed, New Architecture)
- **Routing**: Expo Router (file-based, **typed routes** 활성 — 링크 타입 안전)
- **State**: 전역 = Zustand · 서버 = TanStack Query
- **Styling**: NativeWind (Tailwind for RN)
- **Lists/애니메이션**: FlashList(v2) · Reanimated v4(+Gesture Handler, New Arch 필요)
- **Media**: `expo-video`/`expo-audio` (`expo-av` 제거됨) · **Form**: React Hook Form + Zod
- **Dates**: dayjs · **TypeScript**: strict

## 프로젝트 구조 — 프레임워크 네이티브 + 가벼운 feature 그룹핑
화면 구조의 SoT는 **Expo Router 파일 시스템**이다. 프레임워크와 싸우지 않는다.
```
app/                  # Expo Router — 파일 기반 라우팅 = 화면 구조 SoT (_layout.tsx, (tabs)/, [id].tsx)
src/
├── features/<도메인>/  # 기능 단위로 관련 코드를 colocation (ui·hooks·api·store 한곳에)
├── components/         # 범용 재사용 UI
└── lib/                # 유틸·api 클라이언트·secure-storage 래퍼 등
```
3가지 핵심 규칙 (React 공식 colocation·Redux 공식 feature folder·Bulletproof React(35k)·R.Wieruch이 뒷받침하는 주류):
1. **`app/`는 얇게** — 라우트 파일(`app/(tabs)/index.tsx` 등)은 feature 컨테이너를 import해 **렌더만** 한다(`<FeedContainer/>`). 라우트 파일에 비즈니스 로직·스타일을 두지 않는다(화면 스위치 역할만).
2. **기능 가방 colocation** — `feed` 기능에 필요한 ui·hooks·api·store·types를 `src/features/feed/` 한 폴더에 모은다. 전역 `components/`·`hooks/`·`api/`에 흩지 않는다.
3. **기능 독립성(가급적)** — `features/feed`가 `features/profile` 내부를 **가급적** 직접 import하지 않는다. 두 곳 이상이 공유하면 기능 종속이 아니므로 **공용 위치로 올린다**(`src/components`·`src/lib`, 또는 `src/shared`). 단, 이를 깐깐히 강제하려 다층 레이어/barrel을 만들지 않는다 — 그건 FSD의 리팩토링 지옥(아래)이다.
- import는 직접 경로(`@/` alias 가능)를 선호한다. `features/`는 **단순 폴더 그룹핑**일 뿐, 아래 FSD의 `features` *레이어*와 다르다 — 하위 폴더 구조를 강제하지 않는다.
- 규칙 3은 **가벼운 2버킷 규칙**(feature-local ↔ 공용)이지, FSD의 다층 단방향 import 강제가 아니다(아래 DON'T 참고).

## DON'T — Feature-Sliced Design(FSD) 금지 (CRITICAL)
**이 프로젝트는 FSD를 채택하지 않는다.** `entities`/`features`/`widgets`/`shared` 같은 엄격한 레이어 분리와 단방향 import 규칙, 강제 barrel export(`index.ts` re-export 허브)를 도입하지 말 것. AI는 어떤 경우에도 FSD 구조를 제안·생성하지 않는다.
- **보일러플레이트 폭발**: 버튼/API 하나에 `ui/ model/ api/ index.ts` 등 폴더 여러 개를 파게 돼 생산성이 급락한다.
- **경계 논쟁 비용**: "이건 feature냐 widget이냐 shared냐"로 PR 리뷰 시간이 배가된다.
- **리팩토링 지옥**: 동급 레이어 참조 금지 탓에 기능 A↔B가 데이터를 주고받아야 하면 상위로 억지로 끌어올리며 수십 개 import 경로를 뜯어고치게 된다.
- **프레임워크 충돌**: 파일 기반 Expo Router와 FSD 레이어가 충돌해 진입점이 흐려지고, 강제 barrel export는 파일 추적·트리셰이킹을 망친다.
- 이미 FSD로 깔린 코드를 만나면: 새 코드에 FSD를 확산시키지 말고, 위의 프레임워크 네이티브 구조로 점진 이전한다.

## 코드 컨벤션
- 프로덕션 코드에 `any` 금지. Interface=`I`, Type=`T`, Enum=`E` 프리픽스, 각각 별도 파일.
- import alias `@/` 사용. 변경 후 lint·typecheck·format 실행.
- 모든 스크린에 SafeArea 필수(`react-native-safe-area-context`). 리스트는 FlashList(v2: `estimatedItemSize` 불필요).

## NativeWind 무결성 (CRITICAL)
아래 중 하나라도 누락되면 `className`이 적용 안 돼 **전체 UI가 깨진다**:
| 파일 | 필수 |
|------|------|
| `babel.config.js` | `['babel-preset-expo', { jsxImportSource: 'nativewind' }]` + `'nativewind/babel'` |
| `metro.config.js` | `withNativeWind(config, { input: './global.css' })` |
| `tailwind.config.js` | `presets: [require('nativewind/preset')]` + `content`에 `app/`,`src/` |
| `global.css` | `@tailwind base; components; utilities;` |
| 루트 `_layout.tsx` | `import '../global.css';` |
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` |

## Secure Storage (MANDATORY)
`AsyncStorage`는 평문 — 루팅/탈옥 기기에서 그대로 읽힌다. 민감 데이터는 `expo-secure-store`(iOS Keychain / Android Keystore).
- **SecureStore 필수**: access/refresh 토큰, OAuth·세션 토큰, API 비밀키, 결제 토큰, 비밀번호/PIN, 라이선스 키, PII 결합 토큰.
- **AsyncStorage/MMKV 허용(비민감만)**: 테마·언어·온보딩 플래그·비식별 캐시.
- 토큰 접근은 **전용 SecureStore 래퍼 모듈**(예: `src/lib/secure-storage`)만 경유 — 토큰 직접 접근 코드 산재 금지. Zustand `persist`는 **비민감 슬라이스만** — 토큰 슬라이스를 AsyncStorage 어댑터로 저장 금지(SecureStore-backed 어댑터만).
- iOS 기본 옵션 `WHEN_UNLOCKED_THIS_DEVICE_ONLY`(iCloud 백업 제외). 고위험 토큰은 `requireAuthentication: true`.
- 토큰/PII를 `console.log`/Crashlytics/Analytics, `app.config.ts` `extra`, 클라이언트 `.env`에 노출 금지.

## 날짜/시간 (CRITICAL)
- 오늘 날짜는 **`dayjs().format('YYYY-MM-DD')`** — `new Date().toISOString().split('T')[0]` **금지**(UTC라 UTC+9에서 자정~09시 "어제" 반환).
- N일 전: `dayjs().subtract(N, 'day')`. persist에는 `YYYY-MM-DD`/ISO 문자열만(Date 객체 금지).
- `toISOString()`은 정렬/비교용 타임스탬프에만.

## 수익화/스토어 안티패턴 (통합 시 — 즉시 FAIL 기준)
> 상세 정책 엔진은 프로젝트 구현에 위임. 아래는 위반 시 FAIL인 경계.
- **In-App Review**: 정책 엔진(`canRequestReview`, `maxRequestsPerYear`/`cooldown`/`uiIsIdle`) 미경유 평점 요청 금지. 자체 사전 프롬프트("평점 남겨주실래요?")로 시스템 다이얼로그 유도 금지(정책 위반). `requestReview()`는 fire-and-forget(반환값 분기 금지). 에러/온보딩/결제 실패 직후 요청 금지.
- **AdMob 동의 시퀀스**: `UMP → ATT(iOS) → mobileAds().initialize()` 순서 고정(위반 시 EU eCPM 폭락). `mobileAds().initialize()`·`AdsConsent.*`·`requestTrackingPermissionsAsync`를 **전용 ads 래퍼 모듈** 외부에서 직접 호출 금지. `app.config.ts`에 `NSUserTrackingUsageDescription` + plugin 문구 일치.
- **무효 트래픽 방어**: 한 화면에 배너 1개, 로드 실패 시 컨테이너 collapse(빈 placeholder 금지), 숨김/가림/화면밖 광고 금지, 빈상태·에러·로딩·스플래시에 광고 금지. 전면 포맷은 공유 쿨다운+일일 cap 경유, 리워드 지급은 `EARNED_REWARD` 콜백 내부에서만.

## EAS / 배포
- 빌드·배포는 EAS 표준 절차. `.easignore`로 `_workspace/`·`.claude/`·테스트 산출물 제외. 앱 이름/식별자 일관성 유지.
