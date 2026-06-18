<!-- Managed by ccx -->
# Expo (React Native) — baseline SDK 56

> ⚠️ **스캐폴드 스텁.** 현재는 규약 골격만. 실제 RN 룰·스킬(FSD scaffold·ui-developer·nativewind)은
> RN 템플릿에서 추출·de-RN + SDK 54→56 갱신 후 채운다(미완).

## baseline
- **Expo (managed) 기본**, **SDK 56** 의존성에 맞춘다. 호환 라이브러리 우선.
- baseline은 새 SDK 릴리스마다 bump(메타 재평가 루프).

## 원칙 (RN 공통)
- 모바일 퍼스트, 터치 타깃 ≥ 44px, SafeArea 처리.
- 상태: 전역=Zustand, 서버=TanStack Query(또는 RN 표준).
- 네이티브 의존성은 Expo SDK 56 호환 버전으로 고정.

## TODO (추출 예정)
- create-feature / create-screen (FSD scaffold, RN)
- ui-developer / feature-builder 에이전트
- nativewind 규칙
