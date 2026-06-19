<!-- Managed by ccx -->
# Spring 언어 규약 — Kotlin

> `spring.md` 구조 규약의 Kotlin 적용 (config `lang=kotlin`).

- **null-safety**: 플랫폼 타입은 경계에서 명시. `!!` 금지 — `?:`/`requireNotNull`로 의도 표현.
- **불변 우선**: `val`·읽기전용 컬렉션. DTO는 `data class`(변형은 `copy`).
- **매핑**: 확장 함수(`fun Entity.toDto()`)로 엔티티↔DTO 변환.
- **DI**: 주생성자 주입. `lateinit`는 테스트/프레임워크 주입 한정.
- **JPA 엔티티**: `class`(데이터클래스 지양 — equals/hashCode·지연로딩 프록시 문제). `kotlin-jpa`(allopen/noarg) 플러그인.
- **코루틴**(도입 시): 블로킹 호출 격리, 트랜잭션 경계·디스패처 주의.
- 테스트 mock은 **MockK**(`testing-backend`).
