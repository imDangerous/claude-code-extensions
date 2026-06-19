<!-- Managed by ccx -->
# Spring 언어 규약 — Java

> `spring.md` 구조 규약의 Java 적용 (config `lang=java`).

- **DTO**: `record`(불변). **엔티티엔 record 금지**(JPA 기본 생성자·가변성 필요).
- **Optional**: 반환 타입에만(필드·파라미터 금지). null 반환 지양.
- **불변 우선**: `final` 필드·방어적 복사.
- **DI**: 생성자 주입(`final` 필드). Lombok `@RequiredArgsConstructor`는 팀 정책 따름.
- **스트림/함수형**: 가독성 우선 — 과도한 체이닝·중첩 람다 지양(`entropy.md`).
- 테스트 mock은 **Mockito**(`testing-backend`).
